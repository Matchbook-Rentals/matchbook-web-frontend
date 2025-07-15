'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Clock, MessageSquare, Send } from 'lucide-react'
import { SupportNotes } from './support-notes'
import ActivityLog from './activity-log'
import { updateTicketStatus } from '@/app/actions/tickets'
import { sendCustomerSupportMessage, getTicketConversation } from '@/app/actions/customer-support'
import { useWebSocketManager, MessageData as HookMessageData } from '@/hooks/useWebSocketManager';
import { logger } from '@/lib/logger';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AvatarWithFallback } from '@/components/ui/avatar-with-fallback';
import { useToast } from '@/components/ui/use-toast';

interface ClientTicketPageProps {
  ticket: any;
  user: { id: string, imageUrl?: string | null };
  conversation: any;
}

export default function ClientTicketPage({ ticket, user, conversation: initialConversation }: ClientTicketPageProps) {
  const { toast } = useToast();
  const [activeConversation, setActiveConversation] = useState(initialConversation);
  const [activityRefreshTrigger, setActivityRefreshTrigger] = useState(0);
  const [messages, setMessages] = useState(() => {
    const initialMessages = initialConversation?.messages || [];
    console.log('Initial messages loaded:', initialMessages.map(m => ({
      id: m.id,
      senderId: m.senderId,
      content: m.content?.substring(0, 50),
      createdAt: m.createdAt
    })));
    return initialMessages;
  });
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

  // Removed auto-creation to prevent infinite loops
  // Users must manually click "Start Chat" to create Customer Support conversations

  const webSocketManagerRef = useRef<any>(null);

  const handleIncomingMessage = useCallback((message: HookMessageData) => {
    console.log('🔄 handleIncomingMessage called', { 
      hasUser: !!user, 
      hasActiveConversation: !!activeConversation,
      messageType: message.type,
      messageSender: message.senderId,
      messageContent: message.content?.substring(0, 50),
      userIdCheck: user?.id,
      conversationIdMatch: message.conversationId === activeConversation?.id
    });

    if (!user || !activeConversation) {
      console.log('❌ Early return: missing user or activeConversation');
      return;
    }

    if (message.type !== 'typing') {
      logger.debug('Ticket chat message received', { type: message.type, message });
    }

    // Handle message delivery confirmation
    // Check for delivery confirmation from Customer Support messages sent by this admin
    if (message.id && (message.senderId === user?.id || message.senderId === 'support-user-001') && message.confirmedDeliveryAt) {
      console.log('Message delivery confirmation:', { 
        messageId: message.id, 
        senderId: message.senderId, 
        adminUserId: user?.id,
        deliveryStatus: message.deliveryStatus 
      });
      setMessages((prev) => prev.map((msg) =>
        msg.id === message.id
          ? { ...msg, pending: false, deliveryStatus: message.deliveryStatus || 'delivered' }
          : msg
      ));
      return;
    }

    // Handle new incoming messages
    // Accept messages from anyone except the current admin user (includes ticket user and Customer Support)
    console.log('🔍 Message filtering check:', {
      senderNotAdmin: message.senderId !== user.id,
      messageType: message.type,
      isMessageOrFile: message.type === 'message' || message.type === 'file',
      conversationMatch: message.conversationId === activeConversation.id,
      willProcess: message.senderId !== user.id && (message.type === 'message' || message.type === 'file') && message.conversationId === activeConversation.id
    });
    
    if (message.senderId !== user.id && (message.type === 'message' || message.type === 'file')) {
      if (message.conversationId === activeConversation.id) {
        console.log('✅ Admin receiving message:', { 
          messageId: message.id, 
          senderId: message.senderId, 
          content: message.content?.substring(0, 50),
          adminUserId: user.id 
        });
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
    // Connect as Customer Support user for ticket conversations
    userId: 'support-user-001',
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
    console.log('Creating Customer Support conversation for ticket:', ticket.id);
    setIsLoading(true);
    try {
      // First check if conversation exists
      const result = await getTicketConversation(ticket.id);
      console.log('Customer Support conversation result:', result);
      
      if (result.success && result.conversation) {
        // Conversation exists, load it
        setActiveConversation(result.conversation);
        setMessages(result.conversation.messages || []);
        toast({
          title: "Success",
          description: "Customer Support chat loaded successfully!",
        });
      } else {
        // No conversation exists, create one by sending an initial message
        console.log('No conversation exists, creating one with initial message');
        const createResult = await sendCustomerSupportMessage(ticket.id, "Chat started by admin.");
        
        if (createResult.success && createResult.conversation) {
          setActiveConversation(createResult.conversation);
          setMessages(createResult.conversation.messages || []);
          // Refresh activity log
          setActivityRefreshTrigger(prev => prev + 1);
          toast({
            title: "Success",
            description: "Customer Support chat created successfully!",
          });
        } else {
          throw new Error(createResult.error || 'Failed to create conversation');
        }
      }
    } catch (error) {
      console.error('Failed to create Customer Support conversation:', error);
      toast({
        title: "Error",
        description: `Failed to create conversation: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    console.log('Customer Support message send called', { 
      messageInput: messageInput.trim(), 
      ticketId: ticket.id 
    });
    
    if (!messageInput.trim() || !activeConversation) {
      console.log('Early return due to empty message or no conversation');
      return;
    }

    const messageContent = messageInput.trim();
    setMessageInput('');
    
    try {
      // Send via WebSocket if connected (server will forward to REST API)
      if (webSocketManager.isConnected) {
        console.log('Sending Customer Support message via WebSocket');
        const receiver = activeConversation.participants.find((p: any) => p.userId !== 'support-user-001');
        if (receiver) {
          // Generate a proper UUID v4 format for the message (server expects "message_" prefix)
          const messageId = 'message_' + crypto.randomUUID();
          
          // Optimistically add the message to the UI
          const optimisticMessage = {
            id: messageId,
            content: messageContent,
            senderId: 'support-user-001',
            conversationId: activeConversation.id,
            createdAt: new Date().toISOString(),
            pending: true,
            deliveryStatus: 'sending'
          };
          
          setMessages((prev) => [...prev, optimisticMessage]);
          
          webSocketManager.sendMessage({
            id: messageId,
            content: messageContent,
            conversationId: activeConversation.id,
            senderId: 'support-user-001', // Customer Support user ID
            receiverId: receiver.userId,
            timestamp: new Date().toISOString(),
            type: 'message'
          });
          
          toast({
            title: "Message Sent",
            description: "Message sent as Customer Support via WebSocket",
          });
        } else {
          throw new Error('No receiver found in conversation');
        }
      } else {
        // Fallback to direct REST API call if WebSocket is disconnected
        console.log('WebSocket disconnected, falling back to REST API');
        const result = await sendCustomerSupportMessage(ticket.id, messageContent);
        
        if (result.success) {
          console.log('Customer Support message sent via REST API fallback', result);
          
          if (result.message && result.conversation) {
            setActiveConversation(result.conversation);
            setMessages(result.conversation.messages || []);
          }
          
          toast({
            title: "Message Sent",
            description: "Message sent as Customer Support via REST API",
          });
        } else {
          throw new Error(result.error || 'Failed to send message');
        }
      }
    } catch (error) {
      console.error('Customer Support message failed:', error);
      toast({
        title: "Message Failed",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      // Restore the message input on failure
      setMessageInput(messageContent);
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
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString)
      return 'Invalid date'
    }
    
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
      toast({
        title: "Success",
        description: `Ticket status updated to ${newStatus}`,
      });
      // Refresh activity log
      setActivityRefreshTrigger(prev => prev + 1);
      // Optionally refresh the page or update local state
      window.location.reload();
    } catch (error) {
      console.error('Failed to update ticket status:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket status. Please try again.",
        variant: "destructive",
      });
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
                  <ActivityLog ticketId={ticket.id} refreshTrigger={activityRefreshTrigger} />
                </div>
                
                <div>
                  <SupportNotes 
                    ticketId={ticket.id} 
                    defaultNotes={ticket.supportNotes || ''} 
                    onNotesSaved={() => setActivityRefreshTrigger(prev => prev + 1)} 
                  />
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
                          {messages.map((message: any) => {
                            // Messages from Customer Support should appear as "outgoing" from admin perspective
                            const isFromSupport = message.senderId === 'support-user-001';
                            const isOutgoing = message.senderId === user?.id || isFromSupport;
                            
                            return (
                              <div
                                key={message.id}
                                className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                    isOutgoing
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted'
                                  }`}
                                >
                                  <p className="text-sm">{message.content}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs opacity-70">
                                      {formatDate(message.createdAt)}
                                    </span>
                                    {/* Show delivery status for Customer Support messages too */}
                                    {(message.senderId === user?.id || isFromSupport) && (
                                      <span className="text-xs opacity-70">
                                        {message.deliveryStatus === 'read' ? '✓✓' : 
                                         message.deliveryStatus === 'delivered' ? '✓' : 
                                         message.pending ? '...' : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
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
                        
                        {/* WebSocket Connection Indicator */}
                        <div className="flex items-center justify-between mt-2 px-2 py-1 text-xs text-gray-500">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${webSocketManager.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span>WebSocket: {webSocketManager.isConnected ? 'Connected' : 'Disconnected'}</span>
                          </div>
                          <span>Messages via: {webSocketManager.isConnected ? 'WebSocket' : 'REST API'}</span>
                        </div>
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
                        <AvatarWithFallback
                          src={ticket.user.imageUrl}
                          firstName={ticket.user.firstName}
                          lastName={ticket.user.lastName}
                          email={ticket.user.email}
                          alt={`${ticket.user.firstName} ${ticket.user.lastName}`}
                          className="w-6 h-6 rounded-full"
                          size={100}
                        />
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
