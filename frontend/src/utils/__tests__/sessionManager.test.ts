import { sessionManager } from '../sessionManager';

// Mock fetch
global.fetch = jest.fn();

describe('SessionManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getOrCreateSession', () => {
    it('creates new session when none exists', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          session_token: 'test-session-token',
          expires_in: 86400
        })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await sessionManager.getOrCreateSession('0x1234567890abcdef');

      expect(result).toBe('test-session-token');
      expect(localStorage.getItem('eaili5_session_token')).toBe('test-session-token');
      expect(localStorage.getItem('eaili5_session_expiry')).toBeTruthy();
    });

    it('returns existing valid session', async () => {
      const futureTime = Date.now() + 3600000; // 1 hour from now
      localStorage.setItem('eaili5_session_token', 'existing-token');
      localStorage.setItem('eaili5_session_expiry', futureTime.toString());

      const result = await sessionManager.getOrCreateSession('0x1234567890abcdef');

      expect(result).toBe('existing-token');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('creates new session when existing one is expired', async () => {
      const pastTime = Date.now() - 3600000; // 1 hour ago
      localStorage.setItem('eaili5_session_token', 'expired-token');
      localStorage.setItem('eaili5_session_expiry', pastTime.toString());

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          session_token: 'new-session-token',
          expires_in: 86400
        })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await sessionManager.getOrCreateSession('0x1234567890abcdef');

      expect(result).toBe('new-session-token');
      expect(localStorage.getItem('eaili5_session_token')).toBe('new-session-token');
    });

    it('handles session creation failure', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await expect(
        sessionManager.getOrCreateSession('0x1234567890abcdef')
      ).rejects.toThrow('Network error');
    });
  });

  describe('validateSession', () => {
    it('validates session successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ valid: true })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await sessionManager.validateSession('test-token');

      expect(result).toBe(true);
    });

    it('returns false for invalid session', async () => {
      const mockResponse = {
        ok: false,
        status: 401
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await sessionManager.validateSession('invalid-token');

      expect(result).toBe(false);
    });

    it('handles validation errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await sessionManager.validateSession('test-token');

      expect(result).toBe(false);
    });
  });

  describe('endSession', () => {
    it('ends session and clears localStorage', async () => {
      localStorage.setItem('eaili5_session_token', 'test-token');
      localStorage.setItem('eaili5_session_expiry', '1234567890');

      const mockResponse = { ok: true };
      (global.fetch as any).mockResolvedValue(mockResponse);

      await sessionManager.endSession('test-token');

      expect(localStorage.getItem('eaili5_session_token')).toBeNull();
      expect(localStorage.getItem('eaili5_session_expiry')).toBeNull();
    });

    it('clears localStorage even if API call fails', async () => {
      localStorage.setItem('eaili5_session_token', 'test-token');
      localStorage.setItem('eaili5_session_expiry', '1234567890');

      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await sessionManager.endSession('test-token');

      expect(localStorage.getItem('eaili5_session_token')).toBeNull();
      expect(localStorage.getItem('eaili5_session_expiry')).toBeNull();
    });
  });

  describe('clearLocalSession', () => {
    it('clears session data from localStorage', () => {
      localStorage.setItem('eaili5_session_token', 'test-token');
      localStorage.setItem('eaili5_session_expiry', '1234567890');

      sessionManager.clearLocalSession();

      expect(localStorage.getItem('eaili5_session_token')).toBeNull();
      expect(localStorage.getItem('eaili5_session_expiry')).toBeNull();
    });
  });
});
