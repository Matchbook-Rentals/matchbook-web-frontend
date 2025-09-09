'use client';

import { MatchWithRelations } from '@/types';
import { CheckCircle, MapPin, Users, Home, PawPrint, ChevronDown, Download, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { calculatePayments } from '@/lib/calculate-payments';
import { calculateTotalWithStripeCardFee } from '@/lib/fee-constants';
import { PAGE_MARGIN } from '@/constants/styles';

interface CompleteClientProps {
  match: MatchWithRelations;
  matchId: string;
  isAdminDev?: boolean;
}

const DownloadableDocumentsSection = ({ match }: { match: MatchWithRelations }) => {
  // Define available documents
  const documents = [
    {
      name: 'Signed Lease Agreement',
      icon: FileText,
      alt: 'Lease document',
      available: !!match.leaseDocumentId,
      downloadUrl: match.leaseDocumentId ? `/api/documents/${match.leaseDocumentId}/view?download=true` : null
    },
    // {
    //   name: 'Payment Receipt',
    //   icon: FileText,
    //   alt: 'Payment receipt',
    //   available: !!match.paymentCapturedAt,
    //   downloadUrl: null // Receipt generation endpoint to be implemented
    // },
    // {
    //   name: 'Move-in Checklist',
    //   icon: FileText,
    //   alt: 'Move-in checklist',
    //   available: false, // To be implemented
    //   downloadUrl: null
    // }
  ];

  const handleDownload = (url: string | null, documentName: string) => {
    if (url) {
      // Create a temporary link and click it to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = documentName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.log(`Download not available for ${documentName}`);
    }
  };

  return (
    <section className="flex flex-col items-start justify-center gap-6 relative self-stretch w-full flex-[0_0_auto]">
      <h2 className="relative self-stretch mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#373940] text-2xl tracking-[0.15px] leading-[normal]">
        Downloadable Documents
      </h2>

      {documents.map((document, index) => {
        const IconComponent = document.icon;
        return (
          <Card
            key={index}
            className={`relative self-stretch w-full flex-[0_0_auto] bg-[#0a606014] rounded-lg border border-solid border-[#e6e6e6] ${
              document.available ? 'cursor-pointer hover:bg-[#0a606020]' : 'opacity-50'
            }`}
            onClick={() => document.available && handleDownload(document.downloadUrl, document.name)}
          >
            <CardContent className="flex items-center gap-3 px-5 py-4">
              <IconComponent className="relative w-10 h-10 text-[#484a54]" />

              <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-[#484a54] text-xl tracking-[0] leading-[normal]">
                {document.name}
                {!document.available && (
                  <span className="text-sm text-gray-400 ml-2">(Coming soon)</span>
                )}
              </div>

              {document.available && (
                <Download className="relative w-8 h-8 text-[#484a54]" />
              )}
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
};

const ConfirmationMessageSection = () => {
  return (
    <section className="flex flex-col items-center justify-center gap-5 relative self-stretch w-full flex-[0_0_auto]">
      <CheckCircle className="w-20 h-20 text-green-600" />

      <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
        <h1 className="relative self-stretch mt-[-1.00px] [font-family:'Poppins',Helvetica] font-bold text-blackblack-500 text-[28px] text-center tracking-[0] leading-[33.6px]">
          BOOKING CONFIRMED!
        </h1>

        <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-[#333333] text-base text-center tracking-[0] leading-[19.2px]">
          Thank you, your lease has been signed and payment has been processed
          successfully.
        </p>
      </div>
    </section>
  );
};

const PaymentSummarySection = ({ match }: { match: MatchWithRelations }) => {
  // Calculate payment details
  const paymentDetails = calculatePayments({
    listing: match.listing,
    trip: match.trip,
    monthlyRentOverride: match.monthlyRent
  });

  // Fixed transfer fee
  const TRANSFER_FEE = 5;

  // Determine if card was used (simplified check)
  const isCardPayment = !!match.stripePaymentMethodId;
  
  // Calculate base amount (deposits + transfer fee)
  const baseAmount = paymentDetails.totalDeposit + TRANSFER_FEE;
  
  // Calculate credit card fee if applicable
  let creditCardFee = 0;
  let totalAmount = baseAmount;
  
  if (isCardPayment) {
    totalAmount = calculateTotalWithStripeCardFee(baseAmount);
    creditCardFee = totalAmount - baseAmount;
  }

  // Build payment items array
  const paymentItems = [
    {
      label: 'Security Deposit',
      amount: `$${paymentDetails.securityDeposit.toFixed(2)}`,
      hasChevron: false,
      isIndented: false,
      isMain: true
    },
    ...(paymentDetails.petDeposit > 0 ? [{
      label: 'Pet Deposit',
      amount: `$${paymentDetails.petDeposit.toFixed(2)}`,
      hasChevron: false,
      isIndented: false,
      isMain: false
    }] : []),
    {
      label: 'Transfer Fee',
      amount: `$${TRANSFER_FEE.toFixed(2)}`,
      hasChevron: false,
      isIndented: false,
      isMain: false
    },
    ...(isCardPayment && creditCardFee > 0 ? [{
      label: 'Credit Card Processing Fee',
      amount: `$${creditCardFee.toFixed(2)}`,
      hasChevron: false,
      isIndented: false,
      isMain: false
    }] : []),
    {
      label: 'Total Paid',
      amount: `$${totalAmount.toFixed(2)}`,
      hasChevron: false,
      isIndented: false,
      isMain: true
    }
  ];

  return (
    <section className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
      <h2 className="self-stretch font-medium text-[#373940] text-2xl tracking-[0.15px] leading-[normal] relative mt-[-1.00px] [font-family:'Poppins',Helvetica]">
        Payment Summary
      </h2>

      <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
          {paymentItems.map((item, index) => (
            <div
              key={index}
              className={`flex items-end justify-between relative self-stretch w-full flex-[0_0_auto] ${item.isIndented ? "px-5 py-0" : ""}`}
            >
              <div
                className={`relative w-fit [font-family:'Poppins',Helvetica] font-normal text-lg tracking-[0] leading-[21.6px] whitespace-nowrap ${item.isIndented ? "text-[#545454] mt-[-1.00px]" : "text-[#333333]"} ${!item.isMain ? "mt-[-1.00px]" : ""}`}
              >
                {item.label}
              </div>

              <div className="flex items-center justify-end gap-4 relative">
                <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-[#020202] text-lg tracking-[0] leading-[21.6px] whitespace-nowrap">
                  {item.amount}
                </div>

                {item.hasChevron && (
                  <ChevronDown className="relative w-6 h-6" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const LeaseBookingSummarySection = ({ match }: { match: MatchWithRelations }) => {
  // Format dates
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Guest info icons based on trip details
  const guestInfo = [
    { icon: Users, label: `${match.trip.numAdults || 1} Adult${(match.trip.numAdults || 1) > 1 ? 's' : ''}` },
    ...(match.trip.numChildren ? [{ icon: Users, label: `${match.trip.numChildren} Child${match.trip.numChildren > 1 ? 'ren' : ''}` }] : []),
    ...(match.trip.numPets ? [{ icon: PawPrint, label: `${match.trip.numPets} Pet${match.trip.numPets > 1 ? 's' : ''}` }] : []),
  ];

  return (
    <section className="flex flex-col items-start justify-center gap-6 w-full">
      <h2 className="[font-family:'Poppins',Helvetica] font-medium text-[#373940] text-2xl tracking-[0.15px] leading-normal">
        Lease &amp; Booking Summary
      </h2>

      <Card className="w-full border-0 shadow-none bg-transparent">
        <CardContent className="flex flex-col md:flex-row items-center gap-6 p-0">
          <div
            className="w-full md:w-1/3 min-w-[200px] h-48 md:h-64 rounded-xl bg-cover bg-center bg-no-repeat bg-gray-300 flex-shrink-0"
            style={{ 
              backgroundImage: `url(${match.listing.listingImages?.[0]?.url || ''})`
            }}
          />

          <div className="flex flex-col items-start gap-5 flex-1 w-full rounded-[0px_0px_12px_12px] backdrop-blur-md backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(12px)_brightness(100%)]">
            <div className="flex flex-col items-start gap-2 w-full">
              <div className="flex flex-col items-start gap-2 w-full">
                <div className="flex items-center gap-2 w-full">
                  <h3 className="[font-family:'Poppins',Helvetica] font-medium text-[#020202] text-[26px] tracking-0 leading-normal">
                    Hosted by {match.listing.user?.firstName || 'Host'}
                  </h3>
                </div>
              </div>

              <div className="flex items-start gap-2 w-full">
                <div className="inline-flex items-center gap-2.5 px-0 py-[3px]">
                  <MapPin className="w-7 h-7" />
                </div>

                <div className="flex-1 [font-family:'Poppins',Helvetica] font-normal text-[#484a54] text-[22px] tracking-0 leading-normal">
                  {match.listing.locationString || 'Location'}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-[16px_32px] pr-3 w-full">
              <div className="inline-flex flex-col items-start justify-center gap-3">
                <div className="[font-family:'Poppins',Helvetica] font-normal text-[#777b8b] text-base tracking-0 leading-[19.2px] whitespace-nowrap">
                  Move-in
                </div>

                <div className="[font-family:'Poppins',Helvetica] font-medium text-[#484a54] text-[22px] tracking-0 leading-[26.4px] whitespace-nowrap">
                  {formatDate(match.trip.startDate)}
                </div>
              </div>

              <div className="inline-flex flex-col items-start justify-center gap-3">
                <div className="[font-family:'Poppins',Helvetica] font-normal text-[#777b8b] text-base tracking-0 leading-[19.2px] whitespace-nowrap">
                  Move-out
                </div>

                <div className="[font-family:'Poppins',Helvetica] font-medium text-[#484a54] text-[22px] tracking-0 leading-[26.4px] whitespace-nowrap">
                  {formatDate(match.trip.endDate)}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-[16px_32px] pr-5 w-full">
              {guestInfo.map((guest, index) => {
                const IconComponent = guest.icon;
                return (
                  <div key={index} className="inline-flex items-center gap-1.5">
                    <IconComponent className="w-7 h-7" />
                    <div className="[font-family:'Poppins',Helvetica] font-medium text-[#484a54] text-lg tracking-0 leading-normal">
                      {guest.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export function CompleteClient({ match, matchId, isAdminDev = false }: CompleteClientProps) {
  return (
    <main className={`${PAGE_MARGIN}`}>
      <div className="max-w-4xl mx-auto flex flex-col items-start gap-2.5 p-6 bg-white rounded-lg overflow-hidden">
        <section className="flex flex-col items-start gap-8 relative self-stretch w-full flex-[0_0_auto]">
          <ConfirmationMessageSection />
          <LeaseBookingSummarySection match={match} />
          <PaymentSummarySection match={match} />
          <DownloadableDocumentsSection match={match} />
        </section>
      </div>
    </main>
  );
}