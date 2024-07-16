import React from 'react';
import { useFormContext, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const ResidentialHistory: React.FC = () => {
  const { register, control, formState: { errors } } = useFormContext();

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Residential History</h3>
      <div className="space-y-2">
        <Label>Current Address</Label>
        <Input {...register("residentialHistory.currentAddress.street")} placeholder="Street Address Ex: 123 Main St" />
        {errors.residentialHistory?.currentAddress?.street && <p className="text-red-500">{errors.residentialHistory.currentAddress.street.message}</p>}
        <Input {...register("residentialHistory.currentAddress.apt")} placeholder="apt, suite, bldg (optional)" />
        <Input {...register("residentialHistory.currentAddress.city")} placeholder="City" />
        {errors.residentialHistory?.currentAddress?.city && <p className="text-red-500">{errors.residentialHistory.currentAddress.city.message}</p>}
        <div className="grid grid-cols-2 gap-4">
          <Input {...register("residentialHistory.currentAddress.state")} placeholder="State" />
          {errors.residentialHistory?.currentAddress?.state && <p className="text-red-500">{errors.residentialHistory.currentAddress.state.message}</p>}
          <Input {...register("residentialHistory.currentAddress.zipCode")} placeholder="ZIP Code" />
          {errors.residentialHistory?.currentAddress?.zipCode && <p className="text-red-500">{errors.residentialHistory.currentAddress.zipCode.message}</p>}
        </div>
      </div>
      <div className="mt-2">
        <Label>Do you rent or own?</Label>
        <Controller
          name="residentialHistory.housingStatus"
          control={control}
          render={({ field }) => (
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className="flex space-x-4 mt-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rent" id="rent" />
                <Label htmlFor="rent">Rent</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="own" id="own" />
                <Label htmlFor="own">Own</Label>
              </div>
            </RadioGroup>
          )}
        />
        {errors.residentialHistory?.housingStatus && <p className="text-red-500">{errors.residentialHistory.housingStatus.message}</p>}
      </div>
      <div className="space-y-2 mt-2">
        <Label htmlFor="monthlyPayment">Monthly Payment</Label>
        <Input id="monthlyPayment" {...register("residentialHistory.monthlyPayment")} />
        {errors.residentialHistory?.monthlyPayment && <p className="text-red-500">{errors.residentialHistory.monthlyPayment.message}</p>}
      </div>
      <div className="space-y-2 mt-2">
        <Label htmlFor="durationOfTenancy">How long have you lived here?</Label>
        <Input id="durationOfTenancy" {...register("residentialHistory.durationOfTenancy")} />
        {errors.residentialHistory?.durationOfTenancy && <p className="text-red-500">{errors.residentialHistory.durationOfTenancy.message}</p>}
      </div>
    </div>
  );
};
