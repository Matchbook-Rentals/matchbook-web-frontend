import React, { useEffect } from 'react';
import { render, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Extract the useWebSocket hook from message-interface.tsx for testing
// This is a simplified version for testing purposes that mimics the behavior in the component
const useWebSocket = (url: string, options: {
  onMessage: (message: any) => void;
  onError: (error: Event) => void;
  onClose: (event: CloseEvent) => void;
  onOpen: (event: Event) => void;
}) => {
  const [isConnected, setIsConnected] = React.useState(false);
  const [connectionAttempts, setConnectionAttempts] = React.useState(0);
  const wsRef = React.useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = React.useCallback(() => {
    const MAX_RECONNECT_ATTEMPTS = 10;
    const BASE_RECONNECT_DELAY = 2000;
    const PING_INTERVAL = 20000;

    if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
      setTimeout(() => {
        setConnectionAttempts(0);
        connectWebSocket();
      }, 30000);
      return;
    }

    if (wsRef.current) wsRef.current.close();
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

    wsRef.current = new WebSocket(url);

    wsRef.current.onopen = (event) => {
      setIsConnected(true);
      setConnectionAttempts(0);
      options.onOpen(event);
      pingIntervalRef.current = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        }
      }, PING_INTERVAL);
    };

    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type !== 'ping') options.onMessage(message);
    };

    wsRef.current.onerror = (error) => {
      setIsConnected(false);
      options.onError(error);
    };

    wsRef.current.onclose = (event) => {
      setIsConnected(false);
      options.onClose(event);
      if (!event.wasClean) {
        const delay = BASE_RECONNECT_DELAY * Math.pow(1.5, connectionAttempts);
        reconnectTimeoutRef.current = setTimeout(() => {
          setConnectionAttempts((prev) => prev + 1);
          connectWebSocket();
        }, delay);
      }
    };
  }, [connectionAttempts, options, url]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      wsRef.current?.close();
    };
  }, [connectWebSocket]);

  const send = (data: any) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify(data));
    }
  };

  return { ws: wsRef.current, isConnected, connectionAttempts, send };
};

// Mock WebSocket
class MockWebSocket {
  onopen: ((event: any) => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onclose: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  readyState = WebSocket.CONNECTING;
  url: string;

  constructor(url: string) {
    this.url = url;
    // Simulate connection after 50ms
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) this.onopen({});
    }, 50);
  }

  send(data: string) {
    // Simulate ping response
    try {
      const message = JSON.parse(data);
      if (message.type === 'ping' && this.onmessage) {
        this.onmessage({
          data: JSON.stringify({
            type: 'ping',
            timestamp: Date.now(),
            serverTime: new Date().toISOString()
          })
        });
      }
    } catch (e) {
      console.error('Error processing mock message:', e);
    }
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) this.onclose({ wasClean: true, code: 1000 });
  }
}

// Replace the WebSocket constructor with our mock
global.WebSocket = MockWebSocket as any;

// Test component that uses the hook
function TestComponent({
  url,
  onMessage,
  onError,
  onClose,
  onOpen,
  triggerSend,
  triggerClose,
  triggerError
}: {
  url: string;
  onMessage: (message: any) => void;
  onError: (error: Event) => void;
  onClose: (event: CloseEvent) => void;
  onOpen: (event: Event) => void;
  triggerSend?: boolean;
  triggerClose?: boolean;
  triggerError?: boolean;
}) {
  const { ws, isConnected, connectionAttempts, send } = useWebSocket(url, {
    onMessage,
    onError,
    onClose,
    onOpen
  });

  useEffect(() => {
    if (triggerSend && isConnected) {
      send({ type: 'ping', timestamp: Date.now() });
    }
  }, [triggerSend, isConnected, send]);

  useEffect(() => {
    if (triggerClose && ws) {
      ws.close();
    }
  }, [triggerClose, ws]);

  useEffect(() => {
    if (triggerError && ws?.onerror) {
      ws.onerror(new Event('error'));
    }
  }, [triggerError, ws]);

  return (
    <div>
      <div data-testid="connection-status">{isConnected ? 'connected' : 'disconnected'}</div>
      <div data-testid="connection-attempts">{connectionAttempts}</div>
    </div>
  );
}

describe('useWebSocket Hook', () => {
  const onMessageMock = jest.fn();
  const onErrorMock = jest.fn();
  const onCloseMock = jest.fn();
  const onOpenMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('connects to WebSocket and updates status', async () => {
    const { getByTestId } = render(
      <TestComponent
        url="ws://example.com/ws"
        onMessage={onMessageMock}
        onError={onErrorMock}
        onClose={onCloseMock}
        onOpen={onOpenMock}
      />
    );

    // Initially disconnected
    expect(getByTestId('connection-status')).toHaveTextContent('disconnected');
    
    // Simulate connection establishing
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    // Should be connected now
    await waitFor(() => {
      expect(getByTestId('connection-status')).toHaveTextContent('connected');
    });
    
    // onOpen should have been called
    expect(onOpenMock).toHaveBeenCalled();
  });

  it('sends messages when connected', async () => {
    const { getByTestId } = render(
      <TestComponent
        url="ws://example.com/ws"
        onMessage={onMessageMock}
        onError={onErrorMock}
        onClose={onCloseMock}
        onOpen={onOpenMock}
        triggerSend={true}
      />
    );

    // Simulate connection establishing
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    // Wait for connection to be established
    await waitFor(() => {
      expect(getByTestId('connection-status')).toHaveTextContent('connected');
    });
    
    // The send should trigger a ping response
    await waitFor(() => {
      expect(onMessageMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'ping' })
      );
    });
  });

  it('handles connection close and attempts reconnection', async () => {
    const { getByTestId } = render(
      <TestComponent
        url="ws://example.com/ws"
        onMessage={onMessageMock}
        onError={onErrorMock}
        onClose={onCloseMock}
        onOpen={onOpenMock}
        triggerClose={true}
      />
    );

    // Simulate connection establishing
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    // Wait for connection to be established
    await waitFor(() => {
      expect(getByTestId('connection-status')).toHaveTextContent('connected');
    });
    
    // Simulate connection close (non-clean)
    act(() => {
      const mockWebSocket = (global.WebSocket as any).mock.instances[0];
      if (mockWebSocket.onclose) {
        mockWebSocket.onclose({ wasClean: false, code: 1006 });
      }
    });
    
    // Should be disconnected now
    await waitFor(() => {
      expect(getByTestId('connection-status')).toHaveTextContent('disconnected');
    });
    
    // onClose should have been called
    expect(onCloseMock).toHaveBeenCalled();
    
    // Should attempt reconnection
    await waitFor(() => {
      expect(getByTestId('connection-attempts')).toHaveTextContent('1');
    });
    
    // Simulate second connection establishing
    act(() => {
      jest.advanceTimersByTime(5000); // Allow for reconnect delay
    });
    
    // Should be connected again
    await waitFor(() => {
      expect(getByTestId('connection-status')).toHaveTextContent('connected');
    });
    
    // onOpen should have been called again
    expect(onOpenMock).toHaveBeenCalledTimes(2);
  });

  it('handles errors', async () => {
    const { getByTestId } = render(
      <TestComponent
        url="ws://example.com/ws"
        onMessage={onMessageMock}
        onError={onErrorMock}
        onClose={onCloseMock}
        onOpen={onOpenMock}
        triggerError={true}
      />
    );

    // Simulate connection establishing
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    // Wait for connection to be established
    await waitFor(() => {
      expect(getByTestId('connection-status')).toHaveTextContent('connected');
    });
    
    // Trigger error
    act(() => {
      const mockWebSocket = (global.WebSocket as any).mock.instances[0];
      if (mockWebSocket.onerror) {
        mockWebSocket.onerror(new Event('error'));
      }
    });
    
    // Should be disconnected after error
    await waitFor(() => {
      expect(getByTestId('connection-status')).toHaveTextContent('disconnected');
    });
    
    // onError should have been called
    expect(onErrorMock).toHaveBeenCalled();
  });

  it('stops reconnection attempts after max attempts', async () => {
    const { getByTestId } = render(
      <TestComponent
        url="ws://example.com/ws"
        onMessage={onMessageMock}
        onError={onErrorMock}
        onClose={onCloseMock}
        onOpen={onOpenMock}
      />
    );

    // Force 10 failed reconnection attempts
    for (let i = 0; i < 10; i++) {
      act(() => {
        const mockWebSocket = (global.WebSocket as any).mock.instances[i];
        if (mockWebSocket && mockWebSocket.onclose) {
          mockWebSocket.onclose({ wasClean: false, code: 1006 });
        }
        jest.advanceTimersByTime(5000); // Advance past reconnect delay
      });
    }
    
    await waitFor(() => {
      expect(getByTestId('connection-attempts')).toHaveTextContent('10');
    });
    
    // Should reset after 30 seconds and try again
    act(() => {
      jest.advanceTimersByTime(31000);
    });
    
    await waitFor(() => {
      expect(getByTestId('connection-attempts')).toHaveTextContent('0');
    });
  });
});