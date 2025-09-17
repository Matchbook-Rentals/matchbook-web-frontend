'use client';

import React, { useState } from 'react';
import { CalendarIcon, XIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BrandButton } from '@/components/ui/brandButton';
import BrandModal from '@/components/BrandModal';
import { approvePaymentModification, rejectPaymentModification, markPaymentModificationAsViewed } from '@/app/actions/payment-modifications';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface PaymentModificationData {
  id: string;
  requestorName: string;
  requestorImage: string;
  propertyTitle: string;
  propertyAddress: string;
  propertyImage: string;
  originalAmount: string;
  originalDueDate: string;
  newAmount: string;
  newDueDate: string;
  reason: string | null;
  requestedAt: string;
  bookingId: string;
}

interface PaymentModificationReviewModalProps {
  data: PaymentModificationData;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onModificationProcessed?: () => void;
}

export default function PaymentModificationReviewModal({ 
  data, 
  isOpen, 
  onOpenChange,
  onModificationProcessed 
}: PaymentModificationReviewModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Mark modification as viewed when modal opens
  useEffect(() => {
    if (isOpen) {
      const markAsViewed = async () => {
        try {
          await markPaymentModificationAsViewed(data.id);
        } catch (error) {
          console.error('Failed to mark modification as viewed:', error);
        }
      };
      markAsViewed();
    }
  }, [isOpen, data.id]);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await approvePaymentModification(data.id);
      toast.success('Payment modification approved successfully');
      onOpenChange(false);
      onModificationProcessed?.();
    } catch (error) {
      console.error('Error approving payment modification:', error);
      toast.error('Failed to approve payment modification');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await rejectPaymentModification(data.id, rejectionReason.trim() || undefined);
      toast.success('Payment modification rejected');
      onOpenChange(false);
      onModificationProcessed?.();
    } catch (error) {
      console.error('Error rejecting payment modification:', error);
      toast.error('Failed to reject payment modification');
    } finally {
      setIsProcessing(false);
    }
  };

  const formFields = [
    {
      section: "current",
      fields: [
        {
          id: "currentDueDate",
          label: "Current Due Date",
          value: data.originalDueDate,
          type: "date",
          hasIcon: true,
          fontWeight: "font-medium",
        },
        {
          id: "currentAmount",
          label: "Current Amount",
          value: data.originalAmount,
          type: "text",
          hasIcon: false,
          fontWeight: "font-medium",
        },
      ],
    },
    {
      section: "new",
      fields: [
        {
          id: "newDueDate",
          label: "New Due Date",
          value: data.newDueDate,
          type: "date",
          hasIcon: true,
          fontWeight: "font-semibold",
        },
        {
          id: "newAmount",
          label: "New Amount",
          value: data.newAmount,
          type: "text",
          hasIcon: false,
          fontWeight: "font-semibold",
        },
      ],
    },
  ];

  const modalContent = (
    <Card className="max-w-[1041px] w-full bg-white rounded-xl overflow-hidden border-0 shadow-none">
      <CardContent className="flex flex-col items-center gap-6 p-6 h-full">
        <header className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
          <h1 className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-gray-900 text-xl text-center tracking-[0] leading-[normal]">
            {data.requestorName} is requesting a modification to a payment
          </h1>
          <BrandButton 
            variant="ghost" 
            size="icon" 
            className="relative w-6 h-6 p-0"
            onClick={() => onOpenChange(false)}
          >
            <XIcon className="w-4 h-4" />
          </BrandButton>
        </header>

        <section className="flex flex-col items-start justify-center gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
          <p className="font-medium relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap">
            Please review and approve. If you do not approve please communicate with your host
          </p>
        </section>

        {!showRejectDialog ? (
          <>
            <div className="flex flex-col items-end gap-6 relative self-stretch w-full flex-[0_0_auto]">
              <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                  {formFields[0].fields.map((field) => (
                    <div
                      key={field.id}
                      className="flex-col items-start gap-1.5 flex-1 grow flex relative"
                    >
                      <div className="flex-col items-start gap-1.5 self-stretch w-full flex-[0_0_auto] flex relative">
                        <div className="flex-col items-start gap-1.5 self-stretch w-full flex-[0_0_auto] flex relative">
                          <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                            <Label
                              className={`${field.fontWeight} relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap`}
                            >
                              {field.label}
                            </Label>
                          </div>
                          <div className="h-12 items-center gap-2 px-3 py-2 self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] flex relative shadow-shadows-shadow-xs">
                            <div className="flex items-center gap-2 relative flex-1 grow">
                              <Input
                                defaultValue={field.value}
                                className="relative flex-1 mt-[-1.00px] font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-[#667085] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)] border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                                readOnly
                              />
                              {field.hasIcon && (
                                <div className="relative w-6 h-6">
                                  <CalendarIcon className="absolute w-5 h-5 top-px left-0" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
              <div className="flex items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
                {formFields[1].fields.map((field) => (
                  <div
                    key={field.id}
                    className="flex-col items-start gap-1.5 flex-1 grow flex relative"
                  >
                    <div className="flex-col items-start gap-1.5 self-stretch w-full flex-[0_0_auto] flex relative">
                      <Label
                        className={`${field.fontWeight} relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap`}
                      >
                        {field.label}
                      </Label>
                      <div className="h-12 items-center gap-2 px-3 py-2 self-stretch w-full bg-white rounded-lg border border-solid border-[#d0d5dd] flex relative shadow-shadows-shadow-xs">
                        <div className="flex items-center gap-2 relative flex-1 grow">
                          <Input
                            defaultValue={field.value}
                            className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-[#667085] text-base tracking-[0] leading-[normal] border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                            readOnly
                          />
                          {field.hasIcon && (
                            <div className="relative w-6 h-6">
                              <CalendarIcon className="absolute w-5 h-5 top-px left-0" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <footer className="flex items-start justify-end gap-6 relative self-stretch w-full flex-[0_0_auto]">
              <BrandButton
                variant="outline"
                onClick={() => setShowRejectDialog(true)}
                disabled={isProcessing}
              >
                I do not approve
              </BrandButton>
              <BrandButton 
                variant="default"
                onClick={handleApprove}
                disabled={isProcessing}
                isLoading={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'I approve this change'}
              </BrandButton>
            </footer>
          </>
        ) : (
          <div className="flex flex-col gap-4 relative self-stretch w-full">
            <div>
              <Label htmlFor="rejection-reason" className="text-sm font-medium text-gray-700">
                Rejection Reason (Optional)
              </Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a reason for rejecting this modification..."
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <BrandButton
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason('');
                }}
                disabled={isProcessing}
              >
                Cancel
              </BrandButton>
              <BrandButton
                variant="destructive"
                onClick={handleReject}
                disabled={isProcessing}
                isLoading={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Confirm Rejection'}
              </BrandButton>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <BrandModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      className="w-full max-w-[320px] sm:max-w-[500px] md:max-w-[700px] lg:max-w-[900px] xl:max-w-[1041px]"
      heightStyle="!top-[20vh]"
    >
      {modalContent}
    </BrandModal>
  );
}