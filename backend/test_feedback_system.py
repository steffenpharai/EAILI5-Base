#!/usr/bin/env python3
"""
Test script for the feedback system
Demonstrates the feedback API endpoints
"""

import asyncio
import sys
import os
from datetime import datetime

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.feedback_service import FeedbackService
from database.connection import get_database, create_feedback_tables

async def test_feedback_system():
    """Test the feedback system functionality"""
    print("🧪 Testing Feedback System")
    print("=" * 50)
    
    try:
        # Initialize database connection
        print("📊 Initializing database...")
        db_session = await get_database()
        if not db_session:
            print("❌ Database connection failed")
            return False
        
        # Create feedback tables
        await create_feedback_tables()
        print("✅ Feedback tables created")
        
        # Initialize feedback service
        print("🔧 Initializing feedback service...")
        feedback_service = FeedbackService()
        await feedback_service.initialize(db_session, None)
        print("✅ Feedback service initialized")
        
        # Test data
        test_user_id = "0x1234567890abcdef1234567890abcdef12345678"
        test_message_id = f"test_message_{int(datetime.now().timestamp())}"
        
        print(f"\n📝 Testing feedback submission...")
        print(f"User ID: {test_user_id}")
        print(f"Message ID: {test_message_id}")
        
        # Test 1: Submit helpful feedback
        print("\n1️⃣ Testing helpful feedback...")
        result = await feedback_service.submit_feedback(
            user_id=test_user_id,
            message_id=test_message_id,
            rating="helpful",
            text_feedback="This was very informative!",
            session_id="test_session_123"
        )
        
        if result.get("status") == "success":
            print("✅ Helpful feedback submitted successfully")
            print(f"   Feedback ID: {result.get('feedback_id')}")
        else:
            print(f"❌ Failed to submit helpful feedback: {result.get('error')}")
            return False
        
        # Test 2: Submit not helpful feedback
        print("\n2️⃣ Testing not helpful feedback...")
        result = await feedback_service.submit_feedback(
            user_id=test_user_id,
            message_id=f"{test_message_id}_2",
            rating="not_helpful",
            text_feedback="This didn't answer my question.",
            session_id="test_session_123"
        )
        
        if result.get("status") == "success":
            print("✅ Not helpful feedback submitted successfully")
        else:
            print(f"❌ Failed to submit not helpful feedback: {result.get('error')}")
            return False
        
        # Test 3: Log appreciation transaction
        print("\n3️⃣ Testing appreciation transaction logging...")
        test_tx_hash = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
        result = await feedback_service.log_appreciation_transaction(
            user_id=test_user_id,
            transaction_hash=test_tx_hash,
            amount_eth=0.001,
            message_id=test_message_id
        )
        
        if result.get("status") == "success":
            print("✅ Appreciation transaction logged successfully")
            print(f"   Transaction Hash: {test_tx_hash}")
        else:
            print(f"❌ Failed to log appreciation transaction: {result.get('error')}")
            return False
        
        # Test 4: Get feedback stats
        print("\n4️⃣ Testing feedback statistics...")
        stats = await feedback_service.get_feedback_stats(test_user_id)
        
        if stats.get("status") == "success":
            print("✅ Feedback stats retrieved successfully")
            feedback_stats = stats.get("feedback_stats", {})
            appreciation_stats = stats.get("appreciation_stats", {})
            
            print(f"   Total Feedback: {feedback_stats.get('total_feedback', 0)}")
            print(f"   Helpful: {feedback_stats.get('helpful_count', 0)}")
            print(f"   Not Helpful: {feedback_stats.get('not_helpful_count', 0)}")
            print(f"   Helpful %: {feedback_stats.get('helpful_percentage', 0)}%")
            print(f"   Appreciation Transactions: {appreciation_stats.get('total_transactions', 0)}")
            print(f"   Total ETH Received: {appreciation_stats.get('total_eth_received', 0)}")
        else:
            print(f"❌ Failed to get feedback stats: {stats.get('error')}")
            return False
        
        # Test 5: Check feedback milestone
        print("\n5️⃣ Testing feedback milestone...")
        milestone = await feedback_service.check_feedback_milestone(test_user_id)
        
        if milestone.get("status") == "success":
            print("✅ Feedback milestone checked successfully")
            print(f"   Total Feedback: {milestone.get('total_feedback', 0)}")
            print(f"   Reached Milestones: {milestone.get('reached_milestones', [])}")
            print(f"   Next Milestone: {milestone.get('next_milestone', 'N/A')}")
        else:
            print(f"❌ Failed to check feedback milestone: {milestone.get('error')}")
            return False
        
        # Test 6: Get feedback history
        print("\n6️⃣ Testing feedback history...")
        history = await feedback_service.get_user_feedback_history(test_user_id, limit=10)
        
        if history.get("status") == "success":
            print("✅ Feedback history retrieved successfully")
            feedback_history = history.get("feedback_history", [])
            print(f"   History Count: {len(feedback_history)}")
            
            for i, feedback in enumerate(feedback_history[:3]):  # Show first 3
                print(f"   {i+1}. Rating: {feedback.get('rating')}, Text: {feedback.get('text_feedback', 'N/A')[:50]}...")
        else:
            print(f"❌ Failed to get feedback history: {history.get('error')}")
            return False
        
        print("\n🎉 All feedback system tests passed!")
        print("\n📋 Summary:")
        print("   ✅ Feedback submission (helpful & not helpful)")
        print("   ✅ Appreciation transaction logging")
        print("   ✅ Feedback statistics")
        print("   ✅ Feedback milestones")
        print("   ✅ Feedback history")
        print("\n🚀 Feedback system is ready for Base Batches submission!")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Main test function"""
    print("🧪 EAILI5 Feedback System Test")
    print("Testing feedback system for Base Batches submission")
    print("=" * 60)
    
    success = await test_feedback_system()
    
    if success:
        print("\n✅ All tests completed successfully!")
        print("🎯 Ready for Base Batches submission with testnet transactions!")
        sys.exit(0)
    else:
        print("\n❌ Tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
