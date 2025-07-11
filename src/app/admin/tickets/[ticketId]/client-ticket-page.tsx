'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Clock, MessageSquare, Send } from 'lucide-react'
import { SupportNotes } from './support-notes'
import { updateTicketStatus, createOrGetTicketConversation } from '@/app/actions/tickets'
import { createMessage } from '@/app/actions/conversations';
import { markMessagesAsReadByTimestamp } from '@/app/actions/messages';
import { useWebSocketManager, MessageData as HookMessageData } from '@/hooks/useWebSocketManager';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ClientTicketPageProps {
  ticket: any;
  user: { id: string, imageUrl?: string | null };
  conversation: any;
}

export default function ClientTicketPage({ ticket, user, conversation: initialConversation }: ClientTicketPageProps) {
  const [activeConversation, setActiveConversation] = useState(initialConversation);
  const [messages, setMessages] = useState(initialConversation?.messages || []);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, { isTyping: boolean; timestamp: string }>>({});
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const socketUrl = process.env.NEXT_PUBLIC_GO_SERVER_URL || 'http://localhost:8080';

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const webSocketManagerRef = useRef<any>(null);

  const handleIncomingMessage = useCallback((message: HookMessageData) => {
    if (!user || !activeConversation) return;

    if (message.type !== 'typing') {
      logger.debug('Ticket chat message received', { type: message.type, message });
    }

    // Handle message delivery confirmation
    if (message.id && message.senderId === user?.id && message.confirmedDeliveryAt) {
      setMessages((prev) => prev.map((msg) =>
        msg.id === message.id
          ? { ...msg, pending: false, deliveryStatus: message.deliveryStatus || 'delivered' }
          : msg
      ));
      return;
    }

    // Handle new incoming messages
    if (message.senderId !== user.id && (message.type === 'message' || message.type === 'file')) {
      if (message.conversationId === activeConversation.id) {
        setMessages((prev) => [...prev, { ...message, isRead: true, deliveryStatus: 'read' }]);
        
        // Send read receipt
        if (webSocketManagerRef.current?.isConnected && message.id) {
          webSocketManagerRef.current.sendReadReceipt({
            conversationId: message.conversationId,
            receiverId: message.senderId,
            senderId: user.id,
            timestamp: new Date().toISOString(),
            messageIds: [message.id]
          });
        }
      }
    }
  }, [user, activeConversation]);

  const handleTypingReceived = useCallback((typingData: HookMessageData) => {
    if (!user || typingData.senderId === user.id) return;
    
    const key = `${typingData.conversationId}:${typingData.senderId}`;
    setTypingUsers((prev) => ({
      ...prev,
      [key]: { isTyping: typingData.isTyping || false, timestamp: new Date().toISOString() }
    }));

    if (typingData.isTyping) {
      if (typingTimeoutRef.current[key]) {
        clearTimeout(typingTimeoutRef.current[key]);
      }
      typingTimeoutRef.current[key] = setTimeout(() => {
        setTypingUsers((prev) => ({
          ...prev,
          [key]: { isTyping: false, timestamp: new Date().toISOString() }
        }));
      }, 5000);
    }
  }, [user]);

  const handleReadReceiptReceived = useCallback((receiptData: HookMessageData) => {
    if (!user || receiptData.senderId === user.id || !receiptData.messageIds || !receiptData.timestamp) return;
    
    setMessages((prev) => prev.map((msg) =>
      receiptData.messageIds!.includes(msg.id)
        ? { ...msg, deliveryStatus: 'read', isRead: true }
        : msg
    ));
  }, [user]);

  const webSocketManager = useWebSocketManager({
    socketUrl,
    userId: user?.id || null,
    onMessageReceived: handleIncomingMessage,
    onTypingReceived: handleTypingReceived,
    onReadReceiptReceived: handleReadReceiptReceived,
  });

  useEffect(() => {
    webSocketManagerRef.current = webSocketManager;
  }, [webSocketManager]);

  const sendTypingStatus = useCallback((isTyping: boolean) => {
    if (!user || !activeConversation) return;

    const receiver = activeConversation.participants.find((p: any) => p.userId !== user.id);
    if (receiver) {
      webSocketManager.sendTyping({
        isTyping,
        conversationId: activeConversation.id,
        receiverId: receiver.userId,
        senderId: user.id,
        timestamp: new Date().toISOString(),
      });
    }
  }, [user, activeConversation, webSocketManager]);

  const handleCreateConversation = async () => {
    setIsLoading(true);
    try {
      const result = await createOrGetTicketConversation(ticket.id);
      setActiveConversation(result);
      setMessages(result.messages || []);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeConversation || !user) return;

    const receiver = activeConversation.participants.find((p: any) => p.userId !== user.id);
    if (!receiver) return;

    const messageId = `message_${uuidv4()}`;
    const messageData: HookMessageData = {
      id: messageId,
      content: messageInput,
      conversationId: activeConversation.id,
      receiverId: receiver.userId,
      senderId: user.id,
      senderRole: activeConversation.participants.find((p: any) => p.userId === user.id)?.role as 'Host' | 'Tenant',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      type: 'message',
      deliveryStatus: 'sending',
      pending: true,
    };

    // Optimistic update
    setMessages((prev) => [...prev, messageData]);
    setMessageInput('');
    sendTypingStatus(false);

    try {
      const ack = await webSocketManager.sendMessage(messageData);
      setMessages((prev) => prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, pending: false, deliveryStatus: 'delivered' }
          : msg
      ));
    } catch (error) {
      console.error('WebSocket message delivery failed:', error);
      // Fall back to REST API
      try {
        const savedMessage = await createMessage(messageData as any);
        setMessages((prev) => prev.map((msg) =>
          msg.id === messageId
            ? { ...savedMessage, pending: false, deliveryStatus: 'delivered' }
            : msg
        ));
      } catch (restError) {
        console.error('REST API message delivery also failed:', restError);
        setMessages((prev) => prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, failed: true, pending: false, deliveryStatus: 'failed' }
            : msg
        ));
      }
    }
  };

  const isOtherUserTyping = activeConversation && user &&
    typingUsers[`${activeConversation.id}:${activeConversation.participants.find((p: any) => p.userId !== user.id)?.userId}`]?.isTyping;

  function getStatusColor(status: string) {
    switch (status) {
      case 'open':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'in-progress':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'resolved':
        return 'bg-green-500 hover:bg-green-600';
      case 'closed':
        return 'bg-gray-500 hover:bg-gray-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateTicketStatus(ticket.id, newStatus);
      // Optionally refresh the page or update local state
      window.location.reload();
    } catch (error) {
      console.error('Failed to update ticket status:', error);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <Link href="/admin/tickets">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Tickets
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{ticket.title}</CardTitle>
                  <CardDescription className="mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Submitted {formatDate(ticket.createdAt)}
                    </span>
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(ticket.status)}>
                  {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <div className="mt-2 p-4 bg-gray-50 rounded-md whitespace-pre-wrap">
                    {ticket.description}
                  </div>
                </div>
                
                <div>
                  <SupportNotes ticketId={ticket.id} defaultNotes={ticket.supportNotes || ''} />
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Live Chat with User
                  </h3>
                  
                  {!activeConversation ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">Start a conversation with the ticket creator</p>
                      <Button onClick={handleCreateConversation} disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Start Chat'}
                      </Button>
                    </div>
                  ) : (
                    <div className="border rounded-lg">
                      <ScrollArea className="h-[400px] p-4" ref={scrollAreaRef}>
                        <div className="space-y-4">
                          {messages.map((message: any) => (
                            <div
                              key={message.id}
                              className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                  message.senderId === user?.id
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs opacity-70">
                                    {formatDate(message.createdAt)}
                                  </span>
                                  {message.senderId === user?.id && (
                                    <span className="text-xs opacity-70">
                                      {message.deliveryStatus === 'read' ? '✓✓' : 
                                       message.deliveryStatus === 'delivered' ? '✓' : 
                                       message.pending ? '...' : ''}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          {isOtherUserTyping && (
                            <div className="flex justify-start">
                              <div className="bg-muted rounded-lg px-4 py-2">
                                <div className="flex space-x-1">
                                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                      
                      <div className="border-t p-4">
                        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
                          <Input
                            value={messageInput}
                            onChange={(e) => {
                              setMessageInput(e.target.value);
                              sendTypingStatus(true);
                            }}
                            onBlur={() => sendTypingStatus(false)}
                            placeholder="Type a message..."
                            className="flex-1"
                          />
                          <Button type="submit" size="icon" disabled={!messageInput.trim()}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
                
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ticket Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Ticket ID</h3>
                  <p className="font-mono text-sm mt-1">{ticket.id}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Submitted By</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {ticket.user ? (
                      <>
                        {ticket.user.imageUrl && (
                          <img 
                            src={ticket.user.imageUrl} 
                            alt={`${ticket.user.firstName} ${ticket.user.lastName}`}
                            className="w-6 h-6 rounded-full"
                          />
                        )}
                        <span>{ticket.user.firstName} {ticket.user.lastName}</span>
                      </>
                    ) : (
                      <span>{ticket.name || ticket.email}</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p className="mt-1">{ticket.email}</p>
                </div>
                
                {ticket.category && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Category</h3>
                    <Badge variant="outline" className="mt-1">
                      {ticket.category}
                    </Badge>
                  </div>
                )}
                
                {ticket.priority && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Priority</h3>
                    <Badge variant="outline" className="mt-1">
                      {ticket.priority}
                    </Badge>
                  </div>
                )}
                
                {ticket.pageUrl && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Page URL</h3>
                    <a 
                      href={ticket.pageUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline block mt-1 truncate"
                    >
                      {ticket.pageUrl}
                    </a>
                  </div>
                )}
                
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Update Status</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => handleStatusChange('in-progress')}
                      className="w-full"
                      disabled={ticket.status === 'in-progress'}
                      variant={ticket.status === 'in-progress' ? 'outline' : 'default'}
                    >
                      In Progress
                    </Button>
                    <Button 
                      onClick={() => handleStatusChange('resolved')}
                      className="w-full"
                      disabled={ticket.status === 'resolved'}
                      variant={ticket.status === 'resolved' ? 'outline' : 'default'}
                    >
                      Resolved
                    </Button>
                    <Button 
                      onClick={() => handleStatusChange('open')}
                      className="w-full"
                      disabled={ticket.status === 'open'}
                      variant={ticket.status === 'open' ? 'outline' : 'default'}
                    >
                      Reopen
                    </Button>
                    <Button 
                      onClick={() => handleStatusChange('closed')}
                      className="w-full"
                      disabled={ticket.status === 'closed'}
                      variant={ticket.status === 'closed' ? 'outline' : 'default'}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}