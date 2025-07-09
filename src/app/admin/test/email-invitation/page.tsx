'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';

export default function EmailInvitationTest() {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInvite = async () => {
    setStatus(null);
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          recipientEmail, 
          tripId: process.env.NEXT_PUBLIC_TEST_TRIP_ID 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus(data.message);
        setRecipientEmail(''); // Clear the input field upon success
      } else {
        setError(data.error || 'An unexpected error occurred.');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to send invitation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Invitation Test
          </CardTitle>
          <p className="text-muted-foreground">
            Test email invitation functionality for trip invitations
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Recipient's Email</Label>
            <Input
              id="email"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="Enter recipient's email address"
              disabled={isLoading}
            />
          </div>

          <Button 
            onClick={handleInvite}
            disabled={!recipientEmail || isLoading}
            className="w-full flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            {isLoading ? 'Sending...' : 'Send Invitation'}
          </Button>

          {status && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {status}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-muted-foreground">
            <p><strong>Test Trip ID:</strong> {process.env.NEXT_PUBLIC_TEST_TRIP_ID || 'Not configured'}</p>
            <p className="mt-2">
              This test uses the configured test trip ID from environment variables.
              Make sure the trip exists and is accessible for testing.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}