/**
 * Accio Data Webhook Response Types
 * Based on docs/verificaiton/xml_result_receipt.txt
 *
 * These types represent the XML structure that Accio posts to our webhook
 * when background check results are ready.
 */

export interface AccioScreeningResults {
  login?: AccioLogin;
  clientInfo?: AccioClientInfo;
  accountInfo?: AccioAccountInfo;
  orderInfo?: AccioOrderInfo;
  completeOrder: AccioCompleteOrder[];
}

export interface AccioLogin {
  account: string;
  username: string;
  password: string;
}

export interface AccioClientInfo {
  company_name?: string;
  packageset?: string;
  primaryuser_contact_name?: string;
  primaryuser_contact_address?: string;
  primaryuser_contact_city?: string;
  primaryuser_contact_state?: string;
  primaryuser_contact_zip?: string;
  primaryuser_contact_telephone?: string;
  primaryuser_contact_fax?: string;
  primaryuser_contact_email?: string;
  report_format?: string;
}

export interface AccioAccountInfo {
  company_name?: string;
  packageset?: string;
  primaryuser_contact_name?: string;
  primaryuser_contact_address?: string;
  primaryuser_contact_city?: string;
  primaryuser_contact_state?: string;
  primaryuser_contact_zip?: string;
  primaryuser_contact_telephone?: string;
  primaryuser_contact_fax?: string;
  primaryuser_contact_email?: string;
  report_format?: string;
}

export interface AccioOrderInfo {
  packagename?: string;
  requester_name?: string;
  requester_phone?: string;
  requester_fax?: string;
  requester_email?: string;
  requester_billingdata?: string;
  requester_billingdata2?: string;
  requester_billingdata3?: string;
  requester_billingdata4?: string;
  requester_billingdata5?: string;
  requester_billingdata6?: string;
  requester_billingdata7?: string;
  requester_billingdata8?: string;
  requester_billingdata9?: string;
  requester_billingdata10?: string;
  ordernumber_changed_to?: string;
  time_applicant_completed?: string;
}

export interface AccioCompleteOrder {
  // Attributes
  number: string;           // Your order number (from placeOrder)
  remote_number: string;    // Accio's internal order ID
  isactive: 'Y' | 'S' | 'N';
  archived: 'Y' | 'N';
  reviewed: 'Y' | 'N';
  reference_number?: string;

  // Child elements
  time_ordered: string;     // YYYY-MM-DD HH:MM:SS
  time_filled: string;      // YYYY-MM-DD HH:MM:SS
  status?: string;
  order_state?: 'inprogress vendor' | 'inprogress candidate' | 'inprogress recruiter' | 'order confirmation' | 'order completion';
  reportURL: AccioReportURL;
  subject: AccioSubject;
  report_html_summary?: string;
  subOrder: AccioSubOrder[];
}

export interface AccioReportURL {
  HTML: string;
  PDF_Color: string;
  PDF_BW: string;
}

export interface AccioSubject {
  name_first: string;
  name_middle?: string;
  name_last: string;
  has_no_middle_name?: 'Y' | 'N' | 'U';
  name_suffix?: string;
  name_lastmaiden?: string;
  name_mother_maiden?: string;
  name_complete_mother?: string;
  name_complete_father?: string;
  ssn?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  dob?: string;              // YYYYMMDD
  email?: string;
  dlnum?: string;
  dlcountry?: string;        // 3 letter ISO alpha-3 country code
  dlstate?: string;
  intldlstate?: string;      // non-USA state/province
  race?: 'U' | 'A' | 'B' | 'H' | 'I';
  gender?: 'M' | 'F' | 'U' | '';
  phone_number?: string;
  citizenship_status?: string;
  city_of_birth?: string;
  country_of_birth?: string;
  state_of_birth?: string;
  passport_country?: string;
  jobstate?: string;
  jobcity?: string;
  jobzip?: string;
  FCRAPurpose?: string;
  employment_status?: string;
  ApplicantID?: string;
  RequisitionNumber?: string;
  managerName?: string;
  has_admitted_convictions?: 'Y' | 'N' | 'D';
  admitted_conviction_details?: string;
  position_requested?: string;
  drugscreen?: 'Y' | 'N';
  client_notes?: string;
  client_disposition?: string;
  alias?: AccioAlias[];
  prioraddress?: AccioPriorAddress[];
}

