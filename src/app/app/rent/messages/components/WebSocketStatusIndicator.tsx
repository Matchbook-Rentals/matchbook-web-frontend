'use client';
import React, { useState } from 'react';
import { useWebSocketManager, ErrorLogEntry } from '@/hooks/useWebSocketManager';

interface WebSocketStatusIndicatorProps {
  userId: string;
}

const WebSocketStatusIndicator: React.FC<WebSocketStatusIndicatorProps> = ({ userId }) => {
  const [statusIndicatorVisible, setStatusIndicatorVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const socketUrl = process.env.NEXT_PUBLIC_GO_SERVER_URL || 'http://localhost:8080';

  const webSocketManager = useWebSocketManager({
    socketUrl,
    userId: userId || null,
    onMessageReceived: () => {}, // No-op since we're only monitoring status
    onTypingReceived: () => {}, // No-op
    onReadReceiptReceived: () => {}, // No-op
    onConnectionStatusChange: () => {}, // No-op, we use the returned status directly
  });

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getTypeIcon = (type: ErrorLogEntry['type']) => {
    switch (type) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'event': return '📡';
      default: return '•';
    }
  };

  if (!statusIndicatorVisible) {
    return null;
  }

  return (
    <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
      <div className="space-y-2">
        {/* Main status bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                webSocketManager.isConnected ? 'bg-green-500'
                  : webSocketManager.circuitOpen ? 'bg-orange-500'
                    : 'bg-red-500'
              } text-white relative`}
            >
              <button
                onClick={() => setStatusIndicatorVisible(false)}
                className="absolute -top-1 -right-1 w-4 h-4 bg-gray-600 hover:bg-gray-700 rounded-full text-xs flex items-center justify-center"
                title="Hide until page refresh"
              >
                ×
              </button>
              {webSocketManager.isConnected ? (
                'Connected'
              ) : webSocketManager.circuitOpen ? (
                'Connection issues (retrying...)'
              ) : (
                <button
                  onClick={webSocketManager.retryConnection}
                  className="flex items-center"
                >
                  <span>Disconnected</span>
                  <span className="ml-2 text-xs">(Click to retry)</span>
                </button>
              )}
            </div>
            <span className="text-xs text-gray-600 font-mono">
              {socketUrl}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
              title="Toggle error log"
            >
              {isExpanded ? '▼' : '▶'} Logs ({webSocketManager.errorLogs.length})
            </button>
          </div>
        </div>

        {/* Expanded log section */}
        {isExpanded && (
          <div className="bg-white border rounded p-2">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-700">WebSocket Event Log</h4>
              <button
                onClick={webSocketManager.clearErrorLogs}
                className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded"
              >
                Clear Log
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto border rounded bg-gray-50 p-2">
              {webSocketManager.errorLogs.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No log entries yet...</p>
              ) : (
                <div className="space-y-1">
                  {webSocketManager.errorLogs.map((log, index) => (
                    <div key={index} className="text-xs font-mono">
                      <span className="text-gray-500">{formatTimestamp(log.timestamp)}</span>
                      <span className="ml-2">{getTypeIcon(log.type)}</span>
                      <span className="ml-1">{log.message}</span>
                      {log.details && (
                        <div className="ml-6 text-gray-400">
                          {typeof log.details === 'string'
                            ? log.details
                            : JSON.stringify(log.details, null, 2)
                          }
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebSocketStatusIndicator;