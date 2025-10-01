'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { getOrphanedClerkUsers, createUserFromClerkId, createAllOrphanedUsers } from './_actions';
import { Loader2, UserPlus, Users, RefreshCw } from 'lucide-react';

interface OrphanedUser {
  clerkId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  createdAt: number;
}

export default function OrphanedUsersPage() {
  const [orphanedUsers, setOrphanedUsers] = useState<OrphanedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingUser, setCreatingUser] = useState<string | null>(null);
  const [bulkCreating, setBulkCreating] = useState(false);
  const { toast } = useToast();

  const loadOrphanedUsers = async () => {
    setLoading(true);
    try {
      const result = await getOrphanedClerkUsers();
      if (result.success && result.orphanedUsers) {
        setOrphanedUsers(result.orphanedUsers);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to load orphaned users',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load orphaned users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrphanedUsers();
  }, []);

  const handleCreateUser = async (clerkId: string) => {
    setCreatingUser(clerkId);
    try {
      const result = await createUserFromClerkId(clerkId);
      if (result.success) {
        toast({
          title: 'Success',
          description: 'User created successfully',
        });
        // Reload the list
        await loadOrphanedUsers();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create user',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create user',
        variant: 'destructive',
      });
    } finally {
      setCreatingUser(null);
    }
  };

  const handleCreateAll = async () => {
    setBulkCreating(true);
    try {
      const result = await createAllOrphanedUsers();
      if (result.success) {
        toast({
          title: 'Success',
          description: `Created ${result.created} users. Failed: ${result.failed}`,
        });
        // Reload the list
        await loadOrphanedUsers();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to bulk create users',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to bulk create users',
        variant: 'destructive',
      });
    } finally {
      setBulkCreating(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Users className="h-6 w-6" />
                Orphaned Clerk Users
              </CardTitle>
              <CardDescription>
                Clerk users that don&apos;t have corresponding database records
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={loadOrphanedUsers}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-2">Refresh</span>
              </Button>
              {orphanedUsers.length > 0 && (
                <Button
                  onClick={handleCreateAll}
                  disabled={bulkCreating}
                  size="sm"
                >
                  {bulkCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  Create All ({orphanedUsers.length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : orphanedUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Orphaned Users Found</h3>
              <p className="text-muted-foreground">
                All Clerk users have corresponding database records.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clerk ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orphanedUsers.map((user) => (
                    <TableRow key={user.clerkId}>
                      <TableCell className="font-mono text-xs">
                        {user.clerkId.substring(0, 20)}...
                      </TableCell>
                      <TableCell>{user.email || <Badge variant="secondary">No email</Badge>}</TableCell>
                      <TableCell>
                        {user.firstName || user.lastName ? (
                          `${user.firstName || ''} ${user.lastName || ''}`.trim()
                        ) : (
                          <Badge variant="secondary">No name</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => handleCreateUser(user.clerkId)}
                          disabled={creatingUser === user.clerkId}
                          size="sm"
                        >
                          {creatingUser === user.clerkId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserPlus className="h-4 w-4" />
                          )}
                          <span className="ml-2">Create</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>About Orphaned Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Orphaned users occur when:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>Clerk webhook fails or is delayed</li>
            <li>Database is temporarily unavailable during user creation</li>
            <li>Manual user creation in Clerk without database sync</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            The system now automatically creates database records when orphaned users access the app,
            but this tool allows you to proactively fix existing orphaned accounts.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
