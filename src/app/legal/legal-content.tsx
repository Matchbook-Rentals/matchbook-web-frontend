"use client";

import Link from "next/link";

const legalDocuments = [
  {
    title: "Terms of Service",
    url: "/terms-of-service",
    description: "Our terms and conditions for using Matchbook services"
  },
  {
    title: "Privacy Policy",
    url: "/privacy-policy",
    description: "How we collect, use, and protect your personal information"
  },
  {
    title: "Cookie Notice",
    url: "/cookie-notice",
    description: "Information about our use of cookies and tracking technologies"
  },
  {
    title: "Cookie Policy",
    url: "/cookie-policy",
    description: "Detailed policy on our cookie usage and your choices"
  },
  {
    title: "California Privacy Notice",
    url: "/california-privacy-notice",
    description: "Privacy notice for California residents and other states"
  },
  {
    title: "Acceptable Use Policy",
    url: "/acceptable-use-policy",
    description: "Guidelines for appropriate use of our platform"
  },
  {
    title: "Host FCRA Compliance",
    url: "/host-fcra-compliance",
    description: "Fair Credit Reporting Act compliance information for hosts"
  }
];

export function LegalContent() {
  return (
    <div className="space-y-6">
      <p className="mb-8" style={{
        color: '#373940',
        fontFamily: 'Poppins',
        fontSize: '16px',
        fontWeight: 400,
        lineHeight: '1.6'
      }}>
        Welcome to our legal documents center. Here you can find all of our important legal documents, policies, and compliance information.
      </p>

      <div className="grid gap-4 md:gap-6">
        {legalDocuments.map((doc) => (
          <div
            key={doc.url}
            className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
            style={{ borderRadius: '12px' }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="mb-2" style={{
                  color: '#373940',
                  fontFamily: 'Poppins',
                  fontSize: '18px',
                  fontWeight: 500,
                  lineHeight: 'normal'
                }}>
                  {doc.title}
                </h3>
                <p className="mb-4" style={{
                  color: '#6B7280',
                  fontFamily: 'Poppins',
                  fontSize: '14px',
                  fontWeight: 400,
                  lineHeight: '1.5'
                }}>
                  {doc.description}
                </p>
              </div>
              <Link
                href={doc.url}
                className="inline-flex items-center px-4 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  fontFamily: 'Poppins',
                  fontSize: '14px',
                  fontWeight: 500,
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#E5E7EB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                }}
              >
                View Document →
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 rounded-lg" style={{ backgroundColor: '#F9FAFB' }}>
        <p style={{
          color: '#6B7280',
          fontFamily: 'Poppins',
          fontSize: '13px',
          fontWeight: 400,
          lineHeight: '1.5'
        }}>
          <strong>Note:</strong> These legal documents are regularly updated to reflect changes in our services and applicable laws. Please review them periodically to stay informed about your rights and responsibilities.
        </p>
      </div>
    </div>
  );
}