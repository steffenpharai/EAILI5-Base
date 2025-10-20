"""
Test suite for Eali5 personality validation
Tests that Eali5 maintains honest, enthusiastic personality across all interactions
"""

import pytest
import asyncio
from unittest.mock import Mock, patch
from datetime import datetime

from agents.educator_agent import EducatorAgent
from agents.portfolio_agent import PortfolioAgent
from agents.coordinator import CoordinatorAgent


class TestEali5Personality:
    """Test Eali5's personality traits and responses"""
    
    @pytest.fixture
    def educator_agent(self):
        return EducatorAgent()
    
    @pytest.fixture
    def portfolio_agent(self):
        return PortfolioAgent()
    
    @pytest.fixture
    def coordinator_agent(self):
        return CoordinatorAgent()
    
    @pytest.mark.asyncio
    async def test_educator_agent_personality_prompt(self, educator_agent):
        """Test that educator agent has Eali5 personality prompt"""
        prompt = educator_agent.system_prompt
        
        # Check for Eali5 personality traits
        assert "Eali5" in prompt
        assert "enthusiastic" in prompt.lower()
        assert "friendly, patient" in prompt.lower()
        assert "brutally honest" in prompt.lower()
        assert "never praise bad decisions" in prompt.lower()
        assert "sense of humor" in prompt.lower()
        assert "Real talk" in prompt
        assert "Here's the truth" in prompt
        
        # Check for what to avoid
        assert "Saying 'Great trade!' when it wasn't" in prompt
        assert "False encouragement" in prompt
        assert "Technical jargon without explanation" in prompt
        assert "condescending" in prompt.lower()
    
    @pytest.mark.asyncio
    async def test_portfolio_agent_personality_prompt(self, portfolio_agent):
        """Test that portfolio agent has Eali5 personality prompt"""
        prompt = portfolio_agent.system_prompt
        
        # Check for Eali5 personality traits
        assert "Eali5" in prompt
        assert "enthusiastic" in prompt.lower()
        assert "friendly, patient" in prompt.lower()
        assert "brutally honest" in prompt.lower()
        assert "never praise bad decisions" in prompt.lower()
        assert "sense of humor" in prompt.lower()
        assert "Be honest about bad trades and mistakes" in prompt
        assert "Always explain WHY a trade was good or bad" in prompt
    
    @pytest.mark.asyncio
    async def test_bad_trade_response_contains_honest_feedback(self, portfolio_agent):
        """Test that bad trades get honest feedback with learning points"""
        # Mock a bad trade scenario
        context = {
            "trade_result": {
                "status": "loss",
                "amount": -50,
                "percentage": -25,
                "reason": "bought at peak"
            }
        }
        
        response = await portfolio_agent._explain_trading_actions(
            "I lost money on this trade", 
            learning_level=20, 
            context=context
        )
        
        # Should contain honest feedback
        assert any(phrase in response.lower() for phrase in [
            "real talk", "wasn't ideal", "here's what", "learn"
        ])
        
        # Should not contain false praise
        assert "great trade" not in response.lower()
        assert "amazing" not in response.lower()
        assert "perfect" not in response.lower()
    
    @pytest.mark.asyncio
    async def test_good_question_response_is_enthusiastic(self, educator_agent):
        """Test that good questions get enthusiastic responses"""
        response = await educator_agent._explain_cryptocurrency_basics(learning_level=10)
        
        # Should contain enthusiastic language
        assert any(phrase in response for phrase in [
            "🚀", "💡", "Ready to", "Want to", "Let's"
        ])
        
        # Should be educational and encouraging
        assert "learn" in response.lower() or "understand" in response.lower()
    
    @pytest.mark.asyncio
    async def test_no_false_praise_in_responses(self, portfolio_agent):
        """Test that responses don't contain false praise"""
        # Test various scenarios that might trigger false praise
        scenarios = [
            "I made a terrible trade",
            "I lost all my money",
            "I bought a scam token",
            "I sold at the bottom"
        ]
        
        for scenario in scenarios:
            response = await portfolio_agent.process(
                message=scenario,
                user_id="test_user",
                learning_level=20,
                context={}
            )
            
            # Should not contain false praise phrases
            false_praise_phrases = [
                "great job", "amazing", "perfect", "excellent", 
                "you're doing great", "fantastic", "wonderful"
            ]
            
            for phrase in false_praise_phrases:
                assert phrase not in response.lower(), f"False praise found: '{phrase}' in response: '{response}'"
    
    @pytest.mark.asyncio
    async def test_honest_feedback_patterns(self, portfolio_agent):
        """Test that honest feedback patterns are used"""
        # Test loss scenario
        loss_response = await portfolio_agent._explain_performance_analysis(
            "My portfolio is down 50%", learning_level=30, context={}
        )
        
        # Should contain honest assessment
        assert any(phrase in loss_response.lower() for phrase in [
            "down", "loss", "decline", "decrease"
        ])
        
        # Should provide learning context
        assert any(phrase in loss_response.lower() for phrase in [
            "learn", "understand", "why", "because"
        ])
    
    @pytest.mark.asyncio
    async def test_enthusiastic_teaching_tone(self, educator_agent):
        """Test that teaching responses are enthusiastic"""
        response = await educator_agent._explain_blockchain(learning_level=15)
        
        # Should contain enthusiastic elements
        assert any(element in response for element in [
            "🚀", "💡", "!", "Let's", "Ready to"
        ])
        
        # Should be educational
        assert "explain" in response.lower() or "understand" in response.lower()
    
    @pytest.mark.asyncio
    async def test_natural_voice_consistency(self, coordinator_agent):
        """Test that voice feels natural, not robotic"""
        response = await coordinator_agent.process_message(
            message="What is cryptocurrency?",
            user_id="test_user",
            context={}
        )
        
        # Should not be overly formal
        assert "Greetings" not in response["message"]
        assert "I am" not in response["message"]
        
        # Should be conversational
        assert any(phrase in response["message"] for phrase in [
            "!", "Let me", "Here's", "Think of"
        ])
    
    @pytest.mark.asyncio
    async def test_educational_focus_over_validation(self, educator_agent):
        """Test that responses focus on education, not validation"""
        response = await educator_agent._explain_wallets(learning_level=25)
        
        # Should focus on teaching
        assert any(phrase in response.lower() for phrase in [
            "explain", "understand", "learn", "how", "why", "what"
        ])
        
        # Should not be overly validating
        assert "you're doing great" not in response.lower()
        assert "amazing progress" not in response.lower()
    
    @pytest.mark.asyncio
    async def test_personality_phrases_usage(self, portfolio_agent):
        """Test that personality phrases are used appropriately"""
        # Test bad trade scenario
        response = await portfolio_agent._explain_trading_actions(
            "I made a bad trade", learning_level=20, context={}
        )
        
        # Should contain personality phrases
        personality_phrases = [
            "Real talk", "Here's the truth", "Let me explain", 
            "Here's what", "You're learning"
        ]
        
        # At least one personality phrase should be present
        assert any(phrase in response for phrase in personality_phrases)
    
    @pytest.mark.asyncio
    async def test_risk_management_honesty(self, portfolio_agent):
        """Test that risk management advice is honest"""
        response = await portfolio_agent._explain_risk_management(
            "How much should I invest?", learning_level=30, context={}
        )
        
        # Should contain honest risk warnings
        assert any(phrase in response.lower() for phrase in [
            "risk", "dangerous", "lose", "afford", "careful"
        ])
        
        # Should not encourage risky behavior
        assert "go all in" not in response.lower()
        assert "yolo" not in response.lower()
    
    @pytest.mark.asyncio
    async def test_learning_encouragement_with_honesty(self, educator_agent):
        """Test that learning is encouraged while maintaining honesty"""
        response = await educator_agent._general_educational_response(
            "I don't understand anything", learning_level=5, context={}
        )
        
        # Should be encouraging about learning
        assert any(phrase in response.lower() for phrase in [
            "learn", "understand", "help", "explain"
        ])
        
        # Should acknowledge the confusion honestly
        assert any(phrase in response.lower() for phrase in [
            "confusing", "complex", "difficult", "challenging"
        ])
    
    @pytest.mark.asyncio
    async def test_friendly_and_patient_tone(self, educator_agent):
        """Test that responses are friendly and patient"""
        response = await educator_agent._explain_cryptocurrency_basics(learning_level=10)
        
        # Should be friendly and approachable
        assert any(phrase in response for phrase in [
            "!", "Let's", "Ready to", "Want to", "💡", "🚀"
        ])
        
        # Should not be condescending
        assert "obviously" not in response.lower()
        assert "simple" not in response.lower() or "simple terms" in response.lower()
    
    @pytest.mark.asyncio
    async def test_appropriate_humor_usage(self, educator_agent):
        """Test that humor is used appropriately"""
        response = await educator_agent._explain_wallets(learning_level=20)
        
        # Should contain light humor elements (emojis, casual language)
        assert any(element in response for element in [
            "!", "😄", "💰", "🔐", "Think of", "like your"
        ])
        
        # Should not be overly jokey or unprofessional
        assert "lol" not in response.lower()
        assert "haha" not in response.lower()
    
    def test_personality_guidelines_compliance(self):
        """Test that personality guidelines are properly defined"""
        # Check that personality guidelines file exists and contains key elements
        try:
            with open("EALI5_PERSONALITY.md", "r") as f:
                content = f.read()
                
            # Should contain key personality traits
            assert "Enthusiastic Guide" in content
            assert "Brutally Honest" in content
            assert "Straight Shooter" in content
            assert "Educational First" in content
            
            # Should contain voice guidelines
            assert "Natural Voice" in content
            assert "Real talk" in content
            assert "Here's the truth" in content
            
            # Should contain what to avoid
            assert "False Encouragement" in content
            assert "Great trade!" in content
            assert "Technical jargon" in content
            
        except FileNotFoundError:
            pytest.fail("EALI5_PERSONALITY.md file not found")


if __name__ == "__main__":
    pytest.main([__file__])
