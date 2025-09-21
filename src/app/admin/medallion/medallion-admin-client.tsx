"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, User, Database, CheckCircle, XCircle, Clock, AlertCircle, Trash2, RotateCcw } from "lucide-react";

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  medallionUserId: string | null;
  medallionUserAccessCode: string | null;
  medallionVerificationStatus: string | null;
  medallionIdentityVerified: boolean | null;
  medallionVerificationStartedAt: Date | null;
  medallionVerificationCompletedAt: Date | null;
}

interface MedallionAdminClientProps {
  users: User[];
  allUsers: User[];
  currentUserId: string;
}

export default function MedallionAdminClient({ users, allUsers, currentUserId }: MedallionAdminClientProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [userAccessCode, setUserAccessCode] = useState<string>("");
  const [medallionUserId, setMedallionUserId] = useState<string>("");

  // Auto-populate fields when user is selected
  const handleUserSelection = (userId: string) => {
    setSelectedUserId(userId);

    if (userId) {
      const selectedUser = allUsers.find(u => u.id === userId);
      if (selectedUser) {
        setUserAccessCode(selectedUser.medallionUserAccessCode || "");
        setMedallionUserId(selectedUser.medallionUserId || "");
      }
    } else {
      setUserAccessCode("");
      setMedallionUserId("");
    }
  };

  const triggerVerificationCheck = async (userId: string) => {
    setLoading(userId);
    try {
      const response = await fetch("/api/admin/medallion/poll-user-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId: userId,
        }),
      });

      const result = await response.json();
      setResults(prev => ({ ...prev, [userId]: result }));

      if (result.success) {
        // Refresh the page to show updated data
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      console.error("Error checking verification:", error);
      setResults(prev => ({
        ...prev,
        [userId]: {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        }
      }));
    } finally {
      setLoading(null);
    }
  };

  const setUserMedallionData = async () => {
    if (!selectedUserId) {
      alert("Please select a user");
      return;
    }

    setLoading("set-data");
    try {
      const response = await fetch("/api/admin/medallion/set-user-access-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId: selectedUserId,
          userAccessCode: userAccessCode || null,
          medallionUserId: medallionUserId || null,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert("User data updated successfully!");
        window.location.reload();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error setting user data:", error);
      alert("Error setting user data");
    } finally {
      setLoading(null);
    }
  };

  const resetUserData = async () => {
    if (!selectedUserId) {
      alert("Please select a user");
      return;
    }

    if (!confirm("Are you sure you want to RESET MEDALLION data for this user? This cannot be undone.")) {
      return;
    }

    setLoading("reset-data");
    try {
      const response = await fetch("/api/admin/medallion/reset-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId: selectedUserId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert("Medallion data reset successfully!");
        window.location.reload();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error resetting user data:", error);
      alert("Error resetting user data");
    } finally {
      setLoading(null);
    }
  };

  const getStatusBadge = (status: string | null, verified: boolean | null) => {
    if (verified) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
    }

    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "rejected":
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case "expired":
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  return (
    <div className="space-y-8">
      {/* Manual User Data Setting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Set User Medallion Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Selection */}
          <div>
            <Label htmlFor="user-select">Select User</Label>
            <select
              id="user-select"
              value={selectedUserId}
              onChange={(e) => handleUserSelection(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md"
            >
              <option value="">Select a user...</option>
              {allUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {/* Current Data Display */}
          {selectedUserId && (() => {
            const selectedUser = allUsers.find(u => u.id === selectedUserId);
            return selectedUser && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-3">Current Medallion Data</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><strong>Verified:</strong> {selectedUser.medallionIdentityVerified ? "✅ Yes" : "❌ No"}</div>
                  <div><strong>Status:</strong> {selectedUser.medallionVerificationStatus || "None"}</div>
                  <div><strong>User ID:</strong> <code className="text-xs">{selectedUser.medallionUserId || "None"}</code></div>
                  <div><strong>Access Code:</strong> <code className="text-xs">{selectedUser.medallionUserAccessCode || "None"}</code></div>
                  <div><strong>Started:</strong> {selectedUser.medallionVerificationStartedAt ? new Date(selectedUser.medallionVerificationStartedAt).toLocaleDateString() : "None"}</div>
                  <div><strong>Completed:</strong> {selectedUser.medallionVerificationCompletedAt ? new Date(selectedUser.medallionVerificationCompletedAt).toLocaleDateString() : "None"}</div>
                </div>
              </div>
            );
          })()}

          {/* Edit Fields */}
          {selectedUserId && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="access-code">User Access Code</Label>
                  <Input
                    id="access-code"
                    value={userAccessCode}
                    onChange={(e) => setUserAccessCode(e.target.value)}
                    placeholder="Enter access code or leave empty to clear"
                  />
                </div>
                <div>
                  <Label htmlFor="medallion-id">Medallion User ID</Label>
                  <Input
                    id="medallion-id"
                    value={medallionUserId}
                    onChange={(e) => setMedallionUserId(e.target.value)}
                    placeholder="Enter user ID or leave empty to clear"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button
                  onClick={setUserMedallionData}
                  disabled={loading === "set-data"}
                  className="w-full"
                >
                  {loading === "set-data" ? "Updating..." : "Update Fields"}
                </Button>
                <Button
                  onClick={resetUserData}
                  disabled={loading === "reset-data"}
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {loading === "reset-data" ? "Resetting..." : "Reset Medallion Data"}
                </Button>
                <Button
                  onClick={() => triggerVerificationCheck(selectedUserId)}
                  disabled={loading === selectedUserId}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading === selectedUserId ? 'animate-spin' : ''}`} />
                  {loading === selectedUserId ? "Checking..." : "Force Check"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Users with Medallion Data ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No users with Medallion data found</p>
            ) : (
              users.map((user) => (
                <div key={user.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-400">ID: {user.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(user.medallionVerificationStatus, user.medallionIdentityVerified)}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => triggerVerificationCheck(user.id)}
                        disabled={loading === user.id || !user.medallionUserAccessCode}
                        title={!user.medallionUserAccessCode ? "No access code available" : "Check verification status"}
                      >
                        {loading === user.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        Check Status
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Medallion User ID:</strong>
                      <p className="font-mono text-xs break-all">
                        {user.medallionUserId || "Not set"}
                      </p>
                    </div>
                    <div>
                      <strong>User Access Code:</strong>
                      <p className="font-mono text-xs break-all">
                        {user.medallionUserAccessCode || "Not set"}
                      </p>
                    </div>
                    <div>
                      <strong>Started:</strong>
                      <p>{formatDate(user.medallionVerificationStartedAt)}</p>
                    </div>
                    <div>
                      <strong>Completed:</strong>
                      <p>{formatDate(user.medallionVerificationCompletedAt)}</p>
                    </div>
                  </div>

                  {results[user.id] && (
                    <div className="mt-3 p-3 bg-gray-50 rounded border">
                      <strong>Last Check Result:</strong>
                      <pre className="text-xs mt-1 overflow-auto">
                        {JSON.stringify(results[user.id], null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}