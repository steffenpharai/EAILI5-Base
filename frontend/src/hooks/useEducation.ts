import { useState, useEffect } from 'react';

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

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  completed: boolean;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeSpent?: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
  points: number;
  category: string;
}

interface ProgressStats {
  totalLessons: number;
  completedLessons: number;
  totalTime: number;
  streak: number;
  level: number;
  xp: number;
  nextLevelXp: number;
  created_at?: string;
  last_updated?: string;
}

interface UserProgress {
  user_id: string;
  stats: ProgressStats;
  achievements: Achievement[];
  learning_paths: LearningPath[];
  recent_lessons: Lesson[];
}

export const useEducation = (userId: string = 'anonymous') => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/progress/${userId}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setProgress(data.progress);
      } else {
        setError(data.error || 'Failed to fetch progress');
      }
    } catch (err) {
      setError('Network error fetching progress');
      console.error('Error fetching progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const completeLesson = async (lessonId: string, category: string, timeSpent: number = 0) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/progress/${userId}/complete-lesson`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: lessonId,
          category,
          time_spent: timeSpent
        })
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        // Refresh progress data
        await fetchProgress();
        return true;
      } else {
        setError(data.error || 'Failed to complete lesson');
        return false;
      }
    } catch (err) {
      setError('Network error completing lesson');
      console.error('Error completing lesson:', err);
      return false;
    }
  };

  const updateStreak = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/progress/${userId}/streak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        await fetchProgress();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating streak:', err);
      return false;
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProgress();
    }
  }, [userId]);

  return {
    progress,
    loading,
    error,
    fetchProgress,
    completeLesson,
    updateStreak,
  };
};

export const useAchievements = (userId: string = 'anonymous') => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievements = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/progress/${userId}/achievements`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setAchievements(data.achievements || []);
      } else {
        setError(data.error || 'Failed to fetch achievements');
      }
    } catch (err) {
      setError('Network error fetching achievements');
      console.error('Error fetching achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAchievements = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/progress/${userId}/achievements/available`);
      const data = await response.json();
      
      if (data.status === 'success') {
        return data.achievements || [];
      }
      return [];
    } catch (err) {
      console.error('Error fetching available achievements:', err);
      return [];
    }
  };

  useEffect(() => {
    if (userId) {
      fetchAchievements();
    }
  }, [userId]);

  return {
    achievements,
    loading,
    error,
    fetchAchievements,
    fetchAvailableAchievements,
  };
};

export const useLearningPaths = () => {
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLearningPaths = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/education/paths`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setLearningPaths(data.paths || []);
      } else {
        setError(data.error || 'Failed to fetch learning paths');
      }
    } catch (err) {
      setError('Network error fetching learning paths');
      console.error('Error fetching learning paths:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLearningPath = async (pathId: string) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/education/paths/${pathId}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        return data.path;
      }
      return null;
    } catch (err) {
      console.error('Error fetching learning path:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchLearningPaths();
  }, []);

  return {
    learningPaths,
    loading,
    error,
    fetchLearningPaths,
    fetchLearningPath,
  };
};

export const useEducationalContent = () => {
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContentByCategory = async (category: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/education/content/${category}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setContent(data.content || []);
      } else {
        setError(data.error || 'Failed to fetch content');
      }
    } catch (err) {
      setError('Network error fetching content');
      console.error('Error fetching content:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchContentById = async (contentId: string) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/education/content/id/${contentId}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        return data.content;
      }
      return null;
    } catch (err) {
      console.error('Error fetching content by ID:', err);
      return null;
    }
  };

  return {
    content,
    loading,
    error,
    fetchContentByCategory,
    fetchContentById,
  };
};

export const useLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async (period: string = 'all_time', limit: number = 10) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/progress/leaderboard?period=${period}&limit=${limit}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setLeaderboard(data.leaderboard || []);
      } else {
        setError(data.error || 'Failed to fetch leaderboard');
      }
    } catch (err) {
      setError('Network error fetching leaderboard');
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    leaderboard,
    loading,
    error,
    fetchLeaderboard,
  };
};
