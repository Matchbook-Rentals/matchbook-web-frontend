import React from "react";
import { Input } from "@/components/ui/input";

interface ListingCreationDepositProps {
  deposit: string;
  rentDueAtBooking: string;
  petDeposit: string;
  petRent: string;
  onDepositChange: (value: string) => void;
  onRentDueAtBookingChange: (value: string) => void;
  onPetDepositChange: (value: string) => void;
  onPetRentChange: (value: string) => void;
  questionTextStyles?: string;
  questionSubTextStyles?: string;
}

const ListingCreationDeposit: React.FC<ListingCreationDepositProps> = ({
  deposit,
  rentDueAtBooking,
  petDeposit,
  petRent,
  onDepositChange,
  onRentDueAtBookingChange,
  onPetDepositChange,
  onPetRentChange,
  questionTextStyles,
  questionSubTextStyles,
}) => {
  return (
    <div className="relative w-full md:max-w-[886px]">
      <div className="w-full">
        {/* Deposit Section */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4 justify-between">
              <div className="flex-1 min-w-0">
                <label className={questionTextStyles || "font-medium text-xl text-[#404040] [font-family:'Poppins',Helvetica]"}>
                  How much is the security deposit?
                </label>
                <p className={questionSubTextStyles || "font-light text-sm text-[#666666] [font-family:'Poppins',Helvetica] mt-1"}>
                  Total security deposit amount required from tenants
                </p>
              </div>
              <div className="relative w-full max-w-[173px]">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 text-lg">$</span>
                <Input
                  className="w-full h-9 rounded-[10px] border-2 border-[#0000004c] pl-7 text-lg"
                  value={deposit}
                  onChange={(e) => {
                    // Only allow numbers and decimal points
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    onDepositChange(value);
                  }}
                  placeholder="0.00"
                  type="text"
                  inputMode="decimal"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 justify-between">
              <div className="flex-1 min-w-0">
                <label className={questionTextStyles || "font-medium text-xl text-[#404040] [font-family:'Poppins',Helvetica]"}>
                  How much of first months rent do you want due at booking?
                </label>
                <p className={questionSubTextStyles || "font-light text-sm text-[#666666] [font-family:'Poppins',Helvetica] mt-1"}>
                   This amount is collected from renters at booking and is nonrefundable if they cancel 24 hours or more after booking.
                </p>
              </div>
              <div className="relative w-full max-w-[173px]">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 text-lg">$</span>
                <Input
                  className="w-full h-9 rounded-[10px] border-2 border-[#0000004c] pl-7 text-lg"
                  value={rentDueAtBooking}
                  onChange={(e) => {
                    // Only allow numbers and decimal points
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    onRentDueAtBookingChange(value);
                  }}
                  placeholder="0.00"
                  type="text"
                  inputMode="decimal"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4 justify-between">
                <div className="flex-1 min-w-0">
                  <label className={questionTextStyles || "font-medium text-lg text-[#404040] [font-family:'Poppins',Helvetica]"}>
                    Is there an extra deposit for pets?
                  </label>
                  <p className={questionSubTextStyles || "font-light text-sm text-[#666666] [font-family:'Poppins',Helvetica] mt-1"}>
                    Additional deposit amount per pet (refundable)
                  </p>
                </div>
                <div className="relative w-full max-w-[173px]">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 text-lg">$</span>
                  <Input
                    className="w-full h-9 rounded-[10px] border-2 border-[#0000004c] pl-7 text-lg"
                    value={petDeposit}
                    onChange={(e) => {
                      // Only allow numbers and decimal points
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      onPetDepositChange(value);
                    }}
                    placeholder="0.00"
                    type="text"
                    inputMode="decimal"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 justify-between">
                <div className="flex-1 min-w-0">
                  <label className={questionTextStyles || "font-medium text-lg text-[#404040] [font-family:'Poppins',Helvetica]"}>
                    Is there a monthly fee for pets?
                  </label>
                  <p className={questionSubTextStyles || "font-light text-sm text-[#666666] [font-family:'Poppins',Helvetica] mt-1"}>
                    Monthly rent addition per pet (non-refundable)
                  </p>
                </div>
                <div className="relative w-full max-w-[173px]">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 text-lg">$</span>
                  <Input
                    className="w-full h-9 rounded-[10px] border-2 border-[#0000004c] pl-7 text-lg"
                    value={petRent}
                    onChange={(e) => {
                      // Only allow numbers and decimal points
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      onPetRentChange(value);
                    }}
                    placeholder="0.00"
                    type="text"
                    inputMode="decimal"
                  />
                </div>
              </div>
            </div>
            <p className={questionSubTextStyles || "font-light text-sm text-[#666666] [font-family:'Poppins',Helvetica]"}>
              Leave blank if you don&apos;t charge pet fees
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingCreationDeposit;
