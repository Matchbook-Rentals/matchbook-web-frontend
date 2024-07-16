import React from 'react';
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Income: React.FC = () => {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Income</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="incomeSource">Income Source</Label>
          <Input id="incomeSource" {...register("income.source")} />
          {errors.income?.source && <p className="text-red-500">{errors.income.source.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="monthlyAmount">Monthly Amount</Label>
          <Input id="monthlyAmount" {...register("income.monthlyAmount")} />
          {errors.income?.monthlyAmount && <p className="text-red-500">{errors.income.monthlyAmount.message}</p>}
        </div>
      </div>
      <div className="mt-2">
        <Label>Please upload proof of income</Label>
        <Button variant="outline" className="mt-1">Upload Photos from computer</Button>
      </div>
    </div>
  );
};
