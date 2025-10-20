"""
WebSocket Service - Manages real-time connections and broadcasting
Part of the DeCrypt backend services
"""

import asyncio
import json
import logging
from typing import Dict, List, Set, Any, Optional
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

class WebSocketService:
    """
    Service for managing WebSocket connections and real-time updates
    """
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: Dict[str, WebSocket] = {}
        self.connection_metadata: Dict[WebSocket, Dict[str, Any]] = {}
        self.subscriptions: Dict[str, Set[WebSocket]] = {
            "tokens": set(),
            "portfolio": set(),
            "chat": set(),
            "education": set()
        }
    
    async def connect(self, websocket: WebSocket, user_id: str, connection_type: str = "general"):
        """Accept a new WebSocket connection"""
        try:
            await websocket.accept()
            
            # Store connection
            self.active_connections.append(websocket)
            self.user_connections[user_id] = websocket
            
            # Store metadata
            self.connection_metadata[websocket] = {
                "user_id": user_id,
                "connection_type": connection_type,
                "connected_at": datetime.now().isoformat(),
                "last_activity": datetime.now().isoformat()
            }
            
            logger.info(f"User {user_id} connected via WebSocket ({connection_type})")
            return True
            
        except Exception as e:
            logger.error(f"Error connecting WebSocket: {e}")
            return False
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        """Remove a WebSocket connection"""
        try:
            # Remove from active connections
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
            
            # Remove user connection
            if user_id in self.user_connections:
                del self.user_connections[user_id]
            
            # Remove from subscriptions
            for topic, connections in self.subscriptions.items():
                if websocket in connections:
                    connections.remove(websocket)
            
            # Remove metadata
            if websocket in self.connection_metadata:
                del self.connection_metadata[websocket]
            
            logger.info(f"User {user_id} disconnected from WebSocket")
            
        except Exception as e:
            logger.error(f"Error disconnecting WebSocket: {e}")
    
    async def send_personal_message(self, websocket: WebSocket, message: Dict[str, Any]):
        """Send a message to a specific WebSocket connection"""
        try:
            await websocket.send_text(json.dumps(message))
            return True
            
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            return False
    
    async def send_to_user(self, user_id: str, message: Dict[str, Any]):
        """Send a message to a specific user"""
        try:
            if user_id in self.user_connections:
                websocket = self.user_connections[user_id]
                return await self.send_personal_message(websocket, message)
            return False
            
        except Exception as e:
            logger.error(f"Error sending message to user: {e}")
            return False
    
    async def broadcast(self, message: Dict[str, Any], topic: Optional[str] = None):
        """Broadcast a message to all connections or specific topic subscribers"""
        try:
            if topic and topic in self.subscriptions:
                # Send to topic subscribers
                connections = self.subscriptions[topic]
            else:
                # Send to all connections
                connections = self.active_connections
            
            message_str = json.dumps(message)
            disconnected = []
            
            for connection in connections:
                try:
                    await connection.send_text(message_str)
                except:
                    # Mark for removal
                    disconnected.append(connection)
            
            # Remove disconnected connections
            for connection in disconnected:
                await self._cleanup_connection(connection)
            
            return True
            
        except Exception as e:
            logger.error(f"Error broadcasting message: {e}")
            return False
    
    async def subscribe_to_topic(self, websocket: WebSocket, topic: str):
        """Subscribe a connection to a specific topic"""
        try:
            if topic in self.subscriptions:
                self.subscriptions[topic].add(websocket)
                logger.info(f"WebSocket subscribed to topic: {topic}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Error subscribing to topic: {e}")
            return False
    
    async def unsubscribe_from_topic(self, websocket: WebSocket, topic: str):
        """Unsubscribe a connection from a specific topic"""
        try:
            if topic in self.subscriptions and websocket in self.subscriptions[topic]:
                self.subscriptions[topic].remove(websocket)
                logger.info(f"WebSocket unsubscribed from topic: {topic}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Error unsubscribing from topic: {e}")
            return False
    
    async def _cleanup_connection(self, websocket: WebSocket):
        """Clean up a disconnected WebSocket connection"""
        try:
            # Remove from active connections
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
            
            # Remove from user connections
            user_id = None
            for uid, ws in self.user_connections.items():
                if ws == websocket:
                    user_id = uid
                    break
            
            if user_id:
                del self.user_connections[user_id]
            
            # Remove from subscriptions
            for topic, connections in self.subscriptions.items():
                if websocket in connections:
                    connections.remove(websocket)
            
            # Remove metadata
            if websocket in self.connection_metadata:
                del self.connection_metadata[websocket]
            
        except Exception as e:
            logger.error(f"Error cleaning up connection: {e}")
    
    async def get_connection_stats(self) -> Dict[str, Any]:
        """Get statistics about active connections"""
        try:
            return {
                "total_connections": len(self.active_connections),
                "user_connections": len(self.user_connections),
                "subscriptions": {
                    topic: len(connections) 
                    for topic, connections in self.subscriptions.items()
                },
                "connection_types": {
                    metadata["connection_type"]: sum(
                        1 for meta in self.connection_metadata.values() 
                        if meta["connection_type"] == connection_type
                    )
                    for connection_type in set(
                        meta["connection_type"] 
                        for meta in self.connection_metadata.values()
                    )
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting connection stats: {e}")
            return {}
    
    async def send_token_update(self, token_data: Dict[str, Any]):
        """Send real-time token data update"""
        try:
            message = {
                "type": "token_update",
                "data": token_data,
                "timestamp": datetime.now().isoformat()
            }
            
            return await self.broadcast(message, "tokens")
            
        except Exception as e:
            logger.error(f"Error sending token update: {e}")
            return False
    
    async def send_portfolio_update(self, user_id: str, portfolio_data: Dict[str, Any]):
        """Send portfolio update to specific user"""
        try:
            message = {
                "type": "portfolio_update",
                "data": portfolio_data,
                "timestamp": datetime.now().isoformat()
            }
            
            return await self.send_to_user(user_id, message)
            
        except Exception as e:
            logger.error(f"Error sending portfolio update: {e}")
            return False
    
    async def send_education_update(self, user_id: str, education_data: Dict[str, Any]):
        """Send education progress update to specific user"""
        try:
            message = {
                "type": "education_update",
                "data": education_data,
                "timestamp": datetime.now().isoformat()
            }
            
            return await self.send_to_user(user_id, message)
            
        except Exception as e:
            logger.error(f"Error sending education update: {e}")
            return False
    
    async def send_chat_message(self, user_id: str, chat_data: Dict[str, Any]):
        """Send chat message to specific user"""
        try:
            message = {
                "type": "chat_message",
                "data": chat_data,
                "timestamp": datetime.now().isoformat()
            }
            
            return await self.send_to_user(user_id, message)
            
        except Exception as e:
            logger.error(f"Error sending chat message: {e}")
            return False
    
    async def send_system_notification(self, message: str, notification_type: str = "info"):
        """Send system notification to all connected users"""
        try:
            notification = {
                "type": "system_notification",
                "notification_type": notification_type,
                "message": message,
                "timestamp": datetime.now().isoformat()
            }
            
            return await self.broadcast(notification)
            
        except Exception as e:
            logger.error(f"Error sending system notification: {e}")
            return False
    
    async def handle_connection_heartbeat(self, websocket: WebSocket):
        """Handle connection heartbeat to keep connections alive"""
        try:
            if websocket in self.connection_metadata:
                self.connection_metadata[websocket]["last_activity"] = datetime.now().isoformat()
                
                # Send heartbeat response
                heartbeat_response = {
                    "type": "heartbeat",
                    "timestamp": datetime.now().isoformat()
                }
                
                return await self.send_personal_message(websocket, heartbeat_response)
            
            return False
            
        except Exception as e:
            logger.error(f"Error handling heartbeat: {e}")
            return False
    
    async def cleanup_stale_connections(self, timeout_minutes: int = 30):
        """Clean up stale connections that haven't been active"""
        try:
            current_time = datetime.now()
            stale_connections = []
            
            for websocket, metadata in self.connection_metadata.items():
                last_activity = datetime.fromisoformat(metadata["last_activity"])
                time_diff = (current_time - last_activity).total_seconds() / 60
                
                if time_diff > timeout_minutes:
                    stale_connections.append(websocket)
            
            # Clean up stale connections
            for websocket in stale_connections:
                await self._cleanup_connection(websocket)
                logger.info(f"Cleaned up stale connection")
            
            return len(stale_connections)
            
        except Exception as e:
            logger.error(f"Error cleaning up stale connections: {e}")
            return 0
