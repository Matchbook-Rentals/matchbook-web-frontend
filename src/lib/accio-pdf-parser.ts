/**
 * Accio PDF Parser
 *
 * Fetches background check results as PDF from Accio and extracts eviction case details.
 * The XML response only contains hits/clear status for evictions, but the PDF has full case details.
 */

const ACCIO_URL = "https://globalbackgroundscreening.bgsecured.com/c/p/researcherxml";

interface AccioCredentials {
  account: string;
  username: string;
  password: string;
}

export interface ParsedEvictionRecord {
  caseNumber: string;
  defendant?: string;
  defendantAddress?: string;
  plaintiff?: string;
  judgmentAmount?: number;
  filingDate?: string;      // YYYY-MM-DD format
  dispositionDate?: string; // YYYY-MM-DD format
  disposition?: string;
  court?: string;
}

interface PdfFetchResult {
  success: boolean;
  pdfBuffer?: Buffer;
  error?: string;
}

interface ParseResult {
  success: boolean;
  evictionRecords: ParsedEvictionRecord[];
  rawText?: string;
  error?: string;
}

/**
 * Fetch PDF results from Accio for a given order
 */
export async function fetchAccioPdf(
  orderId: string,
  credentials: AccioCredentials
): Promise<PdfFetchResult> {
  const xmlRequest = `<?xml version="1.0" encoding="UTF-8"?>
<XML>
  <login>
    <account>${credentials.account}</account>
    <username>${credentials.username}</username>
    <password>${credentials.password}</password>
  </login>
  <getOrderResults orderID="${orderId}" format="pdf" />
</XML>`;

  try {
    const response = await fetch(ACCIO_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml",
      },
      body: xmlRequest,
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const responseText = await response.text();

    // Extract base64 PDF data from XML response
    const pdfMatch = responseText.match(/<pdfresults[^>]*>([\s\S]*?)<\/pdfresults>/);
    if (!pdfMatch || !pdfMatch[1]) {
      return {
        success: false,
        error: "No PDF data found in response",
      };
    }

    // Decode base64 to buffer
    const base64Data = pdfMatch[1].trim();
    const pdfBuffer = Buffer.from(base64Data, 'base64');

    return {
      success: true,
      pdfBuffer,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error fetching PDF",
    };
  }
}

/**
 * Parse date from various formats to YYYY-MM-DD
 */
