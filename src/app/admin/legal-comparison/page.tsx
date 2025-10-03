import { ComparisonClient } from "./comparison-client";
import fs from "fs";
import path from "path";

export default function LegalComparisonPage() {
  // Read HTML files on the server
  const legalDir = path.join(process.cwd(), "src", "legal");

  const termsHtml = fs.readFileSync(
    path.join(legalDir, "terms-of-service-09-24-25.html"),
    "utf-8"
  );
  const privacyHtml = fs.readFileSync(
    path.join(legalDir, "privacy-policy-09-10-25.html"),
    "utf-8"
  );
  const fcraHtml = fs.readFileSync(
    path.join(legalDir, "fcra-09-23-25.html"),
    "utf-8"
  );
  const cookieHtml = fs.readFileSync(
    path.join(legalDir, "cookie-policy-09-10-25.html"),
    "utf-8"
  );
  const ccpaHtml = fs.readFileSync(
    path.join(legalDir, "california-privacy-notice.html"),
    "utf-8"
  );

  const htmlContent = {
    terms: termsHtml,
    privacy: privacyHtml,
    fcra: fcraHtml,
    cookie: cookieHtml,
    ccpa: ccpaHtml,
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Legal Documents Comparison</h1>
        <p className="text-gray-600">
          Compare current React versions with new HTML versions side-by-side
        </p>
      </div>

      <ComparisonClient htmlContent={htmlContent} />
    </div>
  );
}
