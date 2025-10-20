import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Trophy, 
  Target, 
  TrendingUp, 
  Users, 
  Clock, 
  Star,
  ChevronRight,
  Play,
  CheckCircle,
  Lock,
  Award,
  BarChart3,
  Brain,
  Zap
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { ProButton, ProCard } from './pro';

interface LearningDashboardProps {
  userId?: string;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  lessons: number;
  completed: number;
  progress: number;
  category: string;
  icon: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
  points: number;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  completed: boolean;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface ProgressStats {
  totalLessons: number;
  completedLessons: number;
  totalTime: number;
  streak: number;
  level: number;
  xp: number;
  nextLevelXp: number;
}

const LearningDashboard: React.FC<LearningDashboardProps> = ({ userId = 'anonymous' }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'overview' | 'paths' | 'lessons' | 'achievements' | 'progress'>('overview');
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLearningData();
  }, [userId]);

  const fetchLearningData = async () => {
    setLoading(true);
    try {
      // Fetch learning paths
      const pathsResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/education/paths`);
      const pathsData = await pathsResponse.json();
      if (pathsData.status === 'success') {
        setLearningPaths(pathsData.paths || []);
      }

      // Fetch achievements
      const achievementsResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/progress/${userId}/achievements`);
      const achievementsData = await achievementsResponse.json();
      if (achievementsData.status === 'success') {
        setAchievements(achievementsData.achievements || []);
      }

      // Fetch progress stats
      const progressResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/progress/${userId}/stats`);
      const progressData = await progressResponse.json();
      if (progressData.status === 'success') {
        setProgressStats(progressData.stats);
      }

      // Fetch lessons (mock data for now)
      setLessons([
        {
          id: '1',
          title: 'What is Bitcoin?',
          description: 'Learn the basics of Bitcoin and how it works',
          duration: '5 min',
          completed: true,
          category: 'Cryptocurrency Basics',
          difficulty: 'beginner'
        },
        {
          id: '2',
          title: 'Understanding Blockchain',
          description: 'Explore the technology behind cryptocurrencies',
          duration: '8 min',
          completed: true,
          category: 'Technology',
          difficulty: 'beginner'
        },
        {
          id: '3',
          title: 'DeFi Fundamentals',
          description: 'Introduction to Decentralized Finance',
          duration: '12 min',
          completed: false,
          category: 'DeFi',
          difficulty: 'intermediate'
        },
        {
          id: '4',
          title: 'Smart Contracts',
          description: 'How smart contracts work and their applications',
          duration: '15 min',
          completed: false,
          category: 'Technology',
          difficulty: 'intermediate'
        }
      ]);
    } catch (error) {
      console.error('Error fetching learning data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return theme.accent.green;
      case 'intermediate': return theme.accent.orange;
      case 'advanced': return theme.accent.red;
      default: return theme.text.secondary;
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return <Star className="w-4 h-4" />;
      case 'intermediate': return <Target className="w-4 h-4" />;
      case 'advanced': return <Trophy className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: theme.surface.primary,
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px',
    borderBottom: `1px solid ${theme.border.primary}`,
    background: theme.surface.secondary,
  };

  const titleStyles: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    color: theme.text.primary,
    fontFamily: 'Inter, system-ui, sans-serif',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const tabsContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    padding: '0 20px',
    borderBottom: `1px solid ${theme.border.primary}`,
    background: theme.surface.primary,
  };

  const tabButtonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    borderRadius: '8px 8px 0 0',
    border: 'none',
    background: 'transparent',
    color: theme.text.secondary,
    cursor: 'pointer',
    transition: 'all 150ms ease',
    fontSize: '14px',
    fontWeight: 500,
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const activeTabStyles: React.CSSProperties = {
    background: theme.surface.secondary,
    color: theme.text.primary,
    borderBottom: `2px solid ${theme.accent.blue}`,
  };

  const contentStyles: React.CSSProperties = {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
  };

  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Progress Overview */}
      {progressStats && (
        <div style={{
          background: theme.surface.secondary,
          borderRadius: '12px',
          padding: '20px',
          border: `1px solid ${theme.border.primary}`,
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: theme.text.primary,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <BarChart3 className="w-5 h-5" />
            Your Progress
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 700, color: theme.accent.blue }}>
                {progressStats.level}
              </div>
              <div style={{ fontSize: '14px', color: theme.text.secondary }}>Level</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 700, color: theme.accent.green }}>
                {progressStats.completedLessons}
              </div>
              <div style={{ fontSize: '14px', color: theme.text.secondary }}>Lessons Completed</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 700, color: theme.accent.orange }}>
                {progressStats.streak}
              </div>
              <div style={{ fontSize: '14px', color: theme.text.secondary }}>Day Streak</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 700, color: theme.accent.purple }}>
                {Math.floor(progressStats.totalTime / 60)}
              </div>
              <div style={{ fontSize: '14px', color: theme.text.secondary }}>Hours Learned</div>
            </div>
          </div>
          
          {/* XP Progress Bar */}
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: theme.text.secondary }}>XP Progress</span>
              <span style={{ fontSize: '14px', color: theme.text.secondary }}>
                {progressStats.xp} / {progressStats.nextLevelXp}
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              background: theme.surface.tertiary,
              borderRadius: '4px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${(progressStats.xp / progressStats.nextLevelXp) * 100}%`,
                height: '100%',
                background: theme.accent.blue,
                transition: 'width 300ms ease',
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{
        background: theme.surface.secondary,
        borderRadius: '12px',
        padding: '20px',
        border: `1px solid ${theme.border.primary}`,
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 600,
          color: theme.text.primary,
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <Zap className="w-5 h-5" />
          Quick Actions
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
          <ProButton
            variant="primary"
            size="lg"
            onClick={() => setActiveTab('lessons')}
            className="justify-start gap-3"
          >
            <Play className="w-5 h-5" />
            Continue Learning
          </ProButton>
          
          <ProButton
            variant="ghost"
            size="lg"
            onClick={() => setActiveTab('paths')}
            className="justify-start gap-3"
          >
            <BookOpen className="w-5 h-5" />
            Browse Learning Paths
          </ProButton>
          
          <ProButton
            variant="ghost"
            size="lg"
            onClick={() => setActiveTab('achievements')}
            className="justify-start gap-3"
          >
            <Trophy className="w-5 h-5" />
            View Achievements
          </ProButton>
        </div>
      </div>
    </div>
  );

  const renderLearningPaths = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {learningPaths.length === 0 ? (
        <div style={{ textAlign: 'center', color: theme.text.tertiary, padding: '40px' }}>
          <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: theme.text.tertiary }} />
          <p>No learning paths available yet</p>
        </div>
      ) : (
        learningPaths.map((path) => (
          <div
            key={path.id}
            style={{
              background: theme.surface.secondary,
              borderRadius: '12px',
              padding: '20px',
              border: `1px solid ${theme.border.primary}`,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = theme.accent.blue;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.border.primary;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  background: theme.accent.blue,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme.surface.primary,
                }}>
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: 600, color: theme.text.primary, margin: 0 }}>
                    {path.title}
                  </h4>
                  <p style={{ fontSize: '14px', color: theme.text.secondary, margin: '4px 0 0 0' }}>
                    {path.description}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: theme.text.tertiary }} />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {getDifficultyIcon(path.difficulty)}
                <span style={{ 
                  fontSize: '12px', 
                  color: getDifficultyColor(path.difficulty),
                  textTransform: 'capitalize'
                }}>
                  {path.difficulty}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock className="w-4 h-4" style={{ color: theme.text.tertiary }} />
                <span style={{ fontSize: '12px', color: theme.text.secondary }}>{path.duration}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <BookOpen className="w-4 h-4" style={{ color: theme.text.tertiary }} />
                <span style={{ fontSize: '12px', color: theme.text.secondary }}>
                  {path.completed}/{path.lessons} lessons
                </span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: theme.text.secondary }}>Progress</span>
                <span style={{ fontSize: '12px', color: theme.text.secondary }}>{path.progress}%</span>
              </div>
              <div style={{
                width: '100%',
                height: '6px',
                background: theme.surface.tertiary,
                borderRadius: '3px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${path.progress}%`,
                  height: '100%',
                  background: theme.accent.blue,
                  transition: 'width 300ms ease',
                }} />
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderLessons = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {lessons.map((lesson) => (
        <div
          key={lesson.id}
          style={{
            background: theme.surface.secondary,
            borderRadius: '8px',
            padding: '16px',
            border: `1px solid ${theme.border.primary}`,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: lesson.completed ? theme.accent.green : theme.surface.tertiary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: lesson.completed ? theme.surface.primary : theme.text.secondary,
          }}>
            {lesson.completed ? <CheckCircle className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </div>
          
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: theme.text.primary, margin: 0 }}>
              {lesson.title}
            </h4>
            <p style={{ fontSize: '14px', color: theme.text.secondary, margin: '4px 0 0 0' }}>
              {lesson.description}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
              <span style={{ 
                fontSize: '12px', 
                color: getDifficultyColor(lesson.difficulty),
                textTransform: 'capitalize'
              }}>
                {lesson.difficulty}
              </span>
              <span style={{ fontSize: '12px', color: theme.text.tertiary }}>•</span>
              <span style={{ fontSize: '12px', color: theme.text.secondary }}>{lesson.duration}</span>
              <span style={{ fontSize: '12px', color: theme.text.tertiary }}>•</span>
              <span style={{ fontSize: '12px', color: theme.text.secondary }}>{lesson.category}</span>
            </div>
          </div>
          
          <ProButton
            variant={lesson.completed ? "ghost" : "primary"}
            size="sm"
            disabled={!lesson.completed}
          >
            {lesson.completed ? 'Completed' : 'Start'}
          </ProButton>
        </div>
      ))}
    </div>
  );

  const renderAchievements = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {achievements.length === 0 ? (
        <div style={{ textAlign: 'center', color: theme.text.tertiary, padding: '40px' }}>
          <Trophy className="w-12 h-12 mx-auto mb-4" style={{ color: theme.text.tertiary }} />
          <p>No achievements earned yet</p>
        </div>
      ) : (
        achievements.map((achievement) => (
          <div
            key={achievement.id}
            style={{
              background: theme.surface.secondary,
              borderRadius: '12px',
              padding: '20px',
              border: `1px solid ${achievement.earned ? theme.accent.gold : theme.border.primary}`,
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              opacity: achievement.earned ? 1 : 0.6,
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              background: achievement.earned ? theme.accent.gold : theme.surface.tertiary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: achievement.earned ? theme.surface.primary : theme.text.secondary,
            }}>
              {achievement.earned ? <Award className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
            </div>
            
            <div style={{ flex: 1 }}>
              <h4 style={{ 
                fontSize: '16px', 
                fontWeight: 600, 
                color: theme.text.primary, 
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {achievement.title}
                {achievement.earned && <span style={{ fontSize: '12px', color: theme.accent.gold }}>+{achievement.points} XP</span>}
              </h4>
              <p style={{ fontSize: '14px', color: theme.text.secondary, margin: '4px 0 0 0' }}>
                {achievement.description}
              </p>
              {achievement.earnedAt && (
                <p style={{ fontSize: '12px', color: theme.text.tertiary, margin: '4px 0 0 0' }}>
                  Earned on {new Date(achievement.earnedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderProgress = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {progressStats && (
        <>
          <div style={{
            background: theme.surface.secondary,
            borderRadius: '12px',
            padding: '20px',
            border: `1px solid ${theme.border.primary}`,
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: theme.text.primary,
              marginBottom: '16px',
            }}>
              Learning Statistics
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: theme.accent.blue }}>
                  {progressStats.completedLessons}
                </div>
                <div style={{ fontSize: '12px', color: theme.text.secondary }}>Lessons Completed</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: theme.accent.green }}>
                  {Math.floor(progressStats.totalTime / 60)}
                </div>
                <div style={{ fontSize: '12px', color: theme.text.secondary }}>Hours Learned</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: theme.accent.orange }}>
                  {progressStats.streak}
                </div>
                <div style={{ fontSize: '12px', color: theme.text.secondary }}>Day Streak</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: theme.accent.purple }}>
                  {progressStats.level}
                </div>
                <div style={{ fontSize: '12px', color: theme.text.secondary }}>Current Level</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (loading) {
    return (
      <div style={containerStyles}>
        <div style={contentStyles}>
          <div style={{ textAlign: 'center', color: theme.text.secondary, padding: '40px' }}>
            <Brain className="w-8 h-8 mx-auto mb-4 animate-pulse" style={{ color: theme.accent.blue }} />
            <p>Loading learning dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <h2 style={titleStyles}>
          <Brain className="w-6 h-6" />
          Learning Dashboard
        </h2>
      </div>

      <div style={tabsContainerStyles}>
        <button
          style={{
            ...tabButtonStyles,
            ...(activeTab === 'overview' ? activeTabStyles : {}),
          }}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 className="w-4 h-4" />
          Overview
        </button>
        
        <button
          style={{
            ...tabButtonStyles,
            ...(activeTab === 'paths' ? activeTabStyles : {}),
          }}
          onClick={() => setActiveTab('paths')}
        >
          <BookOpen className="w-4 h-4" />
          Learning Paths
        </button>
        
        <button
          style={{
            ...tabButtonStyles,
            ...(activeTab === 'lessons' ? activeTabStyles : {}),
          }}
          onClick={() => setActiveTab('lessons')}
        >
          <Play className="w-4 h-4" />
          Lessons
        </button>
        
        <button
          style={{
            ...tabButtonStyles,
            ...(activeTab === 'achievements' ? activeTabStyles : {}),
          }}
          onClick={() => setActiveTab('achievements')}
        >
          <Trophy className="w-4 h-4" />
          Achievements
        </button>
        
        <button
          style={{
            ...tabButtonStyles,
            ...(activeTab === 'progress' ? activeTabStyles : {}),
          }}
          onClick={() => setActiveTab('progress')}
        >
          <TrendingUp className="w-4 h-4" />
          Progress
        </button>
      </div>

      <div style={contentStyles}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'paths' && renderLearningPaths()}
        {activeTab === 'lessons' && renderLessons()}
        {activeTab === 'achievements' && renderAchievements()}
        {activeTab === 'progress' && renderProgress()}
      </div>
    </div>
  );
};

export default LearningDashboard;
