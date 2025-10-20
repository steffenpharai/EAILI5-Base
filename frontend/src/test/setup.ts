import '@testing-library/jest-dom';

// Mock WebSocket
class MockWebSocket {
  public readyState = 0; // WebSocket.CONNECTING
  public url: string;
  public onopen: ((event: Event) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public send = jest.fn();
  public close = jest.fn();
  public addEventListener = jest.fn();
  public removeEventListener = jest.fn();

  constructor(url: string) {
    this.url = url;
    // Simulate connection
    setTimeout(() => {
      this.readyState = 1; // WebSocket.OPEN
      if (this.onopen) this.onopen(new Event('open'));
    }, 10);
  }
}

// Mock global WebSocket
global.WebSocket = MockWebSocket as any;

// Mock environment variables
process.env.REACT_APP_API_URL = 'http://localhost:8000';
process.env.REACT_APP_WS_URL = 'ws://localhost:8000';
process.env.REACT_APP_BASE_RPC_URL = 'https://mainnet.base.org';
