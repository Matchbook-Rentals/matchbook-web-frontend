//// Node.js script to process a CSV, upload Furnished Finder image URLs, and replace them with the uploaded URLs.
//// Usage: node scripts/process-furnishedfinder-csv.js <input.csv> <output.csv>
//
//const fs = require('fs');
//const path = require('path');
//const csv = require('csv-parser');
//const createCsvWriter = require('csv-writer').createObjectCsvWriter;
//const fetch = require('node-fetch');
//
//const FF_DOMAIN = 'furnishedfinder.com';
//const UPLOAD_API = 'http://localhost:3000/api/uploadthing/direct?fileURL='; // Adjust host/port as needed
//
//async function processCSV(inputPath, outputPath) {
//  return new Promise((resolve, reject) => {
//    const rows = [];
//    let checked = 0;
//    let changed = 0;
//    let headers = null;
//
//    fs.createReadStream(inputPath)
//      .pipe(csv())
//      .on('headers', (hdrs) => {
//        headers = hdrs;
//      })
//      .on('data', (row) => {
//        rows.push(row);
//      })
//      .on('end', async () => {
//        for (let i = 0; i < rows.length; i++) {
//          const row = rows[i];
//          for (const key of Object.keys(row)) {
//            const val = row[key];
//            if (typeof val === 'string' && val.includes(FF_DOMAIN)) {
//              checked++;
//              try {
//                const apiUrl = `${UPLOAD_API}${encodeURIComponent(val)}`;
//                const res = await fetch(apiUrl);
//                const data = await res.json();
//                if (res.ok && data.url) {
//                  row[key] = data.url;
//                  changed++;
//                  console.log(`Row ${i}, column '${key}': replaced ${val} with ${data.url}`);
//                } else {
//                  console.warn(`Row ${i}, column '${key}': upload failed. Reason: ${data.error || 'unknown'}`);
//                }
//              } catch (err) {
//                console.error(`Row ${i}, column '${key}': upload error`, err);
//              }
//            }
//          }
//        }
//        // Write output CSV
//        const csvWriter = createCsvWriter({
//          path: outputPath,
//          header: headers.map(h => ({ id: h, title: h })),
//        });
//        await csvWriter.writeRecords(rows);
//        console.log(`Done. Checked: ${checked}, Changed: ${changed}`);
//        resolve({ checked, changed });
//      })
//      .on('error', reject);
//  });
//}
//
//if (require.main === module) {
//  const [,, input, output] = process.argv;
//  if (!input || !output) {
//    console.error('Usage: node scripts/process-furnishedfinder-csv.js <input.csv> <output.csv>');
//    process.exit(1);
//  }
//  processCSV(input, output).catch(err => {
//    console.error('Failed:', err);
//    process.exit(1);
//  });
//}
//
//module.exports = { processCSV };
