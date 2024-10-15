
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const WebhookTester: React.FC = () => {
  const [url, setUrl] = useState('');
  const [signature, setSignature] = useState('');
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = async () => {
    try {
      const res = await fetch('/api/pandadoc/templates', {
        method: 'DELETE',
      });
      const data = await res.text();
      setResponse(data);
    } catch (error) {
      setResponse(`Error: ${error}`);
    }
    setIsDeleteDialogOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const urlWithSignature = signature
        ? `${url}${url.includes('?') ? '&' : '?'}signature=${encodeURIComponent(signature)}`
        : url;
      //alert(urlWithSignature);
      const res = await fetch(urlWithSignature, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });
      const data = await res.text();
      setResponse(data);
    } catch (error) {
      setResponse(`Error: ${error}`);
    }
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontSize: '18px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px',
    fontSize: '18px',
    marginBottom: '20px',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '15px 30px',
    fontSize: '20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ fontSize: '36px', marginBottom: '30px' }}>Webhook Tester</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="url" style={{ display: 'block', marginBottom: '10px' }}>URL:</label>
          <input
            type="text"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="signature" style={{ display: 'block', marginBottom: '10px' }}>Signature (optional):</label>
          <input
            type="text"
            id="signature"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="requestBody" style={{ display: 'block', marginBottom: '10px' }}>Request Body (JSON):</label>
          <textarea
            id="requestBody"
            value={requestBody}
            onChange={(e) => setRequestBody(e.target.value)}
            required
            style={{ ...inputStyle, height: '150px' }}
          />
        </div>
        <button type="submit" style={buttonStyle}>Send POST Request</button>
      </form>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" style={{
            ...buttonStyle,
            backgroundColor: '#dc3545',
            marginTop: '20px',
            marginBottom: '20px'
          }}>
            DELETE Templates
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action will delete all templates. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {response && (
        <div style={{ marginTop: '30px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>Response:</h2>
          <pre style={{ 
            backgroundColor: '#f4f4f4', 
            padding: '15px', 
            borderRadius: '5px',
            overflowX: 'auto',
            fontSize: '16px'
          }}>{response}</pre>
        </div>
      )}
    </div>
  );
};

export default WebhookTester;
