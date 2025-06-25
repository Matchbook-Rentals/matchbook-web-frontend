"use client";

import { useState, useEffect } from "react";

interface TestResult {
  testData: {
    firstName: string;
    lastName: string;
    ssn: string;
    dob: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  apiResponse: any;
  statusCode: number;
  timestamp: string;
}

interface TestCase {
  name: string;
  type: "Eviction Records" | "Criminal Records";
  data: {
    firstName: string;
    lastName: string;
    ssn: string;
    dob: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
}

interface BGSReport {
  id: string;
  createdAt: string;
  updatedAt: string;
  purchaseId: string;
  userId: string;
  orderId: string;
  status: string;
  reportData: any;
  receivedAt: string | null;
  purchase: {
    id: string;
    email: string | null;
    amount: number | null;
    createdAt: string;
    type: string;
  } | null;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
}

export default function TestBackgroundCheckPage() {
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTest, setCurrentTest] = useState<string>("");
  const [reports, setReports] = useState<BGSReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<BGSReport | null>(null);
  const [retrievingOrders, setRetrievingOrders] = useState<Set<string>>(new Set());

  const testCases: TestCase[] = [
    {
      name: "Sample Test",
      type: "Criminal Records",
      data: {
        firstName: "John",
        lastName: "Doe", 
        ssn: "123456789",
        dob: "1990-01-15",
        address: "123 Main Street",
        city: "Anytown",
        state: "CA",
        zip: "12345"
      }
    },
    {
      name: "Dante Blackwood",
      type: "Eviction Records",
      data: {
        firstName: "Dante",
        lastName: "Blackwood",
        ssn: "118829724",
        dob: "1994-05-13",
        address: "751 N Indian Creek DR",
        city: "Clarkston",
        state: "GA",
        zip: "30021"
      }
    },
    {
      name: "Marcus Anthony Snell",
      type: "Criminal Records", 
      data: {
        firstName: "Marcus",
        lastName: "Snell",
        ssn: "123456789", // Using placeholder since "Any" was specified
        dob: "1983-03-24",
        address: "123 Any Street", // Using placeholder since "Any" was specified
        city: "Anytown",
        state: "GA",
        zip: "30021"
      }
    }
  ];

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const response = await fetch("/api/bgs-reports");
      const data = await response.json();
      if (data.success) {
        setReports(data.reports);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const retrieveOrderResults = async (orderId: string) => {
    setRetrievingOrders(prev => new Set(prev).add(orderId));
    
    try {
      const response = await fetch("/api/retrieve-order-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Refresh reports to show updated status
        await fetchReports();
        
        if (result.hasResults) {
          alert(`Order results retrieved and saved for order ${orderId}`);
        } else {
          alert(`Request sent for order ${orderId}. Results may be available shortly.`);
        }
      } else {
        alert(`Failed to retrieve results: ${result.error}`);
      }
    } catch (err) {
      console.error("Failed to retrieve order results:", err);
      alert("Failed to retrieve order results");
    } finally {
      setRetrievingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const runTest = async (testCase?: TestCase) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setCurrentTest(testCase?.name || "Sample Test");

    try {
      const testData = testCase?.data || {
        firstName: "John",
        lastName: "Doe", 
        ssn: "123456789",
        dob: "1990-01-15",
        address: "123 Main Street",
        city: "Anytown",
        state: "CA",
        zip: "12345"
      };

      const response = await fetch("/api/test-background-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      });

      const apiResponse = await response.json();
      
      setResult({
        testData,
        apiResponse,
        statusCode: response.status,
        timestamp: new Date().toISOString()
      });

      // Refresh reports after successful test
      if (response.status === 200) {
        setTimeout(() => fetchReports(), 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Background Check API Test</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Cases</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testCases.map((testCase, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">{testCase.name}</h3>
              <p className="text-sm text-gray-600 mb-2">Type: {testCase.type}</p>
              <p className="text-sm text-gray-600 mb-3">
                {testCase.data.firstName} {testCase.data.lastName}
              </p>
              <button
                onClick={() => runTest(testCase)}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium text-sm"
              >
                {loading && currentTest === testCase.name ? "Running..." : "Test"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* BGS Reports Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">BGS Reports</h2>
          <button
            onClick={fetchReports}
            disabled={reportsLoading}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium text-sm"
          >
            {reportsLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
          {reports.length === 0 ? (
            <div className="p-4 text-gray-500 text-center">No reports found</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-sm">
                        Order ID: {report.orderId}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {report.user.firstName} {report.user.lastName} ({report.user.email})
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end mb-1">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          report.status === 'completed' ? 'bg-green-100 text-green-800' :
                          report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {report.status}
                        </span>
                        {report.status === 'pending' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              retrieveOrderResults(report.orderId);
                            }}
                            disabled={retrievingOrders.has(report.orderId)}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-2 py-1 rounded text-xs font-medium"
                          >
                            {retrievingOrders.has(report.orderId) ? "Retrieving..." : "Retrieve"}
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>
                      {report.purchase ? 
                        `Purchase: $${(report.purchase.amount || 0) / 100}` : 
                        'Test Order (No Purchase)'
                      }
                    </div>
                    {report.receivedAt && (
                      <div>Received: {new Date(report.receivedAt).toLocaleString()}</div>
                    )}
                  </div>
                  
                  {selectedReport?.id === report.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-medium text-sm mb-2">Report Details</h4>
                      <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                        <div><strong>Report ID:</strong> {report.id}</div>
                        <div><strong>Purchase ID:</strong> {report.purchaseId || 'None (Test)'}</div>
                        <div><strong>User ID:</strong> {report.userId}</div>
                        <div><strong>Created:</strong> {new Date(report.createdAt).toLocaleString()}</div>
                        <div><strong>Updated:</strong> {new Date(report.updatedAt).toLocaleString()}</div>
                        <div><strong>Amount:</strong> {report.purchase ? `$${(report.purchase.amount || 0) / 100}` : 'Test Order'}</div>
                      </div>
                      
                      {report.reportData && (
                        <div>
                          <h5 className="font-medium text-sm mb-2">XML Response Data</h5>
                          <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-64">
                            {JSON.stringify(report.reportData, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {!report.reportData && report.status === 'pending' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                          <p className="text-yellow-800 text-xs">
                            Report is pending. XML response data will appear here when received via webhook.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h2 className="text-red-800 font-semibold mb-2">Error</h2>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Test Data Sent - {currentTest}</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>Name:</strong> {result.testData.firstName} {result.testData.lastName}</div>
              <div><strong>SSN:</strong> {result.testData.ssn}</div>
              <div><strong>DOB:</strong> {result.testData.dob}</div>
              <div><strong>Address:</strong> {result.testData.address}</div>
              <div><strong>City:</strong> {result.testData.city}</div>
              <div><strong>State:</strong> {result.testData.state}</div>
              <div><strong>Zip:</strong> {result.testData.zip}</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">API Response</h2>
            <div className="mb-3">
              <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                result.statusCode === 200 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                Status: {result.statusCode}
              </span>
              <span className="ml-4 text-sm text-gray-600">
                {result.timestamp}
              </span>
            </div>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(result.apiResponse, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}