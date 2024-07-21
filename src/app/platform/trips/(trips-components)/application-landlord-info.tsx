import React from 'react';
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const LandlordInfo: React.FC = () => {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Landlord/Property Manager Contact Information</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="landlordFirstName">First Name</Label>
          <Input id="landlordFirstName" {...register("landlord.firstName")} />
          {errors.landlord?.firstName && <p className="text-red-500">{errors.landlord.firstName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="landlordLastName">Last Name</Label>
          <Input id="landlordLastName" {...register("landlord.lastName")} />
          {errors.landlord?.lastName && <p className="text-red-500">{errors.landlord.lastName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="landlordEmailAddress">Email Address</Label>
          <Input id="landlordEmailAddress" {...register("landlord.emailAddress")} />
          {errors.landlord?.emailAddress && <p className="text-red-500">{errors.landlord.emailAddress.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="landlordPhoneNumber">Phone Number</Label>
          <Input id="landlordPhoneNumber" {...register("landlord.phoneNumber")} />
          {errors.landlord?.phoneNumber && <p className="text-red-500">{errors.landlord.phoneNumber.message}</p>}
        </div>
      </div>
    </div>
  );
}

