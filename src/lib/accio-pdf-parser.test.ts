/**
 * Tests for Accio PDF Parser
 *
 * Uses the saved PDF at docs/accio/order-24776-report.pdf instead of hitting the Accio API.
 * Known eviction record (Dante Blackwood, order 24776):
 * - Case Number: 20D12681
 * - Plaintiff: HAMMOND RESIDENTIAL GROUP
 * - Judgment: $7,267
 * - Filing: 2020-10-08
 * - Disposition Date: 2021-05-12
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFile } from 'fs/promises';
import path from 'path';
import {
  parseEvictionRecordsSimple,
  fetchAccioPdf,
  fetchAndParseEvictionRecords,
  type ParsedEvictionRecord,
} from './accio-pdf-parser';

// Test credentials (not used for actual API calls in tests)
const TEST_CREDENTIALS = {
  account: 'test',
  username: 'test',
  password: 'test',
};

// Load the saved PDF for testing
const loadTestPdf = async (): Promise<Buffer> => {
  const pdfPath = path.join(process.cwd(), 'docs/accio/order-24776-report.pdf');
  return readFile(pdfPath);
};

// Extract text from PDF for unit testing the parser
const extractPdfText = async (): Promise<string> => {
  const pdfBuffer = await loadTestPdf();
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: pdfBuffer });
  const result = await parser.getText();
  return result.text;
};

describe('accio-pdf-parser', () => {
  describe('parseEvictionRecordsSimple', () => {
    let pdfText: string;

    beforeEach(async () => {
      pdfText = await extractPdfText();
    });

    it('should extract eviction record from PDF text', () => {
      const records = parseEvictionRecordsSimple(pdfText);

      expect(records.length).toBeGreaterThanOrEqual(1);
    });

    it('should extract correct case number', () => {
      const records = parseEvictionRecordsSimple(pdfText);

      const evictionRecord = records.find(r => r.caseNumber === '20D12681');
      expect(evictionRecord).toBeDefined();
    });

    it('should extract defendant name', () => {
      const records = parseEvictionRecordsSimple(pdfText);
      const record = records.find(r => r.caseNumber === '20D12681');

      expect(record?.defendant).toContain('DANTE BLACKWOOD');
    });

    it('should extract plaintiff', () => {
      const records = parseEvictionRecordsSimple(pdfText);
      const record = records.find(r => r.caseNumber === '20D12681');

      expect(record?.plaintiff).toContain('HAMMOND RESIDENTIAL GROUP');
    });

    it('should parse judgment amount as number', () => {
      const records = parseEvictionRecordsSimple(pdfText);
      const record = records.find(r => r.caseNumber === '20D12681');

      expect(record?.judgmentAmount).toBe(7267);
    });

    it('should convert filing date to YYYY-MM-DD', () => {
      const records = parseEvictionRecordsSimple(pdfText);
      const record = records.find(r => r.caseNumber === '20D12681');

      expect(record?.filingDate).toBe('2020-10-08');
    });

    it('should convert disposition date to YYYY-MM-DD', () => {
      const records = parseEvictionRecordsSimple(pdfText);
      const record = records.find(r => r.caseNumber === '20D12681');

      expect(record?.dispositionDate).toBe('2021-05-12');
    });

    it('should extract disposition text', () => {
      const records = parseEvictionRecordsSimple(pdfText);
      const record = records.find(r => r.caseNumber === '20D12681');

      expect(record?.disposition).toContain('JUDGEMENT');
    });

    it('should extract court name', () => {
      const records = parseEvictionRecordsSimple(pdfText);
      const record = records.find(r => r.caseNumber === '20D12681');

      expect(record?.court).toContain('DEKALB');
      expect(record?.court).toContain('MAGISTRATE');
    });

    it('should return empty array for text without evictions section', () => {
      const textWithoutEvictions = 'Some random text without any eviction records';
      const records = parseEvictionRecordsSimple(textWithoutEvictions);

      expect(records).toEqual([]);
    });
  });

  describe('fetchAccioPdf', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
      vi.stubGlobal('fetch', originalFetch);
    });

    it('should decode base64 PDF from XML response', async () => {
      const pdfBuffer = await loadTestPdf();
      const base64Pdf = pdfBuffer.toString('base64');

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        text: async () => `<?xml version="1.0"?>
          <response>
            <pdfresults>${base64Pdf}</pdfresults>
          </response>`,
      } as Response);

      const result = await fetchAccioPdf('24776', TEST_CREDENTIALS);

      expect(result.success).toBe(true);
      expect(result.pdfBuffer).toBeDefined();
      expect(result.pdfBuffer?.length).toBe(pdfBuffer.length);
    });

    it('should return error on HTTP failure', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      const result = await fetchAccioPdf('24776', TEST_CREDENTIALS);

      expect(result.success).toBe(false);
      expect(result.error).toContain('401');
    });

    it('should return error when pdfresults missing', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        text: async () => '<response><error>No data</error></response>',
      } as Response);

      const result = await fetchAccioPdf('24776', TEST_CREDENTIALS);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No PDF data');
    });

    it('should return error on network failure', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const result = await fetchAccioPdf('24776', TEST_CREDENTIALS);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('fetchAndParseEvictionRecords', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
      vi.stubGlobal('fetch', originalFetch);
    });

    it('should parse saved PDF and extract correct eviction record', async () => {
      const pdfBuffer = await loadTestPdf();
      const base64Pdf = pdfBuffer.toString('base64');

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        text: async () => `<?xml version="1.0"?>
          <response>
            <pdfresults>${base64Pdf}</pdfresults>
          </response>`,
      } as Response);

      const result = await fetchAndParseEvictionRecords('24776', TEST_CREDENTIALS);

      expect(result.success).toBe(true);
      expect(result.evictionRecords.length).toBeGreaterThanOrEqual(1);

      const eviction = result.evictionRecords.find(r => r.caseNumber === '20D12681');
      expect(eviction).toBeDefined();
      expect(eviction?.plaintiff).toContain('HAMMOND');
      expect(eviction?.judgmentAmount).toBe(7267);
      expect(eviction?.filingDate).toBe('2020-10-08');
    });

    it('should return rawText from PDF', async () => {
      const pdfBuffer = await loadTestPdf();
      const base64Pdf = pdfBuffer.toString('base64');

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        text: async () => `<response><pdfresults>${base64Pdf}</pdfresults></response>`,
      } as Response);

      const result = await fetchAndParseEvictionRecords('24776', TEST_CREDENTIALS);

      expect(result.rawText).toBeDefined();
      expect(result.rawText?.length).toBeGreaterThan(1000);
    });

    it('should return error when PDF fetch fails', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
      } as Response);

      const result = await fetchAndParseEvictionRecords('24776', TEST_CREDENTIALS);

      expect(result.success).toBe(false);
      expect(result.evictionRecords).toEqual([]);
    });
  });
});