function parseDate(dateStr: string): string | undefined {
  if (!dateStr) return undefined;

  // Try MM/DD/YYYY format
  const mmddyyyy = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (mmddyyyy) {
    const [, month, day, year] = mmddyyyy;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return undefined;
}

/**
 * Parse eviction records from Accio PDF text
 *
 * The PDF has a specific multi-column layout:
 * ```
 *      Case Number      20D12681
 *        Defendant      DANTE BLACKWOOD
 *                       751 N INDIAN CREEK DR 362 CLARKSTON, GA
 * Defendant Address
 *                       30021
 *             Plaintif HAMMOND RESIDENTIAL GROUP
 * Judgment Amount 7267
 *        Filing Date 10/08/2020
 *   Disposition Date 05/12/2021
 *        Disposition JUDGEMENT WITH RESTITUTION OF PREMISES
 *                     DEKALB COUNTY MAGISTRATE COURT - DE-
 * Case Comments
 *                     CATUR
 * ```
 */
export function parseEvictionRecordsSimple(text: string): ParsedEvictionRecord[] {
  const records: ParsedEvictionRecord[] = [];

  // Find the evictions section with actual Court Records (not the summary reference)
  // The actual section has "Court Records (N Records Found)" in it
  const evictionsSection = text.match(/Evictions and Property Damage[^\n]*HITS[\s\S]*?Court Records[\s\S]*?(?=Prior Inquiries|Tenant Account|Supplemental Records)/i);
  if (!evictionsSection) {
    console.log('[PDF Parser] No evictions section with court records found');
    return records;
  }

  const section = evictionsSection[0];
  console.log('[PDF Parser] Found evictions section, length:', section.length);

  // Find all case numbers in evictions section
  const caseNumberRegex = /Case Number\s+(\S+)/gi;
  const caseMatches = Array.from(section.matchAll(caseNumberRegex));

  if (caseMatches.length === 0) {
    console.log('[PDF Parser] No case numbers found in evictions section');
    return records;
  }

  console.log(`[PDF Parser] Found ${caseMatches.length} eviction case(s)`);

  // For each case, parse the fields
  for (let i = 0; i < caseMatches.length; i++) {
    const caseNumber = caseMatches[i][1];
    const startIdx = caseMatches[i].index!;
    const endIdx = caseMatches[i + 1]?.index || section.length;
    const caseSection = section.slice(startIdx, endIdx);

    // Skip criminal cases - eviction cases have "Plaintif" in them
    if (!caseSection.includes('Plaintif')) {
      console.log(`[PDF Parser] Skipping case ${caseNumber} - not an eviction (no plaintiff)`);
      continue;
    }

    const record: ParsedEvictionRecord = {
      caseNumber,
    };

    // Extract defendant name - line after "Defendant" with the name
    const defendantMatch = caseSection.match(/Defendant\s+([A-Z][A-Z\s]+?)(?=\s*\n)/i);
    if (defendantMatch) record.defendant = defendantMatch[1].trim();

    // Extract address - between "Defendant Address" and "Plaintif"
    // Format varies: may be on same line or split across lines
    const addressMatch = caseSection.match(/Defendant Address\s+([\s\S]+?)(?=Plaintif)/i);
    if (addressMatch) {
      const addr = addressMatch[1]
        .replace(/\n/g, ' ')      // Join lines
        .replace(/\s{2,}/g, ' ')  // Normalize spaces
        .trim();
      if (addr) record.defendantAddress = addr;
    }

    // Extract plaintiff
    const plaintiffMatch = caseSection.match(/Plaintif[f]?\s+([A-Z][^\n]+)/i);
    if (plaintiffMatch) record.plaintiff = plaintiffMatch[1].trim();

    // Extract judgment amount
    const judgmentMatch = caseSection.match(/Judgment Amount\s+(\d+(?:\.\d{2})?)/i);
    if (judgmentMatch) record.judgmentAmount = parseFloat(judgmentMatch[1]);

    // Extract filing date
    const filingMatch = caseSection.match(/Filing Date\s+(\d{1,2}\/\d{1,2}\/\d{4})/i);
    if (filingMatch) record.filingDate = parseDate(filingMatch[1]);

    // Extract disposition date
    const dispDateMatch = caseSection.match(/Disposition Date\s+(\d{1,2}\/\d{1,2}\/\d{4})/i);
    if (dispDateMatch) record.dispositionDate = parseDate(dispDateMatch[1]);

    // Extract disposition text - after "Disposition Date" line, before court info
    // Look for text after the last date that starts with capital letters
    const dispMatch = caseSection.match(/Disposition\s+([A-Z][A-Z\s]+?)(?=\s+[A-Z]+\s+COUNTY|\n\s*Case Comments|$)/im);
    if (dispMatch) record.disposition = dispMatch[1].trim();

    // Extract court - it's split: "DEKALB COUNTY MAGISTRATE COURT - DE-" then "CATUR"
    // Look for COUNTY pattern and collect until Case Comments ends
    const courtMatch = caseSection.match(/([A-Z]+\s+COUNTY[^\n]+(?:\n\s*Case Comments)?\s*\n\s*([A-Z]+))/i);
    if (courtMatch) {
      let court = courtMatch[0]
        .replace(/Case Comments/gi, '')
        .replace(/\n\s+/g, '')     // Join lines
        .replace(/\s{2,}/g, ' ')   // Normalize spaces
        .replace(/(\w)-\s*(\w)/g, '$1$2')  // Fix split words: "DE-CATUR" or "DE- CATUR" -> "DECATUR"
        .trim();
      record.court = court;
    }

    records.push(record);
    console.log(`[PDF Parser] Parsed eviction case ${caseNumber}:`, record);
  }

  return records;
}

/**
 * Main function: Fetch PDF from Accio and extract eviction records
 */
export async function fetchAndParseEvictionRecords(
  orderId: string,
  credentials: AccioCredentials
): Promise<ParseResult> {
  console.log(`[PDF Parser] Fetching PDF for order ${orderId}`);

  // Fetch the PDF
  const pdfResult = await fetchAccioPdf(orderId, credentials);
  if (!pdfResult.success || !pdfResult.pdfBuffer) {
    return {
      success: false,
      evictionRecords: [],
      error: pdfResult.error || "Failed to fetch PDF",
    };
  }

  console.log(`[PDF Parser] PDF fetched, size: ${pdfResult.pdfBuffer.length} bytes`);

  try {
    // Extract text from PDF using pdf-parse v2 API
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: pdfResult.pdfBuffer });
    const pdfData = await parser.getText();
    const text = pdfData.text;

    console.log(`[PDF Parser] Extracted ${text.length} characters from PDF`);

    // Parse eviction records using the simple approach
    const evictionRecords = parseEvictionRecordsSimple(text);

    return {
      success: true,
      evictionRecords,
      rawText: text,
    };
  } catch (error) {
    return {
      success: false,
      evictionRecords: [],
      error: error instanceof Error ? error.message : "Failed to parse PDF",
    };
  }
}
