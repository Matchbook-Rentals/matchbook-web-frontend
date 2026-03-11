import React from "react";
import { Input } from "@/components/ui/input";
import { validateAndCapNumber, formatNumberWithCommas } from "@/lib/number-validation";

interface ListingCreationDepositProps {
  deposit: string;
  petDeposit: string;
  petRent: string;
  onDepositChange: (value: string) => void;
  onPetDepositChange: (value: string) => void;
  onPetRentChange: (value: string) => void;
  questionTextStyles?: string;
  questionSubTextStyles?: string;
}

const ListingCreationDeposit: React.FC<ListingCreationDepositProps> = ({
  deposit,
  petDeposit,
  petRent,
  onDepositChange,
  onPetDepositChange,
  onPetRentChange,
  questionTextStyles,
  questionSubTextStyles,
}) => {
  // Track focused field to avoid comma-formatting during typing
  // (reformatting mid-keystroke causes cursor jumps on older Safari)
  const [focusedField, setFocusedField] = React.useState<string | null>(null);

  const handleChange = (onChange: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    onChange(validateAndCapNumber(raw, false, 10000000, false));
  };

  const displayValue = (field: string, value: string) =>
    focusedField === field ? value : formatNumberWithCommas(value);
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
                  Total security deposit amount required from renters
                </p>
              </div>
              <div className="relative w-full max-w-[173px]">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 text-lg">$</span>
                <Input
                  className="w-full h-9 rounded-[10px] border-2 border-[#0000004c] pl-7 text-lg"
                  value={displayValue('deposit', deposit)}
                  onChange={handleChange(onDepositChange)}
                  onFocus={() => setFocusedField('deposit')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="0"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9,]*"
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
                    value={displayValue('petDeposit', petDeposit)}
                    onChange={handleChange(onPetDepositChange)}
                    onFocus={() => setFocusedField('petDeposit')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="0"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9,]*"
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
                  <span className="absolute inset-y-0 right-3 flex items-center text-gray-500 text-lg">/mo</span>
                  <Input
                    className="w-full h-9 rounded-[10px] border-2 border-[#0000004c] pl-7 pr-12 text-lg"
                    value={displayValue('petRent', petRent)}
                    onChange={handleChange(onPetRentChange)}
                    onFocus={() => setFocusedField('petRent')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="0"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9,]*"
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
