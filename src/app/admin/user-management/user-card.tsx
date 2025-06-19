'use client'

import { useState } from 'react'
import { 
  Card, 
  CardContent 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { setRole, removeRole } from './_actions'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { formatDistanceToNow } from 'date-fns'
import { ChevronDown, MoreHorizontal, Shield, ShieldAlert, UserCheck, UserX, Clock } from 'lucide-react'
import { SerializedUser } from './types'

interface UserCardProps {
  user: SerializedUser
}

export function UserCard({ user }: UserCardProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [removeRoleDialog, setRemoveRoleDialog] = useState(false)

  const userRole = user.role || 'No role'
  const primaryEmail = user.emailAddress
  
  const lastSignInDate = user.lastSignInAt ? new Date(user.lastSignInAt) : null
  const createdDate = user.createdAt ? new Date(user.createdAt) : null

  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'admin':
        return <ShieldAlert className="h-4 w-4 text-red-500" />
      case 'moderator':
        return <Shield className="h-4 w-4 text-blue-500" />
      case 'beta_user':
        return <UserCheck className="h-4 w-4 text-green-500" />
      case 'host_beta':
        return <UserCheck className="h-4 w-4 text-purple-500" />
      case 'preview':
        return <UserCheck className="h-4 w-4 text-orange-500" />
      default:
        return <UserX className="h-4 w-4 text-gray-500" />
    }
  }

  const handleRoleChange = async (formData: FormData) => {
    const role = formData.get('role') as string
    setLoading(role)
    
    try {
      await setRole(formData)
      toast({
        title: "Role updated",
        description: `User is now a ${role}`,
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
      setOpenDialog(false)
    }
  }

  const handleRemoveRole = async (formData: FormData) => {
    setLoading('remove')
    
    try {
      await removeRole(formData)
      toast({
        title: "Role removed",
        description: "User role has been removed",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove user role",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
      setRemoveRoleDialog(false)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="grid md:grid-cols-[2fr_1fr] gap-4 p-6">
        <div className="flex gap-4">
          <div className="relative">
            <img
              src={user.imageUrl}
              alt={`${user.firstName || 'User'}'s profile`}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
            />
            <div className="absolute -bottom-1 -right-1 rounded-full p-1 bg-white">
              {getRoleIcon(userRole)}
            </div>
          </div>
          
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-1">
              <div className="font-medium text-lg">
                {user.firstName} {user.lastName}
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-sm px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 flex items-center gap-1">
                      {getRoleIcon(userRole)}
                      <span>{userRole}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>User role: {userRole}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="text-sm text-muted-foreground">
              {primaryEmail}
            </div>
            
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Joined: {createdDate ? formatDistanceToNow(createdDate, { addSuffix: true }) : 'Unknown'}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Account created: {createdDate?.toLocaleDateString()}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {lastSignInDate && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>Last active: {formatDistanceToNow(lastSignInDate, { addSuffix: true })}</div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Last signed in: {lastSignInDate.toLocaleDateString()} {lastSignInDate.toLocaleTimeString()}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between"
                aria-label="Change user role"
              >
                Change Role
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change User Role</DialogTitle>
                <DialogDescription>
                  Select a new role for {user.firstName} {user.lastName}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-3 py-4">
                <form action={handleRoleChange} className="space-y-3">
                  <Input type="hidden" value={user.id} name="id" />
                  <Input type="hidden" value="admin" name="role" />
                  <Button 
                    type="submit" 
                    variant="default" 
                    className="w-full"
                    disabled={loading !== null}
                  >
                    {loading === 'admin' ? "Setting..." : "Make Admin"}
                  </Button>
                </form>

                <form action={handleRoleChange}>
                  <Input type="hidden" value={user.id} name="id" />
                  <Input type="hidden" value="moderator" name="role" />
                  <Button 
                    type="submit" 
                    variant="secondary" 
                    className="w-full"
                    disabled={loading !== null}
                  >
                    {loading === 'moderator' ? "Setting..." : "Make Moderator"}
                  </Button>
                </form>

                <form action={handleRoleChange}>
                  <Input type="hidden" value={user.id} name="id" />
                  <Input type="hidden" value="beta_user" name="role" />
                  <Button 
                    type="submit" 
                    variant="secondary" 
                    className="w-full"
                    disabled={loading !== null}
                  >
                    {loading === 'beta_user' ? "Setting..." : "Make Beta User"}
                  </Button>
                </form>

                <form action={handleRoleChange}>
                  <Input type="hidden" value={user.id} name="id" />
                  <Input type="hidden" value="host_beta" name="role" />
                  <Button 
                    type="submit" 
                    variant="secondary" 
                    className="w-full"
                    disabled={loading !== null}
                  >
                    {loading === 'host_beta' ? "Setting..." : "Make Host Beta"}
                  </Button>
                </form>

                <form action={handleRoleChange}>
                  <Input type="hidden" value={user.id} name="id" />
                  <Input type="hidden" value="preview" name="role" />
                  <Button 
                    type="submit" 
                    variant="secondary" 
                    className="w-full"
                    disabled={loading !== null}
                  >
                    {loading === 'preview' ? "Setting..." : "Make Preview User"}
                  </Button>
                </form>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setOpenDialog(false)}
                  disabled={loading !== null}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog open={removeRoleDialog} onOpenChange={setRemoveRoleDialog}>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                className="w-full"
                aria-label="Remove user role"
                disabled={userRole === 'No role'}
              >
                Remove Role
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove User Role</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove {user.firstName}&apos;s {userRole} role? This will revoke all permissions associated with this role.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={loading === 'remove'}>Cancel</AlertDialogCancel>
                <form action={handleRemoveRole}>
                  <Input type="hidden" value={user.id} name="id" />
                  <AlertDialogAction 
                    type="submit"
                    disabled={loading === 'remove'}
                  >
                    {loading === 'remove' ? "Removing..." : "Remove Role"}
                  </AlertDialogAction>
                </form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between"
                aria-label="Additional actions"
              >
                More Options
                <MoreHorizontal className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onSelect={() => {
                  navigator.clipboard.writeText(user.id)
                  toast({
                    title: "Copied",
                    description: "User ID copied to clipboard",
                  })
                }}
              >
                Copy User ID
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  navigator.clipboard.writeText(primaryEmail || '')
                  toast({
                    title: "Copied",
                    description: "Email copied to clipboard",
                  })
                }}
              >
                Copy Email
              </DropdownMenuItem>
              {user.lastSignInAt && (
                <DropdownMenuItem
                  onSelect={() => {
                    navigator.clipboard.writeText(new Date(user.lastSignInAt).toISOString())
                    toast({
                      title: "Copied",
                      description: "Last sign in date copied to clipboard",
                    })
                  }}
                >
                  Copy Last Sign In
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
