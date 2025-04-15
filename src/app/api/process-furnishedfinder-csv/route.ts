//import { NextRequest } from 'next/server';
//import { NextResponse } from 'next/server';
//import fs from 'fs';
//import path from 'path';
//import csv from 'csv-parser';
//import { createObjectCsvWriter } from 'csv-writer';
//
//const FF_DOMAIN = 'furnishedfinder.com';
//const UPLOAD_API = 'http://localhost:3000/api/uploadthing/direct?fileURL='; // Adjust if needed
//
//const CSV_INPUT = path.join(process.cwd(), 'Listings_with_Final_Bathroom_Estimates.csv');
//
//async function processCSV() {
//  return new Promise(async (resolve, reject) => {
//    const rows: any[] = [];
//    let checked = 0;
//    let changed = 0;
//    let headers: string[] = [];
//
//    try {
//      await new Promise((res, rej) => {
//        fs.createReadStream(CSV_INPUT)
//          .pipe(csv())
//          .on('headers', (hdrs: string[]) => {
//            headers = hdrs;
//          })
//          .on('data', (row: any) => {
//            rows.push(row);
//          })
//          .on('end', res)
//          .on('error', rej);
//      });
//
//      // Helper for delay
//      const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
//      // Set up the CSV writer once
//      const csvWriter = createObjectCsvWriter({
//        path: CSV_INPUT,
//        header: headers.map(h => ({ id: h, title: h })),
//      });
//      // Helper to sanitize a row before writing to CSV
//      function sanitizeRow(row: any, rowIndex: number) {
//        const sanitized: any = {};
//        for (const key of Object.keys(row)) {
//          const val = row[key];
//          if (
//            typeof val === 'string' ||
//            typeof val === 'number' ||
//            typeof val === 'boolean' ||
//            val === null ||
//            val === undefined
//          ) {
//            sanitized[key] = val;
//          } else {
//            // Log and replace with empty string
//            console.error(`[CSV-SANITIZE] Row ${rowIndex}, key "${key}" has invalid value`, val);
//            sanitized[key] = '';
//          }
//        }
//        return sanitized;
//      }
//
//      for (let i = 0; i < rows.length; i++) {
//        const row = rows[i];
//        for (const key of Object.keys(row)) {
//          const val = row[key];
//          let oldUrl = val;
//          let newUrl = val;
//          let wasChanged = false;
//          if (typeof val === 'string' && val.includes(FF_DOMAIN)) {
//            checked++;
//            try {
//              const apiUrl = `${UPLOAD_API}${encodeURIComponent(val)}`;
//              const res = await fetch(apiUrl);
//              console.log("[FF-UPLOAD] Response:", res);
//              const data = await res.json();
//              console.log("[FF-UPLOAD] Data:", data);
//              const uploadedUrl = data?.data?.url;
//              if (res.ok && uploadedUrl && uploadedUrl !== oldUrl) {
//                row[key] = uploadedUrl;
//                newUrl = uploadedUrl;
//                changed++;
//                wasChanged = true;
//                console.log('[FF-UPDATE] row[key] after update:', row[key]);
//                console.log('[FF-UPDATE] full row after update:', row);
//                // Write CSV immediately after a change, with sanitized rows
//                const sanitizedRows = rows.map((row, idx) => sanitizeRow(row, idx));
//                await csvWriter.writeRecords(sanitizedRows);
//              } else {
//                newUrl = oldUrl;
//                if (!res.ok) {
//                  console.error('[FF-UPLOAD-ERROR]', {
//                    status: res.status,
//                    statusText: res.statusText,
//                    response: data,
//                    url: apiUrl,
//                  });
//                }
//              }
//            } catch (err) {
//              console.log("[FF-UPLOAD-ERROR]", err)
//              newUrl = oldUrl;
//            }
//            // Log with labels
//            console.log('[FF-CHECK] old:', oldUrl, '| new:', row[key], '| checked:', checked, '| changed:', changed);
//            // Wait 1000ms between each image
//            await delay(1000);
//          } else {
//            checked++;
//            // Log with labels, no change
//            console.log('[FF-SKIP] old:', oldUrl, '| new:', newUrl, '| checked:', checked, '| changed:', changed);
//          }
//        }
//      }
//
//      // Final log and resolve
//      console.log(`FurnishedFinder CSV processing complete. Checked: ${checked}, Changed: ${changed}`);
//      resolve({ checked, changed });
//    } catch (err) {
//      reject(err);
//    }
//  });
//}
//
//export async function GET(req: NextRequest) {
//  try {
//    const { checked, changed } = await processCSV();
//    return NextResponse.json({ success: true, checked, changed });
//  } catch (err: any) {
//    return NextResponse.json({ success: false, error: err.message || 'Unknown error' }, { status: 500 });
//  }
//}
