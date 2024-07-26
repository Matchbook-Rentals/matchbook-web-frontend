import * as z from "zod";

// Image schema
export const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export const identificationSchema = z.object({
  idType: z.enum(["driversLicense", "passport"], {
    required_error: "Please select an ID type",
  }),
  idNumber: z.string().min(1, "ID number is required"),
});

export const addressSchema = z.object({
  street: z.string().min(1, "Street address is required"),
  apt: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(5, "Valid ZIP code is required"),
});

export const residentialHistorySchema = z.object({
  currentAddress: addressSchema,
  housingStatus: z.enum(["rent", "own"]),
  monthlyPayment: z.string().min(1, "Monthly payment is required"),
  durationOfTenancy: z.string().min(1, "Duration of tenancy is required"),
});

export const landlordSchema = z.object({
  firstName: z.string().min(1, "Landlord's first name is required"),
  lastName: z.string().min(1, "Landlord's last name is required"),
  emailAddress: z.string().email().optional(),
  phoneNumber: z.string().optional(),
});

export const incomeSchema = z.object({
  source: z.string().min(1, "Income source is required"),
  monthlyAmount: z.string().min(1, "Monthly amount is required"),
});

export const applicationSchema = z.object({
  personalInfo: personalInfoSchema,
  //identification: identificationSchema,
  residentialHistory: residentialHistorySchema,
  landlord: landlordSchema,
  //income: incomeSchema,
});

export type ApplicationFormData = z.infer<typeof applicationSchema>;
