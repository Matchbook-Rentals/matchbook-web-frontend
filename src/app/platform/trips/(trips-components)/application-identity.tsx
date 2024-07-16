import React from 'react';
import { useFormContext, Controller } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Identification: React.FC = () => {
  const { register, control, formState: { errors } } = useFormContext();

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Identification</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="idType">Select ID type</Label>
          <Controller
            name="identification.idType"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ID type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className='cursor-pointer' value="driversLicense">Driver's License</SelectItem>
                  <SelectItem className='cursor-pointer' value="passport">Passport</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.identification?.idType && <p className="text-red-500">{errors.identification.idType.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="idNumber">ID Number</Label>
          <Input id="idNumber" {...register("identification.idNumber")} />
          {errors.identification?.idNumber && <p className="text-red-500">{errors.identification.idNumber.message}</p>}
        </div>
      </div>
      <div className="mt-2">
        <Label>Please upload a photo of your ID</Label>
        <Button variant="outline" className="mt-1">Upload Photos from computer</Button>
      </div>
    </div>
  );
};
