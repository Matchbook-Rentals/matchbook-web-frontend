/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, FileText, Database, CheckCircle2, XCircle, Clock } from 'lucide-react';

const BackgroundCheckWebhookTester: React.FC = () => {
  const [orderId, setOrderId] = useState('');
  const [xmlPayload, setXmlPayload] = useState('');
  const [response, setResponse] = useState<{
    status: number;
    data: any;
    timestamp: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [dbCheck, setDbCheck] = useState<any>(null);

  // Sample XML templates for testing
  const sampleXmlComplete = `<?xml version="1.0" encoding="UTF-8"?>
<XML>
  <login>
    <account>TEST_ACCOUNT</account>
    <username>TEST_USER</username>
    <password>TEST_PASS</password>
  </login>
  <completeOrder>
    <order orderID="MBWEB-12345678">
      <subject>
        <name_first>John</name_first>
        <name_last>Doe</name_last>
        <ssn>123456789</ssn>
        <dob>19900515</dob>
      </subject>
      <components>
        <component>
          <type>National Criminal Search</type>
          <status>Complete</status>
          <results>
            <record>
              <offense>No Records Found</offense>
              <status>Clear</status>
            </record>
          </results>
        </component>
        <component>
          <type>Eviction Search</type>
          <status>Complete</status>
          <results>
            <record>
              <type>No Records Found</type>
              <status>Clear</status>
            </record>
          </results>
        </component>
      </components>
    </order>
  </completeOrder>
</XML>`;

  const sampleXmlWithRecords = `<?xml version="1.0" encoding="UTF-8"?>
<XML>
  <login>
    <account>TEST_ACCOUNT</account>
    <username>TEST_USER</username>
    <password>TEST_PASS</password>
  </login>
  <completeOrder>
    <order orderID="MBWEB-87654321">
      <subject>
        <name_first>Jane</name_first>
        <name_last>Smith</name_first>
        <ssn>987654321</ssn>
        <dob>19850320</dob>
      </subject>
      <components>
        <component>
          <type>National Criminal Search</type>
          <status>Complete</status>
          <results>
            <record>
              <offense>Traffic Violation</offense>
              <date>20200115</date>
              <disposition>Fine Paid</disposition>
              <county>Santa Clara County</county>
              <state>CA</state>
            </record>
          </results>
        </component>
        <component>
          <type>County Criminal Search</type>
          <status>Complete</status>
          <county>Santa Clara County</county>
          <state>CA</state>
          <results>
            <record>
              <offense>Traffic Violation</offense>
              <date>20200115</date>
              <disposition>Fine Paid</disposition>
            </record>
          </results>
        </component>
        <component>
          <type>Eviction Search</type>
          <status>Complete</status>
          <results>
            <record>
              <type>No Records Found</type>
              <status>Clear</status>
            </record>
          </results>
        </component>
      </components>
    </order>
  </completeOrder>
</XML>`;

  const handleLoadSample = (sample: string) => {
    setXmlPayload(sample);
    // Extract order ID from sample
    const match = sample.match(/orderID="([^"]+)"/);
    if (match) {
      setOrderId(match[1]);
    }
  };

  const handleSendWebhook = async () => {
    setLoading(true);
    setResponse(null);
    setDbCheck(null);

    try {
      const res = await fetch('/api/background-check-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml',
        },
        body: xmlPayload,
      });

      const data = await res.json();

      setResponse({
        status: res.status,
        data,
        timestamp: new Date().toISOString(),
      });

      // If successful, check database
      if (res.ok && data.orderId) {
        await checkDatabase(data.orderId);
      }
    } catch (error) {
      setResponse({
        status: 500,
        data: { error: String(error) },
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const checkDatabase = async (orderIdToCheck?: string) => {
    const targetOrderId = orderIdToCheck || orderId;
    if (!targetOrderId) {
      alert('Please enter an order ID');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/check-bgs-report?orderId=${targetOrderId}`);
      const data = await res.json();
      setDbCheck(data);
    } catch (error) {
      setDbCheck({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status?: number) => {
    if (!status) return <Clock className="h-5 w-5 text-gray-400" />;
    if (status >= 200 && status < 300) return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusColor = (status?: number) => {
    if (!status) return 'bg-gray-100';
    if (status >= 200 && status < 300) return 'bg-green-50 border-green-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Background Check Webhook Tester
          </CardTitle>
          <p className="text-muted-foreground">
            Test the Accio Data webhook endpoint by simulating XML POST requests
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              This tool simulates Accio Data posting background check results to your webhook endpoint.
              Use it to test XML parsing, database updates, and error handling.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="send">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="send">Send Webhook</TabsTrigger>
              <TabsTrigger value="check">Check Database</TabsTrigger>
            </TabsList>

            <TabsContent value="send" className="space-y-4">
              <div className="space-y-2">
                <Label>Sample XML Templates</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleLoadSample(sampleXmlComplete)}
                  >
                    Clean Record (No Criminal/Eviction)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleLoadSample(sampleXmlWithRecords)}
                  >
                    With Records (Traffic Violation)
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orderId">Order ID (for reference)</Label>
                <Input
                  id="orderId"
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="MBWEB-12345678"
                />
                <p className="text-xs text-muted-foreground">
                  This should match an existing BGSReport in your database with status=&apos;pending&apos;
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="xmlPayload">XML Payload</Label>
                <Textarea
                  id="xmlPayload"
                  value={xmlPayload}
                  onChange={(e) => setXmlPayload(e.target.value)}
                  placeholder="<?xml version='1.0'?>..."
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              <Button
                onClick={handleSendWebhook}
                disabled={loading || !xmlPayload}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {loading ? 'Sending...' : 'Send to Webhook Endpoint'}
              </Button>

              {response && (
                <div className={`space-y-2 p-4 rounded-lg border ${getStatusColor(response.status)}`}>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(response.status)}
                    <Label>
                      Response: {response.status} {response.status >= 200 && response.status < 300 ? 'Success' : 'Error'}
                    </Label>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {response.timestamp}
                  </div>
                  <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(response.data, null, 2)}
                  </pre>
                </div>
              )}
            </TabsContent>

            <TabsContent value="check" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="checkOrderId">Order ID to Check</Label>
                <div className="flex gap-2">
                  <Input
                    id="checkOrderId"
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="MBWEB-12345678"
                  />
                  <Button
                    onClick={() => checkDatabase()}
                    disabled={loading || !orderId}
                    className="flex items-center gap-2"
                  >
                    <Database className="h-4 w-4" />
                    Check Database
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Look up a BGSReport by order ID to see current status and data
                </p>
              </div>

              {dbCheck && (
                <div className="space-y-2">
                  <Label>Database Record:</Label>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                    {JSON.stringify(dbCheck, null, 2)}
                  </pre>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Testing Workflow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium">Create a test BGSReport</p>
                <p className="text-sm text-muted-foreground">
                  Use Prisma Studio or create one via the verification form. Note the order ID and ensure status is &apos;pending&apos;.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Load a sample XML template</p>
                <p className="text-sm text-muted-foreground">
                  Click one of the sample buttons above to load pre-configured XML. Update the orderID in the XML to match your test record.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium">Send the webhook</p>
                <p className="text-sm text-muted-foreground">
                  Click &quot;Send to Webhook Endpoint&quot; to POST the XML to /api/background-check-webhook
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <p className="font-medium">Verify database update</p>
                <p className="text-sm text-muted-foreground">
                  The tool will automatically check the database after a successful webhook. You can also use the &quot;Check Database&quot; tab to manually verify.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What to Expect</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="font-medium">Successful Webhook (200)</p>
            <p className="text-sm text-muted-foreground">
              BGSReport status updated from &apos;pending&apos; to &apos;completed&apos;, reportData populated with XML, receivedAt timestamp set
            </p>
          </div>
          <div>
            <p className="font-medium">Order Not Found (404)</p>
            <p className="text-sm text-muted-foreground">
              No BGSReport exists with that order ID in the database
            </p>
          </div>
          <div>
            <p className="font-medium">XML Parse Error (400)</p>
            <p className="text-sm text-muted-foreground">
              Malformed XML or order ID could not be extracted
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackgroundCheckWebhookTester;
