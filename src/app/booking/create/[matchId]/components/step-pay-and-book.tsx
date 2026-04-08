'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { PaymentReviewScreen } from '@/components/payment-review/PaymentReviewScreen';
import { calculatePayments } from '@/lib/calculate-payments';
import { FEES } from '@/lib/fee-constants';
import { calculateCreditCardFee } from '@/lib/payment-calculations';
import type { StepProps } from './types';

const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

function PropertyHeader({ match }: { match: StepProps['match'] }) {
  const listingImage = match.listing.listingImages?.[0]?.url;

  return (
    <div className="flex flex-col items-start gap-4 pb-6">
      <div className="w-full max-w-[840px] h-[317px] rounded-xl overflow-hidden bg-gradient-to-br from-brandBrown-200 via-brandBrown-300 to-brandBrown-400 mx-auto">
        {listingImage ? (
          <img src={listingImage} alt={match.listing.title || 'Property'} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
      </div>

      <h2 className="font-['Poppins'] text-xl font-semibold text-[#1a1a1a] m-0">
        {match.listing.title || 'Your Home Away from Home'}
      </h2>

      <div className="flex gap-3">
        <div className="booking-review__chip">
          <span className="booking-review__chip-label">Move-In</span>
          <span className="booking-review__chip-date">{formatDate(match.trip.startDate)}</span>
        </div>
        <div className="booking-review__chip">
          <span className="booking-review__chip-label">Move-Out</span>
          <span className="booking-review__chip-date">{formatDate(match.trip.endDate)}</span>
        </div>
      </div>
    </div>
  );
}

export function StepPayAndBook({ match, matchId }: StepProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [selectedPaymentMethodType, setSelectedPaymentMethodType] = useState<string>();

  const paymentDetails = calculatePayments({
    listing: match.listing,
    trip: match.trip,
    monthlyRentOverride: match.monthlyRent,
    petRentOverride: match.petRent,
    petDepositOverride: match.petDeposit,
  });

  const totalDeposits = paymentDetails.securityDeposit + (paymentDetails.petDeposit || 0);
  const transferFee = totalDeposits > 0 ? FEES.TRANSFER_FEE_DOLLARS : 0;
  const baseAmountDue = totalDeposits + transferFee;
  const creditCardFee = calculateCreditCardFee(baseAmountDue);

  const getTotalDueToday = (methodType?: string) =>
    methodType === 'card' ? baseAmountDue + creditCardFee : baseAmountDue;

  const handlePaymentSuccess = () => {
    toast({
      title: 'Payment Successful',
      description: 'Your booking is confirmed!',
    });
    router.refresh();
  };

  return (
    <div className="space-y-6 [&_header:first-of-type]:hidden">
      <PropertyHeader match={match} />

      <div className="pay-step-review [&>div>div>h2]:!text-0 [&>div>div>h2]:!overflow-hidden [&>div>div>h2]:!h-0 [&>div>div>h2]:!m-0 [&>div.fixed]:!hidden">
        <h3 className="font-['Poppins'] text-lg font-semibold text-[#1a1a1a] mb-4">Select Payment Method</h3>
        <PaymentReviewScreen
        matchId={matchId}
        amount={getTotalDueToday(selectedPaymentMethodType)}
        paymentBreakdown={{
          monthlyRent: paymentDetails.monthlyRent,
          petRent: paymentDetails.monthlyPetRent,
          securityDeposit: paymentDetails.securityDeposit,
          petDeposit: paymentDetails.petDeposit || 0,
          transferFee: transferFee,
          processingFee: selectedPaymentMethodType === 'card'
            ? getTotalDueToday('card') - getTotalDueToday()
            : undefined,
          total: getTotalDueToday(selectedPaymentMethodType),
        }}
        onSuccess={handlePaymentSuccess}
        onPaymentMethodChange={(methodType) => {
          setSelectedPaymentMethodType(methodType || undefined);
        }}
        tripStartDate={match.trip.startDate}
        tripEndDate={match.trip.endDate}
      />
      </div>
    </div>
  );
}
