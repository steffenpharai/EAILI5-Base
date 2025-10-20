import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class SessionService:
    """Secure session management with Redis backing"""
    
    def __init__(self, redis_service):
        self.redis = redis_service
        self.session_ttl = 86400  # 24 hours
        
    async def create_session(self, user_id: str, wallet_address: Optional[str] = None) -> str:
        """
        Create a new secure session token
        
        Args:
            user_id: User identifier (can be 'anonymous')
            wallet_address: Optional wallet address (will be hashed)
            
        Returns:
            session_token: Secure random token
        """
        # Verify Redis is connected
        try:
            if not await self.redis.redis_client.ping():
                raise Exception("Redis connection unavailable")
        except Exception as e:
            logger.error(f"Redis connection check failed: {e}")
            raise Exception("Redis connection unavailable")
        
        # Generate secure random token
        session_token = secrets.token_urlsafe(32)
        
        # Hash wallet address if provided (never store raw addresses)
        wallet_hash = None
        if wallet_address:
            wallet_hash = hashlib.sha256(wallet_address.encode()).hexdigest()[:16]
        
        # Store session data in Redis
        session_data = {
            "user_id": user_id,
            "wallet_hash": wallet_hash,
            "created_at": datetime.now().isoformat(),
            "last_activity": datetime.now().isoformat()
        }
        
        session_key = f"session:{session_token}"
        # Redis service will handle JSON serialization
        success = await self.redis.setex(session_key, self.session_ttl, session_data)
        if not success:
            raise Exception("Failed to store session in Redis")
        
        logger.info(f"Created session {session_token[:8]}... for user {user_id}")
        return session_token
    
    async def validate_session(self, session_token: str) -> Optional[Dict[str, Any]]:
        """
        Validate session and return session data
        
        Returns:
            session_data or None if invalid/expired
        """
        if not session_token:
            return None
            
        session_key = f"session:{session_token}"
        session_data = await self.redis.get(session_key)
        
        if not session_data:
            logger.warning(f"Invalid or expired session: {session_token[:8]}...")
            return None
        
        # Update last activity and extend TTL
        session_data["last_activity"] = datetime.now().isoformat()
        success = await self.redis.setex(session_key, self.session_ttl, session_data)
        if not success:
            logger.warning(f"Failed to update session TTL: {session_token[:8]}...")
        
        return session_data
    
    async def end_session(self, session_token: str) -> bool:
        """Delete a session"""
        session_key = f"session:{session_token}"
        deleted = await self.redis.delete(session_key)
        return deleted > 0
