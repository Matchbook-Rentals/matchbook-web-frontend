'use client';

import { Button } from "@/components/ui/button";

export default function PaymentsSection() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Payments</h2>
        <Button
          variant="outline"
          className="border-teal-600 text-teal-600 hover:bg-teal-50"
        >
          Manage Payments
        </Button>
      </div>

      {/* Payments Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Host</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Type</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Method</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Bank</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Due Date</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {[1, 2, 3, 4].map((item) => (
              <tr key={item} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">Daniel Resner</td>
                <td className="px-6 py-4 text-sm text-gray-900">2,350.30</td>
                <td className="px-6 py-4 text-sm text-gray-900">Deposit Return</td>
                <td className="px-6 py-4 text-sm text-gray-900">Bank Transfer</td>
                <td className="px-6 py-4 text-sm text-gray-900">Chase</td>
                <td className="px-6 py-4 text-sm text-gray-900">02/15/2025</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-50 text-teal-700 border border-teal-200">
                    Scheduled
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-gray-600 hover:text-gray-900">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
