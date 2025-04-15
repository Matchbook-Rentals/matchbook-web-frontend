'use client';
import React, { useState } from 'react';

export default function ImageUploadTest() {
  const TEST_IMAGE_URL = "https://www.furnishedfinder.com/_pdp_/224115/1/224115_1_6143029-650-570.jpg";

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState(0);
  const [changed, setChanged] = useState(0);

  const handleProcessCSV = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setChecked(0);
    setChanged(0);
    try {
      const res = await fetch('/api/process-furnishedfinder-csv');
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Unknown error");
      } else {
        setChecked(data.checked);
        setChanged(data.changed);
        setResponse(data);
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  // Keep the original image upload handler for reference/demo

  // Keep the original image upload handler for reference/demo
  const handleUpload = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setChecked(0);
    setChanged(0);
    try {
      setChecked(1);
      const res = await fetch(`/api/uploadthing/direct?fileURL=${encodeURIComponent(TEST_IMAGE_URL)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unknown error");
      } else {
        setResponse(data);
        if (data.url) {
          setChanged(1);
        }
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", padding: 24, border: "1px solid #ddd", borderRadius: 8 }}>
      <h2>Test FurnishedFinder Image Upload</h2>
      <button
        onClick={handleProcessCSV}
        disabled={loading}
        style={{ padding: "0.5rem 1.5rem", fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer", marginRight: 16 }}
      >
        {loading ? "Processing..." : "Process CSV for FurnishedFinder URLs"}
      </button>
      <div style={{ marginTop: 24 }}>
        <div style={{ marginBottom: 12 }}>
          <strong>Checked:</strong> {checked} &nbsp; <strong>Changed:</strong> {changed}
        </div>
        {error && <div style={{ color: "red" }}>Error: {error}</div>}
        {response && (
          <pre style={{ background: "#f7f7f7", padding: 12, borderRadius: 4, fontSize: 14 }}>
            {JSON.stringify(response, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
