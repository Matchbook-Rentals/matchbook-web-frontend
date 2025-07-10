'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { searchUsers, createUserNotification, createBulkNotification, UserSearchResult } from './_actions'
import { Search, X, Send, Users, User } from 'lucide-react'

export default function NotificationCreator() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form fields
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState<'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'>('INFO')
  const [actionUrl, setActionUrl] = useState('')
  const [actionLabel, setActionLabel] = useState('')

  const { toast } = useToast()

  const handleSearch = async () => {
    if (!searchTerm.trim()) return
    
    setIsSearching(true)
    try {
      const result = await searchUsers(searchTerm)
      if (result.success && result.users) {
        setSearchResults(result.users)
        if (result.users.length === 0) {
          toast({
            title: '🔍 No Results',
            description: `No users found matching "${searchTerm}"`,
            variant: 'default'
          })
        }
      } else {
        toast({
          title: '❌ Search Failed',
          description: result.error || 'Failed to search users',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('User search error:', error)
      toast({
        title: '❌ Search Error',
        description: 'An error occurred while searching. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddUser = (user: UserSearchResult) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user])
      toast({
        title: '✅ User Added',
        description: `${user.firstName} ${user.lastName} (${user.email}) added to recipients`
      })
    } else {
      toast({
        title: '⚠️ User Already Selected',
        description: `${user.firstName} ${user.lastName} is already in the recipient list`,
        variant: 'default'
      })
    }
    setSearchResults([])
    setSearchTerm('')
  }

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !message.trim() || selectedUsers.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields and select at least one user',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)
    try {
      if (selectedUsers.length === 1) {
        // Single notification
        const result = await createUserNotification({
          userId: selectedUsers[0].id,
          title,
          message,
          type,
          actionUrl: actionUrl || undefined,
          actionLabel: actionLabel || undefined
        })

        if (result.success) {
          toast({
            title: '✅ Notification Sent',
            description: `Successfully sent notification to ${selectedUsers[0].firstName} ${selectedUsers[0].lastName} (${selectedUsers[0].email})`
          })
          resetForm()
        } else {
          toast({
            title: '❌ Failed to Send',
            description: result.error || 'Failed to send notification',
            variant: 'destructive'
          })
        }
      } else {
        // Bulk notifications
        const result = await createBulkNotification({
          userIds: selectedUsers.map(u => u.id),
          title,
          message,
          type,
          actionUrl: actionUrl || undefined,
          actionLabel: actionLabel || undefined
        })

        if (result.success) {
          const successCount = result.created || 0
          const failCount = result.failed || 0
          const totalCount = selectedUsers.length
          
          if (failCount === 0) {
            toast({
              title: '✅ All Notifications Sent',
              description: `Successfully sent ${successCount} notifications to ${totalCount} users`
            })
          } else {
            toast({
              title: '⚠️ Partial Success',
              description: `Sent ${successCount} notifications successfully, ${failCount} failed out of ${totalCount} total`,
              variant: failCount > successCount ? 'destructive' : 'default'
            })
          }
          resetForm()
        } else {
          toast({
            title: '❌ Bulk Send Failed',
            description: result.error || 'Failed to send bulk notifications',
            variant: 'destructive'
          })
        }
      }
    } catch (error) {
      console.error('Notification creation error:', error)
      toast({
        title: '❌ Unexpected Error',
        description: 'An unexpected error occurred while sending notifications. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setMessage('')
    setType('INFO')
    setActionUrl('')
    setActionLabel('')
    setSelectedUsers([])
    setSearchResults([])
    setSearchTerm('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* User Search */}
      <div className="space-y-4">
        <Label htmlFor="user-search">Search Users</Label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="user-search"
              placeholder="Search by email, name, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
            />
          </div>
          <Button 
            type="button" 
            onClick={handleSearch} 
            disabled={isSearching || !searchTerm.trim()}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <h4 className="font-medium">Search Results</h4>
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 rounded-lg border hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleAddUser(user)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.imageUrl} />
                        <AvatarFallback>
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    {user.role && (
                      <Badge variant="secondary" className="text-xs">
                        {user.role}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <div className="space-y-2">
            <Label>Selected Users ({selectedUsers.length})</Label>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <Badge
                  key={user.id}
                  variant="outline"
                  className="flex items-center gap-1 px-2 py-1"
                >
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={user.imageUrl} />
                    <AvatarFallback className="text-xs">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs">
                    {user.firstName} {user.lastName} ({user.email})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveUser(user.id)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Notification Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(value: any) => setType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INFO">Info</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="WARNING">Warning</SelectItem>
                <SelectItem value="ERROR">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="action-url">Action URL (optional)</Label>
            <Input
              id="action-url"
              value={actionUrl}
              onChange={(e) => setActionUrl(e.target.value)}
              placeholder="/app/rent/dashboard"
            />
          </div>

          <div>
            <Label htmlFor="action-label">Action Label (optional)</Label>
            <Input
              id="action-label"
              value={actionLabel}
              onChange={(e) => setActionLabel(e.target.value)}
              placeholder="View Details"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="message">Message *</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter notification message..."
            className="min-h-[200px]"
            required
          />
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {selectedUsers.length === 1 ? (
            <>
              <User className="h-4 w-4" />
              <span>Sending to 1 user</span>
            </>
          ) : selectedUsers.length > 1 ? (
            <>
              <Users className="h-4 w-4" />
              <span>Sending to {selectedUsers.length} users</span>
            </>
          ) : null}
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            disabled={isSubmitting}
          >
            Reset
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || selectedUsers.length === 0}
          >
            {isSubmitting ? (
              'Sending...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Notification{selectedUsers.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
