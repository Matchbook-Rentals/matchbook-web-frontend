'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, User, Shield, Settings } from 'lucide-react';
import { getTicketActivities } from '@/app/actions/ticket-activity';

interface ActivityLogProps {
  ticketId: string;
  refreshTrigger?: number; // Add this prop to trigger refresh
}

interface TicketActivity {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  actorType: string;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
}

const ActivityLog: React.FC<ActivityLogProps> = ({ ticketId, refreshTrigger }) => {
  const [activities, setActivities] = useState<TicketActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const result = await getTicketActivities(ticketId);
        
        if (result.success && result.activities) {
          setActivities(result.activities);
        } else {
          setError(result.error || 'Failed to fetch activities');
        }
      } catch (err) {
        setError('An error occurred while fetching activities');
        console.error('Error fetching activities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [ticketId, refreshTrigger]);

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'ticket_created':
        return '🎫';
      case 'status_changed':
        return '🔄';
      case 'note_saved':
        return '📝';
      case 'chat_initiated':
        return '💬';
      case 'assignment_changed':
        return '👤';
      case 'response_added':
        return '💭';
      default:
        return '📋';
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'ticket_created':
        return 'bg-blue-100 text-blue-800';
      case 'status_changed':
        return 'bg-yellow-100 text-yellow-800';
      case 'note_saved':
        return 'bg-green-100 text-green-800';
      case 'chat_initiated':
        return 'bg-purple-100 text-purple-800';
      case 'assignment_changed':
        return 'bg-orange-100 text-orange-800';
      case 'response_added':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActorIcon = (actorType: string) => {
    switch (actorType) {
      case 'admin':
        return <Shield className="h-3 w-3" />;
      case 'user':
        return <User className="h-3 w-3" />;
      case 'system':
        return <Settings className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getActorColor = (actorType: string) => {
    switch (actorType) {
      case 'admin':
        return 'text-red-600';
      case 'user':
        return 'text-blue-600';
      case 'system':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getActivityMessage = (activity: TicketActivity) => {
    let details = null;
    try {
      details = activity.details ? JSON.parse(activity.details) : null;
    } catch (e) {
      console.warn('Failed to parse activity details:', e);
    }
    
    return details?.message || `${activity.action.replace('_', ' ')} action performed`;
  };

  const getActivityDetails = (activity: TicketActivity) => {
    let details = null;
    try {
      details = activity.details ? JSON.parse(activity.details) : null;
    } catch (e) {
      console.warn('Failed to parse activity details:', e);
      return null;
    }
    
    if (!details) return null;
    
    switch (activity.action) {
      case 'status_changed':
        return details.oldStatus && details.newStatus 
          ? `Changed from "${details.oldStatus}" to "${details.newStatus}"`
          : null;
      case 'note_saved':
        return details.notePreview ? `Note: "${details.notePreview}"` : null;
      case 'response_added':
        return details.responsePreview ? `Response: "${details.responsePreview}"` : null;
      case 'assignment_changed':
        return details.oldAssignee && details.newAssignee 
          ? `Changed from ${details.oldAssignee} to ${details.newAssignee}`
          : null;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 text-center py-4">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No activities recorded yet
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {activities.map((activity) => {
                const details = getActivityDetails(activity);
                
                return (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50">
                    <div className="flex-shrink-0 mt-1">
                      <span className="text-lg">{getActivityIcon(activity.action)}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getActivityColor(activity.action)} variant="secondary">
                            {activity.action.replace('_', ' ')}
                          </Badge>
                          
                          <div className={`flex items-center gap-1 text-sm ${getActorColor(activity.actorType)}`}>
                            {getActorIcon(activity.actorType)}
                            <span>
                              {activity.actorName || activity.actorEmail || activity.actorType}
                            </span>
                          </div>
                        </div>
                        
                        <span className="text-xs text-gray-500">
                          {formatDate(activity.createdAt)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-700 mt-1">
                        {getActivityMessage(activity)}
                      </p>
                      
                      {details && (
                        <p className="text-xs text-gray-600 mt-1 italic">
                          {details}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityLog;