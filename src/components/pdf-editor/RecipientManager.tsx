'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Plus, User, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
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
  onRecipientsChange: (recipients: Recipient[]) => void;
  selectedRecipient?: string | null;
  onSelectRecipient?: (id: string | null) => void;
  accordionState?: boolean;
  onToggleAccordion?: () => void;
}

export const RecipientManager: React.FC<RecipientManagerProps> = ({
  recipients,
  onRecipientsChange,
  selectedRecipient,
  onSelectRecipient,
  accordionState = true,
  onToggleAccordion,
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
      
      onRecipientsChange([...recipients, recipient]);
      setNewRecipient({ name: '', email: '' });
      setIsAdding(false);
      
      // Auto-select the newly added recipient
      onSelectRecipient?.(recipient.id);
    }
  };

  const handleCancel = () => {
    setNewRecipient({ name: '', email: '' });
    setIsAdding(false);
  };

  const handleRemoveRecipient = (id: string) => {
    onRecipientsChange(recipients.filter(r => r.id !== id));
    if (selectedRecipient === id) {
      onSelectRecipient?.(null);
    }
  };

  const getSelectedRecipient = () => {
    return recipients.find(r => r.id === selectedRecipient);
  };

  const selectedRecipientData = getSelectedRecipient();

  const renderContent = () => {
    if (isAdding) {
      return (
        <div className="mb-4">
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
      </div>
      );
    }

    return (
      <div className="mb-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between h-auto py-3"
          >
            <div className="flex items-center gap-3">
              {selectedRecipientData ? (
                <>
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getRecipientColor(recipients.findIndex(r => r.id === selectedRecipientData.id)) }}
                  />
                  <div className="text-left">
                    <div className="font-medium text-sm">{selectedRecipientData.name}</div>
                    <div className="text-xs text-gray-500">{selectedRecipientData.email}</div>
                  </div>
                </>
              ) : (
                <>
                  <User className="w-4 h-4" />
                  <span>Select Recipient</span>
                </>
              )}
            </div>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-full min-w-[var(--radix-dropdown-menu-trigger-width)]">
          {recipients.map((recipient, index) => (
            <DropdownMenuItem
              key={recipient.id}
              onClick={() => onSelectRecipient?.(recipient.id)}
              className="flex items-center gap-3 p-3"
            >
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: getRecipientColor(index) }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{recipient.name}</div>
                <div className="text-xs text-gray-500 truncate">{recipient.email}</div>
                {recipient.title && (
                  <div className="text-xs font-medium text-blue-600 truncate">{recipient.title}</div>
                )}
                {recipient.isLocked && (
                  <div className="text-xs text-red-600">Required</div>
                )}
              </div>
              {!recipient.isLocked && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveRecipient(recipient.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </DropdownMenuItem>
          ))}
          
          {recipients.length === 0 && (
            <DropdownMenuItem disabled className="text-center py-4 text-gray-500">
              <div className="w-full">
                <User className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recipients added yet</p>
              </div>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 p-3"
          >
            <Plus className="w-4 h-4" />
            Add Recipient
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    );
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-3">
        <div 
          className="flex items-center justify-between cursor-pointer mb-3"
          onClick={onToggleAccordion}
        >
          <h3 className="font-medium">Recipients</h3>
          <ChevronDown 
            className={`w-4 h-4 transition-transform duration-200 ${
              accordionState ? 'rotate-180' : ''
            }`}
          />
        </div>
        {accordionState && renderContent()}
      </CardContent>
    </Card>
  );
};