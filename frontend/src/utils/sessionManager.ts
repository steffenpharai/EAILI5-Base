const SESSION_KEY = 'eaili5_session_token';
const SESSION_EXPIRY_KEY = 'eaili5_session_expiry';

interface SessionData {
  token: string;
  expiresAt: number;
}

class SessionManager {
  private apiUrl: string;
  
  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  }
  
  async getOrCreateSession(walletAddress?: string): Promise<string> {
    // Check if we have a valid session in localStorage
    const stored = this.getStoredSession();
    if (stored && stored.expiresAt > Date.now()) {
      // Validate the session with the backend
      const isValid = await this.validateSession(stored.token);
      if (isValid) {
        return stored.token;
      } else {
        // Clear invalid session
        this.clearSession();
      }
    }
    
    // Create new session from backend
    return await this.createNewSession(walletAddress);
  }
  
  private async validateSession(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/session/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: token })
      });
      return response.ok;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }

  private clearSession(): void {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_EXPIRY_KEY);
  }

  // Public method to force clear all sessions (useful for debugging)
  public clearAllSessions(): void {
    this.clearSession();
  }

  private getStoredSession(): SessionData | null {
    const token = localStorage.getItem(SESSION_KEY);
    const expiryStr = localStorage.getItem(SESSION_EXPIRY_KEY);
    
    if (!token || !expiryStr) return null;
    
    return {
      token,
      expiresAt: parseInt(expiryStr)
    };
  }
  
  private async createNewSession(walletAddress?: string): Promise<string> {
    try {
      console.log('Creating new session with API URL:', this.apiUrl);
      const requestBody = {
        user_id: walletAddress || 'anonymous',
        wallet_address: walletAddress
      };
      console.log('Session creation request body:', requestBody);
      
      const response = await fetch(`${this.apiUrl}/api/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Session creation response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Session creation failed:', errorText);
        throw new Error('Failed to create session');
      }
      
      const data = await response.json();
      console.log('Session creation response data:', data);
      
      if (!data.session_token) {
        console.error('Invalid session response:', data);
        throw new Error('Invalid session token received');
      }
      
      const expiresAt = Date.now() + (data.expires_in * 1000);
      
      // Store in localStorage
      localStorage.setItem(SESSION_KEY, data.session_token);
      localStorage.setItem(SESSION_EXPIRY_KEY, expiresAt.toString());
      
      console.log('Session token stored in localStorage:', data.session_token);
      return data.session_token;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }
  
  async endSession(token: string): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/api/session/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: token })
      });
    } catch (error) {
      console.error('Error ending session:', error);
    }
    
    this.clearLocalSession();
  }
  
  clearLocalSession(): void {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_EXPIRY_KEY);
  }
}

export const sessionManager = new SessionManager();
