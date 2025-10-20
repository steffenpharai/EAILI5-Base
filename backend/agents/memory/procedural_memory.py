"""
Procedural Memory - How-to knowledge and workflows
Part of the EAILI5 multi-agent memory system
"""

import asyncio
from typing import Dict, List, Any, Optional, Tuple
import logging
from datetime import datetime
import json
import yaml
from services.redis_service import RedisService

logger = logging.getLogger(__name__)

class ProceduralMemory:
    """
    Manages procedural knowledge - step-by-step guides and workflows
    """
    
    def __init__(self, redis_service: RedisService):
        self.redis_service = redis_service
        self.procedures_ttl = 86400 * 7  # 7 days TTL for procedures
        
    async def initialize(self) -> None:
        """Initialize with default procedures"""
        try:
            # Load default procedures
            default_procedures = await self._load_default_procedures()
            
            for procedure in default_procedures:
                await self.store_procedure(
                    procedure_id=procedure['id'],
                    name=procedure['name'],
                    description=procedure['description'],
                    steps=procedure['steps'],
                    category=procedure['category'],
                    difficulty_level=procedure['difficulty_level'],
                    prerequisites=procedure.get('prerequisites', []),
                    estimated_time=procedure.get('estimated_time', 0)
                )
            
            logger.info("Procedural memory initialized with default procedures")
            
        except Exception as e:
            logger.error(f"Error initializing procedural memory: {e}")
    
    async def store_procedure(
        self,
        procedure_id: str,
        name: str,
        description: str,
        steps: List[Dict[str, Any]],
        category: str,
        difficulty_level: int,
        prerequisites: List[str] = None,
        estimated_time: int = 0,
        metadata: Dict[str, Any] = None
    ) -> bool:
        """Store a new procedure"""
        try:
            procedure = {
                "procedure_id": procedure_id,
                "name": name,
                "description": description,
                "steps": steps,
                "category": category,
                "difficulty_level": difficulty_level,
                "prerequisites": prerequisites or [],
                "estimated_time": estimated_time,
                "metadata": metadata or {},
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            # Store procedure
            procedure_key = f"procedure:{procedure_id}"
            await self.redis_service.set(
                procedure_key,
                json.dumps(procedure, default=str),
                ttl=self.procedures_ttl
            )
            
            # Add to category index
            category_key = f"procedures:category:{category}"
            await self.redis_service.sadd(category_key, procedure_id)
            await self.redis_service.expire(category_key, self.procedures_ttl)
            
            # Add to difficulty index
            difficulty_key = f"procedures:difficulty:{difficulty_level}"
            await self.redis_service.sadd(difficulty_key, procedure_id)
            await self.redis_service.expire(difficulty_key, self.procedures_ttl)
            
            logger.info(f"Stored procedure {procedure_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error storing procedure: {e}")
            return False
    
    async def get_procedure(self, procedure_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific procedure"""
        try:
            procedure_key = f"procedure:{procedure_id}"
            procedure_data = await self.redis_service.get(procedure_key)
            
            if procedure_data:
                return json.loads(procedure_data)
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting procedure: {e}")
            return None
    
    async def get_procedures_by_category(
        self,
        category: str,
        difficulty_level: int = None
    ) -> List[Dict[str, Any]]:
        """Get procedures by category"""
        try:
            category_key = f"procedures:category:{category}"
            procedure_ids = await self.redis_service.smembers(category_key)
            
            procedures = []
            for procedure_id in procedure_ids:
                procedure = await self.get_procedure(procedure_id)
                if procedure:
                    if difficulty_level is None or procedure.get('difficulty_level') == difficulty_level:
                        procedures.append(procedure)
            
            return procedures
            
        except Exception as e:
            logger.error(f"Error getting procedures by category: {e}")
            return []
    
    async def get_procedures_by_difficulty(
        self,
        difficulty_level: int
    ) -> List[Dict[str, Any]]:
        """Get procedures by difficulty level"""
        try:
            difficulty_key = f"procedures:difficulty:{difficulty_level}"
            procedure_ids = await self.redis_service.smembers(difficulty_key)
            
            procedures = []
            for procedure_id in procedure_ids:
                procedure = await self.get_procedure(procedure_id)
                if procedure:
                    procedures.append(procedure)
            
            return procedures
            
        except Exception as e:
            logger.error(f"Error getting procedures by difficulty: {e}")
            return []
    
    async def search_procedures(
        self,
        query: str,
        category: str = None,
        difficulty_level: int = None,
        max_results: int = 10
    ) -> List[Dict[str, Any]]:
        """Search procedures by query"""
        try:
            # Get all procedure IDs
            all_procedures = []
            
            if category:
                procedures = await self.get_procedures_by_category(category, difficulty_level)
                all_procedures.extend(procedures)
            elif difficulty_level is not None:
                procedures = await self.get_procedures_by_difficulty(difficulty_level)
                all_procedures.extend(procedures)
            else:
                # Search all procedures (this is expensive, consider indexing)
                categories = ['trading', 'wallet', 'defi', 'security', 'base', 'education']
                for cat in categories:
                    procedures = await self.get_procedures_by_category(cat)
                    all_procedures.extend(procedures)
            
            # Filter by query
            query_lower = query.lower()
            matching_procedures = []
            
            for procedure in all_procedures:
                # Check name, description, and steps
                if (query_lower in procedure.get('name', '').lower() or
                    query_lower in procedure.get('description', '').lower() or
                    any(query_lower in step.get('description', '').lower() 
                        for step in procedure.get('steps', []))):
                    matching_procedures.append(procedure)
            
            # Sort by relevance (simple scoring)
            matching_procedures.sort(
                key=lambda x: self._calculate_procedure_relevance(x, query),
                reverse=True
            )
            
            return matching_procedures[:max_results]
            
        except Exception as e:
            logger.error(f"Error searching procedures: {e}")
            return []
    
    async def get_user_progress(
        self,
        user_id: str,
        procedure_id: str
    ) -> Dict[str, Any]:
        """Get user's progress on a procedure"""
        try:
            progress_key = f"user_progress:{user_id}:{procedure_id}"
            progress_data = await self.redis_service.get(progress_key)
            
            if progress_data:
                return json.loads(progress_data)
            
            return {
                "procedure_id": procedure_id,
                "user_id": user_id,
                "current_step": 0,
                "completed_steps": [],
                "started_at": None,
                "completed_at": None,
                "total_time": 0,
                "errors": [],
                "notes": []
            }
            
        except Exception as e:
            logger.error(f"Error getting user progress: {e}")
            return {}
    
    async def update_user_progress(
        self,
        user_id: str,
        procedure_id: str,
        current_step: int,
        completed_steps: List[int] = None,
        error: str = None,
        note: str = None
    ) -> bool:
        """Update user's progress on a procedure"""
        try:
            progress = await self.get_user_progress(user_id, procedure_id)
            
            # Update progress
            progress['current_step'] = current_step
            if completed_steps:
                progress['completed_steps'] = list(set(progress['completed_steps'] + completed_steps))
            
            if error:
                progress['errors'].append({
                    "error": error,
                    "timestamp": datetime.now().isoformat(),
                    "step": current_step
                })
            
            if note:
                progress['notes'].append({
                    "note": note,
                    "timestamp": datetime.now().isoformat(),
                    "step": current_step
                })
            
            # Check if procedure is completed
            procedure = await self.get_procedure(procedure_id)
            if procedure and len(progress['completed_steps']) >= len(procedure.get('steps', [])):
                progress['completed_at'] = datetime.now().isoformat()
            
            # Store updated progress
            progress_key = f"user_progress:{user_id}:{procedure_id}"
            await self.redis_service.set(
                progress_key,
                json.dumps(progress, default=str),
                ttl=self.procedures_ttl
            )
            
            logger.info(f"Updated progress for user {user_id} on procedure {procedure_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating user progress: {e}")
            return False
    
    def _calculate_procedure_relevance(
        self,
        procedure: Dict[str, Any],
        query: str
    ) -> float:
        """Calculate relevance score for a procedure"""
        try:
            query_lower = query.lower()
            score = 0.0
            
            # Name match (highest weight)
            if query_lower in procedure.get('name', '').lower():
                score += 3.0
            
            # Description match
            if query_lower in procedure.get('description', '').lower():
                score += 2.0
            
            # Step matches
            for step in procedure.get('steps', []):
                if query_lower in step.get('description', '').lower():
                    score += 1.0
            
            return score
            
        except Exception as e:
            logger.error(f"Error calculating procedure relevance: {e}")
            return 0.0
    
    async def _load_default_procedures(self) -> List[Dict[str, Any]]:
        """Load default procedures for crypto education"""
        return [
            {
                "id": "wallet_setup_metamask",
                "name": "Setting up MetaMask Wallet",
                "description": "Complete guide to setting up a MetaMask wallet for crypto beginners",
                "category": "wallet",
                "difficulty_level": 1,
                "prerequisites": [],
                "estimated_time": 15,
                "steps": [
                    {
                        "step": 1,
                        "title": "Download MetaMask",
                        "description": "Go to metamask.io and download the browser extension",
                        "action": "navigate",
                        "url": "https://metamask.io"
                    },
                    {
                        "step": 2,
                        "title": "Create New Wallet",
                        "description": "Click 'Create a New Wallet' and follow the setup wizard",
                        "action": "click",
                        "element": "Create a New Wallet button"
                    },
                    {
                        "step": 3,
                        "title": "Set Password",
                        "description": "Create a strong password for your wallet",
                        "action": "input",
                        "field": "password"
                    },
                    {
                        "step": 4,
                        "title": "Save Seed Phrase",
                        "description": "Write down your 12-word seed phrase and store it safely",
                        "action": "save",
                        "warning": "Never share your seed phrase with anyone"
                    },
                    {
                        "step": 5,
                        "title": "Verify Seed Phrase",
                        "description": "Confirm your seed phrase by selecting the words in order",
                        "action": "verify"
                    }
                ]
            },
            {
                "id": "buy_first_crypto",
                "name": "Buying Your First Cryptocurrency",
                "description": "Step-by-step guide to buying your first crypto on a centralized exchange",
                "category": "trading",
                "difficulty_level": 2,
                "prerequisites": ["wallet_setup_metamask"],
                "estimated_time": 30,
                "steps": [
                    {
                        "step": 1,
                        "title": "Choose an Exchange",
                        "description": "Select a reputable exchange like Coinbase, Binance, or Kraken",
                        "action": "research",
                        "options": ["Coinbase", "Binance", "Kraken", "Gemini"]
                    },
                    {
                        "step": 2,
                        "title": "Create Account",
                        "description": "Sign up with your email and verify your identity (KYC)",
                        "action": "register",
                        "requirements": ["Email", "Phone", "ID verification"]
                    },
                    {
                        "step": 3,
                        "title": "Add Payment Method",
                        "description": "Link your bank account or debit card for purchases",
                        "action": "link",
                        "options": ["Bank transfer", "Debit card", "Credit card"]
                    },
                    {
                        "step": 4,
                        "title": "Buy Cryptocurrency",
                        "description": "Start with Bitcoin or Ethereum for beginners",
                        "action": "buy",
                        "recommendations": ["Bitcoin (BTC)", "Ethereum (ETH)"]
                    },
                    {
                        "step": 5,
                        "title": "Transfer to Wallet",
                        "description": "Move your crypto to your personal wallet for security",
                        "action": "transfer",
                        "warning": "Never leave large amounts on exchanges"
                    }
                ]
            },
            {
                "id": "defi_swap_tokens",
                "name": "Swapping Tokens on DEX",
                "description": "How to swap tokens using decentralized exchanges like Uniswap",
                "category": "defi",
                "difficulty_level": 3,
                "prerequisites": ["wallet_setup_metamask", "buy_first_crypto"],
                "estimated_time": 20,
                "steps": [
                    {
                        "step": 1,
                        "title": "Connect Wallet",
                        "description": "Connect your MetaMask wallet to the DEX",
                        "action": "connect",
                        "wallet": "MetaMask"
                    },
                    {
                        "step": 2,
                        "title": "Select Tokens",
                        "description": "Choose the token you want to swap from and to",
                        "action": "select",
                        "example": "ETH to USDC"
                    },
                    {
                        "step": 3,
                        "title": "Enter Amount",
                        "description": "Enter the amount you want to swap",
                        "action": "input",
                        "field": "amount"
                    },
                    {
                        "step": 4,
                        "title": "Check Price Impact",
                        "description": "Review the price impact and slippage tolerance",
                        "action": "review",
                        "warning": "High slippage can result in poor exchange rates"
                    },
                    {
                        "step": 5,
                        "title": "Approve Transaction",
                        "description": "Approve the token spending and confirm the swap",
                        "action": "approve",
                        "gas_fee": "You'll pay gas fees for this transaction"
                    }
                ]
            }
        ]
