"""
Feedback Service - Manages user feedback and appreciation tracking
Part of the EAILI5 backend services
"""

from typing import Dict, Any, Optional
import logging
from datetime import datetime
from sqlalchemy import text

logger = logging.getLogger(__name__)


class FeedbackService:
    """
    Service for managing user feedback and appreciation tracking
    """

    def __init__(self):
        self.db_session = None
        self.redis_client = None

    async def initialize(self, db_session=None, redis_client=None):
        """Initialize feedback service"""
        try:
            self.db_session = db_session
            self.redis_client = redis_client
            logger.info("Feedback service initialized successfully")

        except Exception as e:
            logger.error(f"Error initializing feedback service: {e}")
            raise


    async def log_appreciation_transaction(
        self,
        user_id: str,
        transaction_hash: str,
        amount_eth: float,
        message_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Log an appreciation transaction (optional tracking)
        """
        try:
            if not self.db_session:
                return {"error": "Database not available", "status": "error"}

            # Insert appreciation transaction log
            query = text("""
                INSERT INTO appreciation_transactions (
                    user_id, transaction_hash, amount_eth, message_id, created_at
                ) VALUES (
                    :user_id, :transaction_hash, :amount_eth, :message_id, :created_at
                )
            """)

            result = await self.db_session.execute(query, {
                "user_id": user_id,
                "transaction_hash": transaction_hash,
                "amount_eth": amount_eth,
                "message_id": message_id,
                "created_at": datetime.now()
            })

            await self.db_session.commit()

            # Update appreciation stats in Redis if available
            if self.redis_client:
                try:
                    stats_key = f"appreciation_stats:{user_id}"
                    await self.redis_client.hincrbyfloat(stats_key, "total_eth_received", amount_eth)
                    await self.redis_client.hincrby(stats_key, "transaction_count", 1)
                    await self.redis_client.expire(stats_key, 86400)  # 24 hours TTL
                except Exception as e:
                    logger.warning(f"Redis appreciation stats update failed: {e}")

            return {
                "status": "success",
                "message": "Appreciation transaction logged",
                "log_id": result.lastrowid,
                "amount_eth": amount_eth
            }

        except Exception as e:
            logger.error(f"Error logging appreciation transaction: {e}")
            return {"error": str(e), "status": "error"}



    async def get_appreciation_transactions(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Get user's appreciation transactions
        """
        try:
            if not self.db_session:
                return {"error": "Database not available", "status": "error"}

            query = text("""
                SELECT
                    id, transaction_hash, amount_eth, message_id, created_at
                FROM appreciation_transactions
                WHERE user_id = :user_id
                ORDER BY created_at DESC
                LIMIT :limit OFFSET :offset
            """)

            result = await self.db_session.execute(query, {
                "user_id": user_id,
                "limit": limit,
                "offset": offset
            })

            transactions = []
            for row in result.fetchall():
                transactions.append({
                    "id": row.id,
                    "transaction_hash": row.transaction_hash,
                    "amount_eth": float(row.amount_eth),
                    "message_id": row.message_id,
                    "created_at": row.created_at.isoformat()
                })

            return {
                "status": "success",
                "transactions": transactions,
                "count": len(transactions)
            }

        except Exception as e:
            logger.error(f"Error getting appreciation transactions: {e}")
            return {"error": str(e), "status": "error"}

