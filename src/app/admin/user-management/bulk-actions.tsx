'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, CheckSquare, Square, Users } from 'lucide-react'
import { SerializedUser } from './types'

interface BulkActionsProps {
  users: SerializedUser[]
  selectedUsers: string[]
  setSelectedUsers: (ids: string[]) => void
}

export function BulkActions({ users, selectedUsers, setSelectedUsers }: BulkActionsProps) {
  const { toast } = useToast()
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false)
  const [bulkAction, setBulkAction] = useState('')
  
  const userCount = users.length
  const selectedCount = selectedUsers.length
  
  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map(user => user.id))
    }
  }
  
  const applyBulkAction = () => {
    // This would handle the actual bulk action in a real implementation
    toast({
      title: "Bulk action applied",
      description: `Applied ${bulkAction} to ${selectedCount} users`,
    })
    
    // Reset selection after action
    setSelectedUsers([])
    setBulkActionDialogOpen(false)
    setBulkAction('')
  }
  
  return (
    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
      <div className="flex items-center gap-2">
        <Checkbox 
          id="select-all"
          checked={selectedCount > 0 && selectedCount === users.length} 
          indeterminate={selectedCount > 0 && selectedCount < users.length}
          onCheckedChange={toggleSelectAll}
          aria-label={selectedCount ? "Deselect all users" : "Select all users"}
        />
        <label 
          htmlFor="select-all" 
          className="text-sm font-medium cursor-pointer flex items-center gap-1"
        >
          {selectedCount === 0 ? (
            <>
              <Square className="h-4 w-4" /> Select all
            </>
          ) : selectedCount === users.length ? (
            <>
              <CheckSquare className="h-4 w-4" /> All selected
            </>
          ) : (
            <>
              <CheckSquare className="h-4 w-4" /> {selectedCount} selected
            </>
          )}
        </label>
      </div>
      
      <Dialog open={bulkActionDialogOpen} onOpenChange={setBulkActionDialogOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={selectedCount === 0}
              className="ml-auto"
            >
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Bulk Actions <ChevronDown className="h-4 w-4" />
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DialogTrigger asChild>
              <DropdownMenuItem
                onSelect={() => setBulkAction('Make Beta Users')}
                disabled={selectedCount === 0}
              >
                Make Beta Users
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogTrigger asChild>
              <DropdownMenuItem
                onSelect={() => setBulkAction('Make Moderators')}
                disabled={selectedCount === 0}
              >
                Make Moderators
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogTrigger asChild>
              <DropdownMenuItem
                onSelect={() => setBulkAction('Remove Roles')}
                disabled={selectedCount === 0}
                className="text-destructive"
              >
                Remove Roles
              </DropdownMenuItem>
            </DialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Action</DialogTitle>
            <DialogDescription>
              You are about to {bulkAction.toLowerCase()} for {selectedCount} user{selectedCount !== 1 ? 's' : ''}.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyBulkAction}>
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}