export interface AccioAlias {
  name_first?: string;
  name_middle?: string;
  name_last?: string;
  name_suffix?: string;
  namefreeform?: string;
}

export interface AccioPriorAddress {
  from: string;              // YYYYMMDD
  to: string;                // YYYYMMDD
  address: string;
  city: string;
  state: string;
  county?: string;
  zip: string;
}

export interface AccioSubOrder {
  // Attributes
  number: string;            // Your subOrder number (empty if not placed by XML)
  remote_number: string;     // Accio's internal subOrder ID (suborderID)
  held_for_review: 'Y' | 'N';
  held_for_release_form: 'Y' | 'N';
  filledStatus: AccioFilledStatus;
  filledCode: AccioFilledCode;
  type: AccioSubOrderType;
  description: string;

  // Child elements
  time_ordered: string;      // YYYY-MM-DD HH:MM:SS
  time_filled: string;       // YYYY-MM-DD HH:MM:SS
  fees?: AccioFees;

  // Criminal/Eviction specific
  case?: AccioCase[];
  county?: string;
  state?: string;
  years_conviction?: string;
  years_nonconviction?: string;
  searchtype?: 'felony' | 'misdemeanor' | 'both';
  notes_to_supplier?: string;
  datasources?: string;
}

export type AccioFilledStatus = 'filled' | 'unfilled' | 'in progress' | 'failed';

export type AccioFilledCode =
  | 'no hits'
  | 'hits'
  | 'clear'
  | 'unknown'
  | 'drugpositive'
  | 'drugnegative'
  | 'contact MRO'
  | 'labreject'
  | 'test-canceled'
  | 'unobtainable'
  | 'previous-positive'
  | 'pass'
  | 'fail';

export type AccioSubOrderType =
  | 'National Criminal'
  | 'National Criminal2'
  | 'evictions_check'
  | 'County_criminal'
  | 'AIM'                    // Address History Search
  | 'AIM2'                   // Address History Search second Source
  | 'add2crim7yr'            // Address history to 7 year county criminal
  | 'add2crim10yr'           // Address history to 10 year county criminal
  | 'add2statewidecrim7yr'   // Address history to 7 year statewide criminal
  | 'add2statewidecrim10yr'  // Address history to 10 year statewide criminal
  | 'CBSV'                   // Consent Based SSN verification with SSA
  | 'CDLIS'                  // Commercial Drivers' license verification
  | 'CDL_Employment_verification'
  | 'Civil_County_criminal_lower'
  | 'Civil_County_criminal_upper'
  | 'Credential_verification'
  | 'Credit'                 // Employment Credit Report
  | 'Credit_std'             // Standard Credit Report
  | 'Credit_tri'             // TriMerged Credit Report
  | 'Drug_screen'
  | 'Education_verification'
  | 'Employment_verification'
  | 'Everify'
  | 'GSA'                    // General Sanctions Administration
  | 'OIG'                    // Office of Inspector General
  | 'SDN'                    // Specially Designated Nationals
  | 'Sex_offender'
  | 'Sex_offender_multistate'
  | 'SSN_verification'
  | 'Statewide_criminal'
  | 'Statewide_civil'
  | 'Federal_criminal'
  | 'Federal_civil'
  | 'Federal_bankruptcy'
  | 'MVR'                    // Motor Vehicle Record
  | string;                  // Allow other types not listed

