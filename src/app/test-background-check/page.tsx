"use client";

import { useState } from "react";

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

export default function TestBackgroundCheckPage() {
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTest, setCurrentTest] = useState<string>("");

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

      const response = await fetch("/api/background-check", {
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