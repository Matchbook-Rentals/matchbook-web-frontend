import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ApplicationSummary = () => {
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>5 Adults 2 children 2 pets</div>
          <div>Move in: 06/20/25</div>
          <div>Move out: 06/20/25</div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>Avg rating: ⭐ 4.9</div>
          <div>Total Income: $ 5993.00</div>
          <div>Rent to Income Ratio: 3:1</div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>Criminal history: 🚩 Flag symbol</div>
          <div>Evictions: Two flag</div>
          <div>Avg Credit: E (800-850)</div>
        </div>
        <div className="flex justify-between mb-6">
          <Button className="w-[48%] bg-green-600 hover:bg-green-700">Approve</Button>
          <Button className="w-[48%] bg-red-600 hover:bg-red-700">Disapprove</Button>
        </div>
        <h3 className="text-xl font-semibold mb-4">Applicants</h3>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className={i < 2 ? "bg-blue-100" : "bg-gray-100"}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center">
                  <span className="text-xl">DR</span>
                  <div>
                    <p className="font-semibold">Daniel Resner</p>
                    <Badge variant={i < 2 ? "secondary" : "outline"}>
                      {i < 2 ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                </div>
                <span>⭐ 4.9</span>
              </CardContent>
            </Card>
          ))}
        </div>
        <h3 className="text-xl font-semibold mb-4">Identity Verification</h3>
        <div className="flex justify-between items-center mb-6">
          <div>
            <p>ID Type: Driver License</p>
            <p>ID Number: 2837462736</p>
          </div>
          <Button variant="outline">Click to View</Button>
        </div>
        <h3 className="text-xl font-semibold mb-4">Employment and Income</h3>
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="mb-4">
            <CardContent className="flex justify-between items-center p-4">
              <div>
                <p className="font-semibold">Northrop Grumman</p>
                <p>$ 2800.00 /m</p>
              </div>
              <Button variant="outline">Click to View</Button>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};

export default ApplicationSummary;