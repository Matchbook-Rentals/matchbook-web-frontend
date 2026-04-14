import { MatchWithRelations } from '@/types';

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
}
