/**
 * iSoftPull API Response Types
 * Generated from real API response
 */

export interface ISoftPullApplicant {
  first_name: string;
  middle_name: string | null;
  last_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  date_of_birth: string | null;
  ssn: string;
  email: string | null;
  phone: string | null;
}

export interface ISoftPullIntelligence {
  /** Credit bucket name: "Execeptional", "good", "fair", "poor", etc. (note: API has typo "Execeptional") */
  name: string;
  /** Result status: "passed", "No offers matched", etc. */
  result: string;
  /** Credit score status: "failed" or actual score */
  credit_score: string;
}

export interface ISoftPullEquifaxReport {
  status: "success" | "failed" | string;
  message: string;
  ofac: unknown | null;
  identity_scan: unknown | null;
  truvalidate: unknown | null;
  fraud_shield: unknown | null;
}

export interface ISoftPullReports {
  /** Link to view the full report on iSoftPull */
  link: string;
  equifax: ISoftPullEquifaxReport;
}

export interface ISoftPullResponse {
  applicant: ISoftPullApplicant;
  intelligence: ISoftPullIntelligence;
  reports: ISoftPullReports;
}
