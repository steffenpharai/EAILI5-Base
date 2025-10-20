"""
Wallet Authentication Service - Manages wallet connections and user authentication
Part of the DeCrypt backend services
"""

import asyncio
import hashlib
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import json

logger = logging.getLogger(__name__)

class WalletAuthService:
    """
    Service for managing wallet connections and user authentication
    """
    
    def __init__(self):
        self.connected_wallets: Dict[str, Dict[str, Any]] = {}
        self.user_sessions: Dict[str, Dict[str, Any]] = {}
        self.auth_tokens: Dict[str, Dict[str, Any]] = {}
        self.redis_client = None
        
        # Session timeout (24 hours)
        self.session_timeout = timedelta(hours=24)
    
    async def initialize(self, redis_client=None):
        """Initialize wallet authentication service"""
        try:
            self.redis_client = redis_client
            logger.info("Wallet authentication service initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing wallet auth service: {e}")
            raise
    
    async def connect_wallet(
        self,
        wallet_address: str,
        wallet_type: str = "ethereum",
        chain_id: int = 8453,  # Base mainnet
        user_agent: Optional[str] = None
    ) -> Dict[str, Any]:
        """Connect a wallet and create user session"""
        try:
            # Generate session ID
            session_id = self._generate_session_id(wallet_address)
            
            # Create wallet connection record
            wallet_connection = {
                "wallet_address": wallet_address.lower(),
                "wallet_type": wallet_type,
                "chain_id": chain_id,
                "connected_at": datetime.now().isoformat(),
                "last_activity": datetime.now().isoformat(),
                "user_agent": user_agent,
                "is_active": True
            }
            
            # Create user session
            user_session = {
                "session_id": session_id,
                "wallet_address": wallet_address.lower(),
                "user_id": self._generate_user_id(wallet_address),
                "created_at": datetime.now().isoformat(),
                "last_activity": datetime.now().isoformat(),
                "learning_level": 0,
                "preferences": {
                    "notifications": True,
                    "theme": "dark",
                    "language": "en"
                }
            }
            
            # Store connections
            self.connected_wallets[wallet_address.lower()] = wallet_connection
            self.user_sessions[session_id] = user_session
            
            logger.info(f"Wallet connected: {wallet_address}")
            
            return {
                "session_id": session_id,
                "user_id": user_session["user_id"],
                "wallet_address": wallet_address,
                "connected_at": wallet_connection["connected_at"],
                "status": "connected"
            }
            
        except Exception as e:
            logger.error(f"Error connecting wallet: {e}")
            return {"error": "Failed to connect wallet", "status": "error"}
    
    async def disconnect_wallet(self, wallet_address: str) -> bool:
        """Disconnect a wallet"""
        try:
            wallet_address = wallet_address.lower()
            
            if wallet_address in self.connected_wallets:
                # Mark as inactive
                self.connected_wallets[wallet_address]["is_active"] = False
                self.connected_wallets[wallet_address]["disconnected_at"] = datetime.now().isoformat()
                
                # Remove from active connections
                del self.connected_wallets[wallet_address]
                
                logger.info(f"Wallet disconnected: {wallet_address}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error disconnecting wallet: {e}")
            return False
    
    async def get_user_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get user session by session ID"""
        try:
            if session_id in self.user_sessions:
                session = self.user_sessions[session_id]
                
                # Check if session is still valid
                last_activity = datetime.fromisoformat(session["last_activity"])
                if datetime.now() - last_activity > self.session_timeout:
                    # Session expired
                    del self.user_sessions[session_id]
                    return None
                
                # Update last activity
                session["last_activity"] = datetime.now().isoformat()
                return session
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting user session: {e}")
            return None
    
    async def get_user_by_wallet(self, wallet_address: str) -> Optional[Dict[str, Any]]:
        """Get user session by wallet address"""
        try:
            wallet_address = wallet_address.lower()
            
            # Find session by wallet address
            for session_id, session in self.user_sessions.items():
                if session["wallet_address"] == wallet_address:
                    return await self.get_user_session(session_id)
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting user by wallet: {e}")
            return None
    
    async def update_user_preferences(
        self,
        session_id: str,
        preferences: Dict[str, Any]
    ) -> bool:
        """Update user preferences"""
        try:
            if session_id in self.user_sessions:
                session = self.user_sessions[session_id]
                session["preferences"].update(preferences)
                session["last_activity"] = datetime.now().isoformat()
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error updating user preferences: {e}")
            return False
    
    async def update_learning_level(self, session_id: str, level: int) -> bool:
        """Update user's learning level"""
        try:
            if session_id in self.user_sessions:
                session = self.user_sessions[session_id]
                session["learning_level"] = level
                session["last_activity"] = datetime.now().isoformat()
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error updating learning level: {e}")
            return False
    
    async def get_connected_wallets(self) -> List[Dict[str, Any]]:
        """Get list of all connected wallets"""
        try:
            wallets = []
            for address, wallet_data in self.connected_wallets.items():
                if wallet_data["is_active"]:
                    wallets.append({
                        "address": address,
                        "type": wallet_data["wallet_type"],
                        "chain_id": wallet_data["chain_id"],
                        "connected_at": wallet_data["connected_at"],
                        "last_activity": wallet_data["last_activity"]
                    })
            
            return wallets
            
        except Exception as e:
            logger.error(f"Error getting connected wallets: {e}")
            return []
    
    async def get_user_stats(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get user statistics"""
        try:
            session = await self.get_user_session(session_id)
            if not session:
                return None
            
            wallet_address = session["wallet_address"]
            
            # Get wallet connection info
            wallet_info = None
            if wallet_address in self.connected_wallets:
                wallet_info = self.connected_wallets[wallet_address]
            
            return {
                "user_id": session["user_id"],
                "wallet_address": wallet_address,
                "learning_level": session["learning_level"],
                "preferences": session["preferences"],
                "session_created": session["created_at"],
                "last_activity": session["last_activity"],
                "wallet_info": wallet_info
            }
            
        except Exception as e:
            logger.error(f"Error getting user stats: {e}")
            return None
    
    async def validate_wallet_signature(
        self,
        wallet_address: str,
        message: str,
        signature: str
    ) -> bool:
        """Validate wallet signature (simplified for demo)"""
        try:
            # In a real implementation, this would verify the signature
            # against the wallet address using cryptographic verification
            
            # For now, we'll do a simple validation
            if wallet_address and message and signature:
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error validating wallet signature: {e}")
            return False
    
    async def create_auth_token(self, session_id: str) -> Optional[str]:
        """Create authentication token for session"""
        try:
            if session_id in self.user_sessions:
                # Generate token
                token = self._generate_auth_token(session_id)
                
                # Store token
                self.auth_tokens[token] = {
                    "session_id": session_id,
                    "created_at": datetime.now().isoformat(),
                    "expires_at": (datetime.now() + self.session_timeout).isoformat()
                }
                
                return token
            
            return None
            
        except Exception as e:
            logger.error(f"Error creating auth token: {e}")
            return None
    
    async def validate_auth_token(self, token: str) -> Optional[str]:
        """Validate authentication token and return session ID"""
        try:
            if token in self.auth_tokens:
                token_data = self.auth_tokens[token]
                
                # Check if token is expired
                expires_at = datetime.fromisoformat(token_data["expires_at"])
                if datetime.now() < expires_at:
                    return token_data["session_id"]
                else:
                    # Token expired, remove it
                    del self.auth_tokens[token]
            
            return None
            
        except Exception as e:
            logger.error(f"Error validating auth token: {e}")
            return None
    
    async def cleanup_expired_sessions(self):
        """Clean up expired sessions and tokens"""
        try:
            current_time = datetime.now()
            expired_sessions = []
            expired_tokens = []
            
            # Find expired sessions
            for session_id, session in self.user_sessions.items():
                last_activity = datetime.fromisoformat(session["last_activity"])
                if current_time - last_activity > self.session_timeout:
                    expired_sessions.append(session_id)
            
            # Find expired tokens
            for token, token_data in self.auth_tokens.items():
                expires_at = datetime.fromisoformat(token_data["expires_at"])
                if current_time > expires_at:
                    expired_tokens.append(token)
            
            # Clean up expired sessions
            for session_id in expired_sessions:
                del self.user_sessions[session_id]
            
            # Clean up expired tokens
            for token in expired_tokens:
                del self.auth_tokens[token]
            
            logger.info(f"Cleaned up {len(expired_sessions)} expired sessions and {len(expired_tokens)} expired tokens")
            
            return len(expired_sessions) + len(expired_tokens)
            
        except Exception as e:
            logger.error(f"Error cleaning up expired sessions: {e}")
            return 0
    
    def _generate_session_id(self, wallet_address: str) -> str:
        """Generate unique session ID"""
        timestamp = str(datetime.now().timestamp())
        data = f"{wallet_address}_{timestamp}"
        return hashlib.sha256(data.encode()).hexdigest()[:32]
    
    def _generate_user_id(self, wallet_address: str) -> str:
        """Generate user ID from wallet address"""
        return hashlib.sha256(wallet_address.lower().encode()).hexdigest()[:16]
    
    def _generate_auth_token(self, session_id: str) -> str:
        """Generate authentication token"""
        timestamp = str(datetime.now().timestamp())
        data = f"{session_id}_{timestamp}"
        return hashlib.sha256(data.encode()).hexdigest()
    
    async def get_service_stats(self) -> Dict[str, Any]:
        """Get service statistics"""
        try:
            return {
                "connected_wallets": len(self.connected_wallets),
                "active_sessions": len(self.user_sessions),
                "auth_tokens": len(self.auth_tokens),
                "service_uptime": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting service stats: {e}")
            return {}
