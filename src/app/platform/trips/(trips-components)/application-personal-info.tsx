import React from 'react';
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const PersonalInfo: React.FC = () => {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="firstName">First Name</Label>
        <Input id="firstName" {...register("personalInfo.firstName")} />
        {errors.personalInfo?.firstName && <p className="text-red-500">{errors.personalInfo.firstName.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="lastName">Last Name</Label>
        <Input id="lastName" {...register("personalInfo.lastName")} />
        {errors.personalInfo?.lastName && <p className="text-red-500">{errors.personalInfo.lastName.message}</p>}
      </div>
    </div>
  );
};

