import React from 'react';
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";

// Define the schema for form validation
const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  idType: z.enum(["driversLicense", "passport"], {
    required_error: "Please select an ID type",
  }), idNumber: z.string().min(1, "ID number is required"),
  currentAddress: z.object({
    street: z.string().min(1, "Street address is required"),
    apt: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zipCode: z.string().min(5, "Valid ZIP code is required"),
  }),
  housingStatus: z.enum(["rent", "own"]),
  monthlyPayment: z.string().min(1, "Monthly payment is required"),
  durationOfTenancy: z.string().min(1, "Duration of tenancy is required"),
  landlord: z.object({
    firstName: z.string().min(1, "Landlord's first name is required"),
    lastName: z.string().min(1, "Landlord's last name is required"),
  }),
  income: z.object({
    source: z.string().min(1, "Income source is required"),
    monthlyAmount: z.string().min(1, "Monthly amount is required"),
  }),
});

type FormData = z.infer<typeof schema>;

const ApplicationTab: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, control } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  const onSubmit: SubmitHandler<FormData> = (data) => {
    console.log(data);
    // Handle form submission
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" {...register("firstName")} />
              {errors.firstName && <p className="text-red-500">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" {...register("lastName")} />
              {errors.lastName && <p className="text-red-500">{errors.lastName.message}</p>}
            </div>
          </div>

          {/* Identification */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Identification</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="idType">Select ID type</Label>
                <Select onValueChange={(value) => control._updateFieldArray("idType", value)} defaultValue="">
                  <SelectTrigger>
                    <SelectValue placeholder="Select ID type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem className='cursor-pointer' value="driversLicense">Driver's License</SelectItem>
                    <SelectItem className='cursor-pointer' value="passport">Passport</SelectItem>
                  </SelectContent>
                </Select>
                {errors.idType && <p className="text-red-500">{errors.idType.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="idNumber">ID Number</Label>
                <Input id="idNumber" {...register("idNumber")} />
                {errors.idNumber && <p className="text-red-500">{errors.idNumber.message}</p>}
              </div>
            </div>
            <div className="mt-2">
              <Label>Please upload a photo of your ID</Label>
              <Button variant="outline" className="mt-1">Upload Photos from computer</Button>
            </div>
          </div>

          {/* Residential History */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Residential History</h3>
            <div className="space-y-2">
              <Label>Current Address</Label>
              <Input {...register("currentAddress.street")} placeholder="Street Address Ex: 123 Main St" />
              {errors.currentAddress?.street && <p className="text-red-500">{errors.currentAddress.street.message}</p>}
              <Input {...register("currentAddress.apt")} placeholder="apt, suite, bldg (optional)" />
              <Input {...register("currentAddress.city")} placeholder="City" />
              {errors.currentAddress?.city && <p className="text-red-500">{errors.currentAddress.city.message}</p>}
              <div className="grid grid-cols-2 gap-4">
                <Input {...register("currentAddress.state")} placeholder="State" />
                {errors.currentAddress?.state && <p className="text-red-500">{errors.currentAddress.state.message}</p>}
                <Input {...register("currentAddress.zipCode")} placeholder="ZIP Code" />
                {errors.currentAddress?.zipCode && <p className="text-red-500">{errors.currentAddress.zipCode.message}</p>}
              </div>
            </div>
            <div className="mt-2">
              <Label>Do you rent or own?</Label>
              <RadioGroup defaultValue="rent" className="flex space-x-4 mt-1">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rent" id="rent" {...register("housingStatus")} />
                  <Label htmlFor="rent">Rent</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="own" id="own" {...register("housingStatus")} />
                  <Label htmlFor="own">Own</Label>
                </div>
              </RadioGroup>
              {errors.housingStatus && <p className="text-red-500">{errors.housingStatus.message}</p>}
            </div>
            <div className="space-y-2 mt-2">
              <Label htmlFor="monthlyPayment">Monthly Payment</Label>
              <Input id="monthlyPayment" {...register("monthlyPayment")} />
              {errors.monthlyPayment && <p className="text-red-500">{errors.monthlyPayment.message}</p>}
            </div>
            <div className="space-y-2 mt-2">
              <Label htmlFor="durationOfTenancy">How long have you lived here?</Label>
              <Input id="durationOfTenancy" {...register("durationOfTenancy")} />
              {errors.durationOfTenancy && <p className="text-red-500">{errors.durationOfTenancy.message}</p>}
            </div>
          </div>

          {/* Landlord/Property Manager Contact Information */}
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
            </div>
          </div>

          {/* Income */}
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

          <Button type="submit" className="w-full">Submit Application</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ApplicationTab;
