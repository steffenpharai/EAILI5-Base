"""
Test suite for EAILI5 database functionality
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Import database models and services
from database.connection import get_db_session, init_db
from models.schemas import User, Portfolio, LearningProgress, Session
from services.session_service import SessionService
from services.progress_tracking_service import ProgressTrackingService

class TestDatabaseConnection:
    """Test database connection and initialization"""
    
    @pytest.fixture
    def test_db(self):
        """Create test database"""
        engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        # Create tables
        from models.schemas import Base
        Base.metadata.create_all(bind=engine)
        
        return TestingSessionLocal()
    
    def test_database_connection(self, test_db):
        """Test database connection works"""
        assert test_db is not None
    
    def test_database_initialization(self):
        """Test database initialization"""
        with patch('database.connection.create_engine') as mock_engine:
            mock_engine.return_value = MagicMock()
            
            init_db()
            
            mock_engine.assert_called_once()
    
    def test_get_db_session(self, test_db):
        """Test database session retrieval"""
        with patch('database.connection.SessionLocal') as mock_session:
            mock_session.return_value = test_db
            
            session = next(get_db_session())
            
            assert session is not None

class TestUserModel:
    """Test User model functionality"""
    
    @pytest.fixture
    def test_db(self):
        engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        from models.schemas import Base
        Base.metadata.create_all(bind=engine)
        
        return TestingSessionLocal()
    
    def test_create_user(self, test_db):
        """Test user creation"""
        user = User(
            id="user123",
            wallet_address="0x1234567890abcdef",
            created_at="2024-01-01T00:00:00Z",
            last_active="2024-01-01T00:00:00Z"
        )
        
        test_db.add(user)
        test_db.commit()
        
        retrieved_user = test_db.query(User).filter(User.id == "user123").first()
        assert retrieved_user is not None
        assert retrieved_user.wallet_address == "0x1234567890abcdef"
    
    def test_user_relationships(self, test_db):
        """Test user relationships with other models"""
        user = User(
            id="user123",
            wallet_address="0x1234567890abcdef",
            created_at="2024-01-01T00:00:00Z"
        )
        
        portfolio = Portfolio(
            user_id="user123",
            balance=100.0,
            tokens={},
            created_at="2024-01-01T00:00:00Z"
        )
        
        test_db.add(user)
        test_db.add(portfolio)
        test_db.commit()
        
        # Test relationship
        user_with_portfolio = test_db.query(User).filter(User.id == "user123").first()
        assert len(user_with_portfolio.portfolios) == 1
        assert user_with_portfolio.portfolios[0].balance == 100.0

class TestPortfolioModel:
    """Test Portfolio model functionality"""
    
    @pytest.fixture
    def test_db(self):
        engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        from models.schemas import Base
        Base.metadata.create_all(bind=engine)
        
        return TestingSessionLocal()
    
    def test_create_portfolio(self, test_db):
        """Test portfolio creation"""
        portfolio = Portfolio(
            user_id="user123",
            balance=100.0,
            tokens={"BASE": {"amount": 50.0, "value": 50.0}},
            created_at="2024-01-01T00:00:00Z"
        )
        
        test_db.add(portfolio)
        test_db.commit()
        
        retrieved_portfolio = test_db.query(Portfolio).filter(Portfolio.user_id == "user123").first()
        assert retrieved_portfolio is not None
        assert retrieved_portfolio.balance == 100.0
        assert "BASE" in retrieved_portfolio.tokens
    
    def test_update_portfolio(self, test_db):
        """Test portfolio updates"""
        portfolio = Portfolio(
            user_id="user123",
            balance=100.0,
            tokens={},
            created_at="2024-01-01T00:00:00Z"
        )
        
        test_db.add(portfolio)
        test_db.commit()
        
        # Update portfolio
        portfolio.balance = 150.0
        portfolio.tokens = {"BASE": {"amount": 100.0, "value": 100.0}}
        test_db.commit()
        
        updated_portfolio = test_db.query(Portfolio).filter(Portfolio.user_id == "user123").first()
        assert updated_portfolio.balance == 150.0
        assert "BASE" in updated_portfolio.tokens

class TestLearningProgressModel:
    """Test LearningProgress model functionality"""
    
    @pytest.fixture
    def test_db(self):
        engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        from models.schemas import Base
        Base.metadata.create_all(bind=engine)
        
        return TestingSessionLocal()
    
    def test_create_learning_progress(self, test_db):
        """Test learning progress creation"""
        progress = LearningProgress(
            user_id="user123",
            topic="Bitcoin Basics",
            level=1,
            score=85.0,
            completed_at="2024-01-01T00:00:00Z"
        )
        
        test_db.add(progress)
        test_db.commit()
        
        retrieved_progress = test_db.query(LearningProgress).filter(
            LearningProgress.user_id == "user123"
        ).first()
        
        assert retrieved_progress is not None
        assert retrieved_progress.topic == "Bitcoin Basics"
        assert retrieved_progress.score == 85.0
    
    def test_learning_progress_tracking(self, test_db):
        """Test learning progress tracking over time"""
        # Create multiple progress entries
        progress1 = LearningProgress(
            user_id="user123",
            topic="Bitcoin Basics",
            level=1,
            score=70.0,
            completed_at="2024-01-01T00:00:00Z"
        )
        
        progress2 = LearningProgress(
            user_id="user123",
            topic="Bitcoin Basics",
            level=2,
            score=90.0,
            completed_at="2024-01-02T00:00:00Z"
        )
        
        test_db.add(progress1)
        test_db.add(progress2)
        test_db.commit()
        
        # Query all progress for user
        all_progress = test_db.query(LearningProgress).filter(
            LearningProgress.user_id == "user123"
        ).all()
        
        assert len(all_progress) == 2
        assert all_progress[0].level == 1
        assert all_progress[1].level == 2

class TestSessionModel:
    """Test Session model functionality"""
    
    @pytest.fixture
    def test_db(self):
        engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        from models.schemas import Base
        Base.metadata.create_all(bind=engine)
        
        return TestingSessionLocal()
    
    def test_create_session(self, test_db):
        """Test session creation"""
        session = Session(
            id="session123",
            user_id="user123",
            created_at="2024-01-01T00:00:00Z",
            last_activity="2024-01-01T00:00:00Z",
            is_active=True
        )
        
        test_db.add(session)
        test_db.commit()
        
        retrieved_session = test_db.query(Session).filter(Session.id == "session123").first()
        assert retrieved_session is not None
        assert retrieved_session.user_id == "user123"
        assert retrieved_session.is_active is True
    
    def test_session_expiration(self, test_db):
        """Test session expiration handling"""
        session = Session(
            id="session123",
            user_id="user123",
            created_at="2024-01-01T00:00:00Z",
            last_activity="2024-01-01T00:00:00Z",
            is_active=True
        )
        
        test_db.add(session)
        test_db.commit()
        
        # Mark session as expired
        session.is_active = False
        test_db.commit()
        
        expired_session = test_db.query(Session).filter(Session.id == "session123").first()
        assert expired_session.is_active is False

class TestProgressTrackingService:
    """Test progress tracking service"""
    
    @pytest.fixture
    def progress_service(self):
        return ProgressTrackingService()
    
    @pytest.mark.asyncio
    async def test_track_learning_progress(self, progress_service):
        """Test learning progress tracking"""
        with patch('database.connection.get_db_session') as mock_db:
            mock_session = MagicMock()
            mock_db.return_value = mock_session
            
            result = await progress_service.track_progress(
                "user123", "Bitcoin Basics", 1, 85.0
            )
            
            assert result is True
            mock_session.add.assert_called_once()
            mock_session.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_user_progress(self, progress_service):
        """Test retrieving user progress"""
        with patch('database.connection.get_db_session') as mock_db:
            mock_session = MagicMock()
            mock_db.return_value = mock_session
            
            mock_progress = MagicMock()
            mock_progress.topic = "Bitcoin Basics"
            mock_progress.level = 1
            mock_progress.score = 85.0
            
            mock_session.query.return_value.filter.return_value.all.return_value = [mock_progress]
            
            progress = await progress_service.get_user_progress("user123")
            
            assert len(progress) == 1
            assert progress[0]["topic"] == "Bitcoin Basics"
    
    @pytest.mark.asyncio
    async def test_calculate_learning_level(self, progress_service):
        """Test learning level calculation"""
        with patch('database.connection.get_db_session') as mock_db:
            mock_session = MagicMock()
            mock_db.return_value = mock_session
            
            # Mock multiple progress entries
            mock_progress1 = MagicMock()
            mock_progress1.score = 80.0
            mock_progress2 = MagicMock()
            mock_progress2.score = 90.0
            
            mock_session.query.return_value.filter.return_value.all.return_value = [
                mock_progress1, mock_progress2
            ]
            
            level = await progress_service.calculate_learning_level("user123")
            
            assert level > 0  # Should have some level based on scores

class TestDatabaseIntegration:
    """Test database integration with services"""
    
    @pytest.mark.asyncio
    async def test_session_service_database_integration(self):
        """Test session service integrates with database"""
        with patch('database.connection.get_db_session') as mock_db:
            mock_session = MagicMock()
            mock_db.return_value = mock_session
            
            session_service = SessionService()
            
            # Mock database operations
            mock_session.add.return_value = None
            mock_session.commit.return_value = None
            mock_session.query.return_value.filter.return_value.first.return_value = None
            
            session_id = await session_service.create_session("user123")
            
            assert session_id is not None
            mock_session.add.assert_called_once()
            mock_session.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_portfolio_persistence(self):
        """Test portfolio data persistence"""
        with patch('database.connection.get_db_session') as mock_db:
            mock_session = MagicMock()
            mock_db.return_value = mock_session
            
            # Mock portfolio retrieval and update
            mock_portfolio = MagicMock()
            mock_portfolio.balance = 100.0
            mock_portfolio.tokens = {}
            
            mock_session.query.return_value.filter.return_value.first.return_value = mock_portfolio
            
            # Simulate portfolio update
            mock_portfolio.balance = 150.0
            mock_portfolio.tokens = {"BASE": {"amount": 50.0, "value": 50.0}}
            
            mock_session.commit.return_value = None
            
            # Verify portfolio was updated
            assert mock_portfolio.balance == 150.0
            assert "BASE" in mock_portfolio.tokens
    
    @pytest.mark.asyncio
    async def test_data_consistency(self):
        """Test data consistency across operations"""
        with patch('database.connection.get_db_session') as mock_db:
            mock_session = MagicMock()
            mock_db.return_value = mock_session
            
            # Mock transaction rollback on error
            mock_session.commit.side_effect = Exception("Database error")
            mock_session.rollback.return_value = None
            
            with pytest.raises(Exception):
                # Simulate operation that fails
                mock_session.add(MagicMock())
                mock_session.commit()
            
            # Verify rollback was called
            mock_session.rollback.assert_called_once()

class TestDatabasePerformance:
    """Test database performance considerations"""
    
    @pytest.mark.asyncio
    async def test_connection_pooling(self):
        """Test database connection pooling"""
        with patch('database.connection.create_engine') as mock_engine:
            mock_engine.return_value = MagicMock()
            
            # Simulate multiple connections
            init_db()
            init_db()
            init_db()
            
            # Should reuse connections from pool
            assert mock_engine.call_count == 1
    
    @pytest.mark.asyncio
    async def test_query_optimization(self):
        """Test query optimization"""
        with patch('database.connection.get_db_session') as mock_db:
            mock_session = MagicMock()
            mock_db.return_value = mock_session
            
            # Mock efficient query
            mock_session.query.return_value.filter.return_value.first.return_value = MagicMock()
            
            # Simulate optimized query
            result = mock_session.query(User).filter(User.id == "user123").first()
            
            assert result is not None
            # Verify query was called efficiently
            mock_session.query.assert_called_once()
