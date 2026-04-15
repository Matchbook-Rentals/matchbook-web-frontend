import { MatchWithRelations } from '@/types';
import type { BookingReceipt } from '../get-booking-receipt';

export interface LeaseDocument {
  id: string;
  pdfFileUrl: string;
  pdfFileName: string;
  documentData: {
    fields: any[];
    recipients: any[];
  };
  fieldValues: {
    fieldId: string;
    value: string;
    signerIndex: number;
    signedAt: string | null;
  }[];
  template: any;
  signingSessions: any[];
}

export interface StepProps {
  match: MatchWithRelations;
  matchId: string;
  currentUserEmail: string;
  isAdminDev?: boolean;
  leaseDocument?: LeaseDocument | null;
  onAdvanceStep?: () => void;
  /** Server-computed receipt using real RentPayment data — used by the confirmation step */
  bookingReceipt?: BookingReceipt | null;
}
