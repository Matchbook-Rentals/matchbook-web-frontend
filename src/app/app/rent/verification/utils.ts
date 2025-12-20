import { z } from "zod";

// Single combined schema for verification form
export const verificationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  ssn: z.string().regex(/^\d{9}$/, "SSN must be 9 digits"),
  dob: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine((dateStr) => {
      const dob = new Date(dateStr);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      const dayDiff = today.getDate() - dob.getDate();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
      return actualAge >= 18;
    }, "Must be 18 or older for Verification"),
  address: z.string().min(3, "Address is required and must be at least 3 characters"),
  city: z.string().min(2, "City is required and must be at least 2 characters"),
  state: z.string().min(2, "State is required"),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Zip code must be in format 12345 or 12345-6789"),
  creditAuthorizationAcknowledgment: z.boolean().refine(val => val === true, {
    message: "You must authorize the credit report to continue"
  }),
  backgroundCheckAuthorization: z.boolean().refine(val => val === true, {
    message: "You must authorize the background check to continue"
  }),
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

  // Create a unique order ID for tracking
  const orderId = `MBWEB-${Date.now().toString().slice(-8)}`;

  // Use NEXT_PUBLIC_BASE_URL for webhook callback
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://matchbookrentals.com';
  const postbackUrl = `${baseUrl}/api/background-check-webhook`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<New_Order>
  <login>
    <account>${account}</account>
    <username>${username}</username>
    <password>${password}</password>
  </login>
  <mode>PROD</mode>
  <placeOrder number="${orderId}">
    <postBackInfo>
      <authentication>
        <type>Basic</type>
        <username>${username}</username>
        <password>${password}</password>
      </authentication>
      <URL>${postbackUrl}</URL>
      <guID>${orderId}</guID>
      <postback_types>ICR::OCR</postback_types>
    </postBackInfo>
    <subject>
      <name_first>${firstName}</name_first>
      <name_last>${lastName}</name_last>
      <ssn>${ssn}</ssn>
      <dob>${formatDateForXml(dob)}</dob>
      <address>${address}</address>
      <city>${city}</city>
      <state>${state}</state>
      <zip>${zip}</zip>
      <email>verification@matchbookrentals.com</email>
      <phone>555-123-4567</phone>
    </subject>
    <package>Criminal and Evictions</package>
    <subOrder type="National Criminal"/>
    <subOrder type="evictions_check">
      <state>${state}</state>
    </subOrder>
  </placeOrder>
</New_Order>`;
}
