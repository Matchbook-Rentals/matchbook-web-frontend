import { NextRequest, NextResponse } from 'next/server';

interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: string;
  data?: any;
  timestamp?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LogEntry = await request.json();
    
    const {
      level = 'info',
      message,
      context = 'client',
      data = {},
      timestamp = new Date().toISOString()
    } = body;

    // Format the log message for server console
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`;
    
    // Log to server console based on level
    switch (level) {
      case 'debug':
        console.log(formattedMessage, data);
        break;
      case 'info':
        console.info(formattedMessage, data);
        break;
      case 'warn':
        console.warn(formattedMessage, data);
        break;
      case 'error':
        console.error(formattedMessage, data);
        break;
      default:
        console.log(formattedMessage, data);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in log API route:', error);
    return NextResponse.json(
      { error: 'Failed to process log entry' },
      { status: 500 }
    );
  }
}