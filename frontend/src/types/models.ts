// Data models for EAILI5 application

export interface User {
  id: string;
  walletAddress?: string;
  username?: string;
  email?: string;
  preferences: UserPreferences;
  stats: UserStats;
  createdAt: string;
  lastActive: string;
}

export interface UserPreferences {
  learningLevel: number;
  interests: string[];
  notifications: NotificationSettings;
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  chat: boolean;
  achievements: boolean;
  marketUpdates: boolean;
}

export interface UserStats {
  totalLessons: number;
  completedLessons: number;
  streak: number;
  achievements: Achievement[];
  learningTime: number;
  level: number;
  xp: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
  category: 'learning' | 'trading' | 'social' | 'milestone';
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  lessons: Lesson[];
  prerequisites: string[];
  category: string;
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'video' | 'interactive' | 'quiz';
  duration: number;
  order: number;
  completed: boolean;
  unlocked: boolean;
}

export interface Progress {
  userId: string;
  pathId: string;
  lessonId: string;
  completed: boolean;
  score?: number;
  timeSpent: number;
  completedAt?: string;
}

export interface ChatMessageModel {
  id: string;
  type: 'user' | 'eali5';
  message: string;
  timestamp: Date;
  suggestions?: string[];
  learningLevel?: number;
}

export interface Suggestion {
  text: string;
  category: 'question' | 'explanation' | 'tutorial' | 'example';
  difficulty: number;
}

export interface LearningRecommendation {
  type: 'lesson' | 'path' | 'practice' | 'review';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number;
  difficulty: number;
}

export interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalLessons: number;
  completedLessons: number;
  averageSessionTime: number;
  popularTokens: string[];
  userEngagement: EngagementMetrics;
}

export interface EngagementMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionDuration: number;
  lessonCompletionRate: number;
  userRetentionRate: number;
}
