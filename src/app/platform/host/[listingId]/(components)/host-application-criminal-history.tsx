import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Application } from '@prisma/client';

interface ApplicationCriminalHistoryProps {
  application: Application;
}

const ApplicationCriminalHistory: React.FC<ApplicationCriminalHistoryProps> = ({ application }) => {
  const historyTypes = [
    { title: "No self reported Criminal history", isVerified: true },
    { title: "No self reported Eviction history", isVerified: false },
  ];

  return (
    <>
      <h3 className="text-2xl text-center font-semibold mb-4">Background Check</h3>
      {historyTypes.map((history, i) => (
        <Card key={i} className="mb-4">
          <CardContent className="flex justify-between items-center p-4">
            <p className="font-semibold">{history.title}</p>
            <p className={`${history.isVerified ? "text-green-700" : "text-red-700"} font-semibold text-large`}>
              {history.isVerified ? "Verified" : "Unverified"}
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Click to view
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Coming Soon</DialogTitle>
                </DialogHeader>
                <p>This feature is coming soon.</p>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ))}
      <div className="mt-6">
        <label htmlFor="explanation" className="block text-sm font-medium text-gray-700 mb-2">
          Explanation:
        </label>
        <Textarea
          id="explanation"
          value={application.explanation || "No explanation provided."}
          readOnly
          className="w-full h-32 p-2 border rounded-md bg-gray-100"
        />
      </div>
    </>
  );
};

export default ApplicationCriminalHistory;