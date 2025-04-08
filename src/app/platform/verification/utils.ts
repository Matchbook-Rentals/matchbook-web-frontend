import { z } from "zod";

// Single combined schema for verification form
export const verificationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  ssn: z.string().regex(/^\d{9}$/, "SSN must be 9 digits"),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  address: z.string().min(3, "Address is required and must be at least 3 characters"),
  city: z.string().min(2, "City is required and must be at least 2 characters"),
  state: z.string().min(2, "State is required"),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Zip code must be in format 12345 or 12345-6789"),
});

export type VerificationFormValues = z.infer<typeof verificationSchema>;

// Helper function to format date from YYYY-MM-DD to YYYYMMDD for XML
export function formatDateForXml(dateString: string): string {
  return dateString.replace(/-/g, '');
}

// Generate XML for both National Criminal History and Evictions Check
export function generateVerificationXml(
  data: VerificationFormValues,
  accountDetails: { account: string, username: string, password: string }
): string {
  const { account, username, password } = accountDetails;
  const { firstName, lastName, ssn, dob, address, city, state, zip } = data;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<New_Order>
  <login>
    <account>${account}</account>
    <username>${username}</username>
    <password>${password}</password>
  </login>
  <mode>PROD</mode>
  <placeOrder>
    <subject>
      <name_first>${firstName}</name_first>
      <name_last>${lastName}</name_last>
      <ssn>${ssn}</ssn>
      <dob>${formatDateForXml(dob)}</dob>
      <address>${address}</address>
      <city>${city}</city>
      <state>${state}</state>
      <zip>${zip}</zip>
    </subject>
    <subOrder type="National" />
    <subOrder type="Evictions" />
  </placeOrder>
</New_Order>`;
}