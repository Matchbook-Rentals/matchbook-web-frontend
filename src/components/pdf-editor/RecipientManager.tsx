'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, User, Trash2 } from 'lucide-react';
import { AVAILABLE_RECIPIENT_COLORS } from './recipient-colors';

// Helper function to get the actual color hex value for a recipient index
const getRecipientColor = (index: number) => {
  const colorMap = {
    0: '#0B6E6E', // host
    1: '#fb8c00', // primaryRenter
    2: '#3B82F6', // blue
    3: '#8B5CF6', // purple
    4: '#22C55E', // green
    5: '#EF4444', // red
    6: '#EC4899', // pink
    7: '#6366F1', // indigo
    8: '#EAB308', // yellow
    9: '#10B981', // emerald
  };
  return colorMap[index as keyof typeof colorMap] || '#6B7280'; // fallback to gray
};

export interface Recipient {
  id: string;
  name: string;
  email: string;
  color: string;
  title?: string;
  role?: 'HOST' | 'RENTER' | 'OTHER'; // Add role for better template matching
  isLocked?: boolean;
}


interface RecipientManagerProps {
  recipients: Recipient[];
  selectedRecipient: string | null;
  onSelectRecipient: (id: string | null) => void;
  onAddRecipient: (recipient: Recipient) => void;
  onRemoveRecipient: (id: string) => void;
}

export const RecipientManager: React.FC<RecipientManagerProps> = ({
  recipients,
  selectedRecipient,
  onSelectRecipient,
  onAddRecipient,
  onRemoveRecipient,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newRecipient, setNewRecipient] = useState({ name: '', email: '' });

  const handleAddRecipient = () => {
    if (newRecipient.name && newRecipient.email) {
      const recipient: Recipient = {
        id: `recipient-${Date.now()}`,
        name: newRecipient.name,
        email: newRecipient.email,
        color: getRecipientColor(recipients.length),
      };
      
      onAddRecipient(recipient);
      setNewRecipient({ name: '', email: '' });
      setIsAdding(false);
      
      // Auto-select the newly added recipient
      onSelectRecipient(recipient.id);
    }
  };

  const handleCancel = () => {
    setNewRecipient({ name: '', email: '' });
    setIsAdding(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="w-5 h-5" />
          Recipients
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recipients.map((recipient, index) => (
            <div
              key={recipient.id}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                selectedRecipient === recipient.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => 
                onSelectRecipient(selectedRecipient === recipient.id ? null : recipient.id)
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getRecipientColor(index) }}
                  />
                  <div>
                    <div className="font-medium text-sm">{recipient.name}</div>
                    <div className="text-xs text-gray-500">{recipient.email}</div>
                    {recipient.title && (
                      <div className="text-xs font-medium text-blue-600">{recipient.title}</div>
                    )}
                    {recipient.isLocked && (
                      <div className="text-xs text-red-600">Required</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!recipient.isLocked && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveRecipient(recipient.id);
                        if (selectedRecipient === recipient.id) {
                          onSelectRecipient(null);
                      }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {recipients.length === 0 && !isAdding && (
            <div className="text-center py-4 text-gray-500">
              <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recipients added yet</p>
            </div>
          )}

          {isAdding ? (
            <div className="space-y-3 p-3 border-2 border-dashed border-gray-300 rounded-lg">
              <div>
                <Label htmlFor="recipient-name" className="text-sm">Name</Label>
                <Input
                  id="recipient-name"
                  value={newRecipient.name}
                  onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                  placeholder="Enter recipient name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="recipient-email" className="text-sm">Email</Label>
                <Input
                  id="recipient-email"
                  type="email"
                  value={newRecipient.email}
                  onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
                  placeholder="Enter recipient email"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleAddRecipient}
                  disabled={!newRecipient.name || !newRecipient.email}
                  className="flex-1"
                >
                  Add
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Recipient
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};