export interface AccioFees {
  addon?: string;
  adjustments?: string;
  adjustmentReason?: string;
  thirdparty?: string;
  taxes?: string;
}

export interface AccioCase {
  identified_by_name?: 'Y' | 'N';
  identified_by_dob?: 'Y' | 'N';
  identified_by_ssn?: 'Y' | 'N';
  identified_by_partial_ssn?: 'Y' | 'N';
  additional_identifiers?: string;
  case_comments?: string;
  case_number?: string;
  offense_date?: string;      // YYYYMMDD
  filing_date?: string;       // YYYYMMDD
  disposition_date?: string;  // YYYYMMDD
  pending_date?: string;      // YYYYMMDD
  source?: string;
  jurisdiction?: string;
  jurisdiction_state?: string;
  defendant?: AccioPerson;
  plaintiff?: AccioPerson;
  individual?: AccioPerson;
  chargeinfo?: AccioChargeInfo[];
  hidden?: 'Y' | 'N';
  preformatted_textblock?: string;
}

export interface AccioPerson {
  name_first?: string;
  name_middle?: string;
  name_last?: string;
  name_suffix?: string;
  dob?: string;              // YYYYMMDD
  dobfreeform?: string;      // Used when vendor sends non-YYYYMMDD format
  ssn?: string;
  gender?: string;
  race?: string;
  height?: string;
  weight?: string;
  haircolor?: string;
  eyecolor?: string;
  imageURL?: string;
  persontype?: 'P' | 'D' | 'I' | '';  // Plaintiff, Defendant, Individual, unknown
  address?: AccioAddress[];
  alias?: AccioAlias[];
}

export interface AccioAddress {
  address: string;
  city: string;
  state: string;
  county?: string;
  zip: string;
  from?: string;             // YYYYMMDD
  to?: string;               // YYYYMMDD
}

export interface AccioChargeInfo {
  charge?: string;
  statute?: string;
  charge_number?: string;
  crime_type?: string;        // e.g., "Felony", "Misdemeanor"
  disposition?: string;       // e.g., "Guilty", "Not Guilty"
  plea?: string;
  arrest_date_freeformat?: string;     // Preferred format MM/DD/YYYY
  sentencing_date_freeformat?: string;
  offense_date_freeformat?: string;
  filing_date_freeformat?: string;
  disposition_date_freeformat?: string;
  charge_comments?: string;
  sentence_comments?: string;
  sentencing?: AccioSentence[];
  additionalInfo?: AccioAdditionalInfo[];
  hidden?: 'Y' | 'N';
  preformatted_textblock?: string;
}

export interface AccioSentence {
  sentence_type?: string;     // e.g., "fine", "probation", "jail"
  date_active?: string;
  active_amount?: string;
  suspended_amount?: string;
  completed_amount?: string;
  sentenceitem_comments?: string;
}

export interface AccioAdditionalInfo {
  title: string;
  value: string;
}

/**
 * Helper type for parsing the webhook XML response.
 * The raw XML will be converted to this structure.
 */
export interface AccioWebhookPayload {
  ScreeningResults: AccioScreeningResults;
}

/**
 * Simplified result for our internal use.
 * Extracts just what we need from the full Accio response.
 */
export interface AccioSimplifiedResult {
  orderId: string;
  orderNumber: string;
  status: 'complete' | 'pending' | 'failed';
  subject: {
    firstName: string;
    lastName: string;
    ssn?: string;
    dob?: string;
  };
  nationalCriminal: {
    status: AccioFilledStatus;
    result: AccioFilledCode;
    heldForReview: boolean;
    cases: AccioCase[];
  } | null;
  evictions: {
    status: AccioFilledStatus;
    result: AccioFilledCode;
    heldForReview: boolean;
    cases: AccioCase[];
  } | null;
  reportUrls: {
    html: string;
    pdfColor: string;
    pdfBW: string;
  };
  timeOrdered: string;
  timeFilled: string;
}
