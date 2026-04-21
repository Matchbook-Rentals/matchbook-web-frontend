import React from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { BrandCheckbox } from "@/app/brandCheckbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ListingCreationCounter } from "./listing-creation-counter";
import { MonthlyPricing } from "./listing-creation-pricing";
import { styles } from "./styles";
import {
  validateAndCapNumber,
  formatNumberWithCommas,
  removeCommasFromNumber,
} from "@/lib/number-validation";

interface ListingCreationPricingAndTermsProps {
  shortestStay: number;
  longestStay: number;
  availableDate: string;
  basePrice: string;
  deposit: string;
  petDeposit: string;
  petRent: string;
  includeUtilities: boolean;
  varyPricingByLength: boolean;
  monthlyPricing: MonthlyPricing[];
  onShortestStayChange: (value: number) => void;
  onLongestStayChange: (value: number) => void;
  onAvailableDateChange: (value: string) => void;
  onBasePriceChange: (value: string) => void;
  onDepositChange: (value: string) => void;
  onPetDepositChange: (value: string) => void;
  onPetRentChange: (value: string) => void;
  onIncludeUtilitiesChange: (value: boolean) => void;
  onVaryPricingByLengthChange: (value: boolean) => void;
  onMonthlyPricingChange: (pricing: MonthlyPricing[]) => void;
  questionTextStyles?: string;
  questionSubTextStyles?: string;
}

const currencyDigits = (raw: string) =>
  validateAndCapNumber(raw.replace(/[^0-9]/g, ""), false, 10000000, false);

const ListingCreationPricingAndTerms: React.FC<ListingCreationPricingAndTermsProps> = ({
  shortestStay,
  longestStay,
  availableDate,
  basePrice,
  deposit,
  petDeposit,
  petRent,
  includeUtilities,
  varyPricingByLength,
  monthlyPricing,
  onShortestStayChange,
  onLongestStayChange,
  onAvailableDateChange,
  onBasePriceChange,
  onDepositChange,
  onPetDepositChange,
  onPetRentChange,
  onIncludeUtilitiesChange,
  onVaryPricingByLengthChange,
  onMonthlyPricingChange,
  questionTextStyles,
  questionSubTextStyles,
}) => {
  const [focusedField, setFocusedField] = React.useState<string | null>(null);

  const labelCls =
    questionTextStyles ||
    "font-medium text-base md:text-lg text-[#404040] [font-family:'Poppins',Helvetica]";
  const subLabelCls =
    questionSubTextStyles ||
    "font-light text-sm text-[#666666] [font-family:'Poppins',Helvetica] mt-1";

  const displayCurrency = (field: string, value: string) =>
    focusedField === field ? value : formatNumberWithCommas(value);

  const handleCurrencyChange =
    (onChange: (value: string) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange(currencyDigits(e.target.value));

  const increaseShortestStay = () => {
    if (shortestStay < longestStay) onShortestStayChange(shortestStay + 1);
  };
  const decreaseShortestStay = () => {
    if (shortestStay > 1) onShortestStayChange(shortestStay - 1);
  };
  const increaseLongestStay = () => {
    if (longestStay < 12) onLongestStayChange(longestStay + 1);
  };
  const decreaseLongestStay = () => {
    if (longestStay > shortestStay) onLongestStayChange(longestStay - 1);
  };

  const updateMonthPrice = (months: number, rawValue: string) => {
    const validated = currencyDigits(removeCommasFromNumber(rawValue));
    onMonthlyPricingChange(
      monthlyPricing.map((p) =>
        p.months === months ? { ...p, price: validated } : p
      )
    );
  };

  const updateMonthUtilities = (months: number, utilitiesIncluded: boolean) => {
    onMonthlyPricingChange(
      monthlyPricing.map((p) =>
        p.months === months ? { ...p, utilitiesIncluded } : p
      )
    );
  };

  const setAllRowUtilities = (value: boolean) => {
    onIncludeUtilitiesChange(value);
    onMonthlyPricingChange(
      monthlyPricing.map((p) => ({ ...p, utilitiesIncluded: value }))
    );
  };

  const handleBasePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = currencyDigits(e.target.value);
    onBasePriceChange(next);
    if (!varyPricingByLength) {
      onMonthlyPricingChange(
        monthlyPricing.map((p) => ({ ...p, price: next }))
      );
    }
  };

  const handleVaryToggle = (value: boolean) => {
    onVaryPricingByLengthChange(value);
    if (!value) {
      onMonthlyPricingChange(
        monthlyPricing.map((p) => ({
          ...p,
          price: basePrice,
          utilitiesIncluded: includeUtilities,
        }))
      );
    }
  };

  const displayRowPrice = (p: MonthlyPricing) =>
    focusedField === `row-${p.months}`
      ? p.price
      : formatNumberWithCommas(p.price);

  const allRowsUtilitiesOn =
    monthlyPricing.length > 0 &&
    monthlyPricing.every((p) => p.utilitiesIncluded);

  return (
    <div className="relative w-full md:max-w-[886px] px-2 sm:px-4 md:px-6">
      <div className="space-y-5">
        <Row label="What is the shortest stay you will accommodate?">
          <ListingCreationCounter
            value={shortestStay}
            onChange={onShortestStayChange}
            onIncrement={increaseShortestStay}
            onDecrement={decreaseShortestStay}
            incrementDisabled={shortestStay >= longestStay}
            decrementDisabled={shortestStay <= 1}
            variant="outline"
            iconSize="sm"
            buttonSize="sm"
            textSize="base"
            containerClassName="flex items-center justify-between min-w-[170px] space-x-3"
            buttonClassName={styles.counterButtonSmall}
            textClassName={styles.counterTextSmall}
            monthSuffixClassName="inline"
          />
        </Row>

        <Divider />

        <Row label="What is the longest stay you will accommodate?">
          <ListingCreationCounter
            value={longestStay}
            onChange={onLongestStayChange}
            onIncrement={increaseLongestStay}
            onDecrement={decreaseLongestStay}
            incrementDisabled={longestStay >= 12}
            decrementDisabled={longestStay <= shortestStay}
            variant="outline"
            iconSize="sm"
            buttonSize="sm"
            textSize="base"
            containerClassName="flex items-center justify-between min-w-[170px] space-x-3"
            buttonClassName={styles.counterButtonSmall}
            textClassName={styles.counterTextSmall}
            monthSuffixClassName="inline"
          />
        </Row>

        <Divider />

        <Row label="What date is the unit first available for rent?">
          <Input
            type="date"
            value={availableDate}
            onChange={(e) => onAvailableDateChange(e.target.value)}
            className="h-9 rounded-[10px] border-2 border-[#0000004c] w-full max-w-[173px] text-sm"
          />
        </Row>

        <Row label="Enter monthly rent">
          <CurrencyInput
            id="basePrice"
            placeholder="0"
            suffix="/ mo"
            value={displayCurrency("basePrice", basePrice)}
            onChange={handleBasePriceChange}
            onFocus={() => setFocusedField("basePrice")}
            onBlur={() => setFocusedField(null)}
          />
        </Row>

        <Row
          label="How much is the security deposit?"
          subLabel="Total security deposit amount required from renters. Check your state and local laws for limits."
          labelCls={labelCls}
          subLabelCls={subLabelCls}
        >
          <CurrencyInput
            id="deposit"
            placeholder="0"
            value={displayCurrency("deposit", deposit)}
            onChange={handleCurrencyChange(onDepositChange)}
            onFocus={() => setFocusedField("deposit")}
            onBlur={() => setFocusedField(null)}
          />
        </Row>

        <Row
          label="Is there an extra deposit for pets?"
          subLabel={
            <>
              Additional deposit amount per pet (refundable)
              <br />
              (Leave blank if you don&apos;t require a pet deposit)
            </>
          }
          labelCls={labelCls}
          subLabelCls={subLabelCls}
        >
          <CurrencyInput
            id="petDeposit"
            placeholder="0"
            value={displayCurrency("petDeposit", petDeposit)}
            onChange={handleCurrencyChange(onPetDepositChange)}
            onFocus={() => setFocusedField("petDeposit")}
            onBlur={() => setFocusedField(null)}
          />
        </Row>

        <Row
          label="Is there a monthly fee for pets?"
          subLabel={
            <>
              Monthly rent additional per pet (non-refundable)
              <br />
              (Leave blank if you don&apos;t require pet rent)
            </>
          }
          labelCls={labelCls}
          subLabelCls={subLabelCls}
        >
          <CurrencyInput
            id="petRent"
            placeholder="0"
            suffix="/ mo"
            value={displayCurrency("petRent", petRent)}
            onChange={handleCurrencyChange(onPetRentChange)}
            onFocus={() => setFocusedField("petRent")}
            onBlur={() => setFocusedField(null)}
          />
        </Row>

        <Row label="Would you like to include utilities in the rent?">
          <Switch
            checked={includeUtilities}
            onCheckedChange={setAllRowUtilities}
            aria-label="Include utilities in rent"
          />
        </Row>

        <Row label="Would you like to offer different terms (price, utilities included) based on lease length?">
          <Switch
            checked={varyPricingByLength}
            onCheckedChange={handleVaryToggle}
            aria-label="Vary pricing by lease length"
          />
        </Row>
      </div>

      {varyPricingByLength && (
        <div className="mt-8">
          {/* Header — col 3 is wide enough for label + switch */}
          <div className="flex items-center gap-x-3 sm:gap-x-4 md:gap-x-6 bg-[#e7f0f0] px-4 py-3 font-medium text-xs text-[#475467]">
            <div className="w-24 shrink-0">
              <span className="inline-block">Lease Length</span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="inline-block">Monthly Rent</span>
            </div>
            <div className="shrink-0 flex items-center gap-2 pl-1 md:pl-0">
              <span className="max-w-16 text-right leading-tight">Utilities Included</span>
              <Switch
                checked={allRowsUtilitiesOn}
                onCheckedChange={setAllRowUtilities}
                aria-label="Toggle utilities for all lease lengths"
              />
            </div>
          </div>

          {/* Body rows — col 3 shrinks to just the switch, letting col 2 (input) grow */}
          {monthlyPricing.map((pricing) => (
            <div
              key={`pricing-${pricing.months}`}
              className="flex items-center gap-x-3 sm:gap-x-4 md:gap-x-6 px-4 py-4 border-b last:border-b-0"
            >
              <div className="w-24 shrink-0 text-sm text-[#373940] whitespace-nowrap">
                <span className="inline-block">
                  {pricing.months} month{pricing.months !== 1 && "s"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="relative w-full">
                  <span className="absolute inset-y-0 left-2 flex items-center text-gray-500">
                    $
                  </span>
                  <span className="absolute inset-y-0 right-2 flex items-center text-gray-500 text-sm">
                    /mo
                  </span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9,]*"
                    className="w-full pl-7 pr-10 text-base"
                    placeholder="0.00"
                    value={displayRowPrice(pricing)}
                    onFocus={() => setFocusedField(`row-${pricing.months}`)}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) =>
                      updateMonthPrice(pricing.months, e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="shrink-0 flex justify-end pl-1 md:pl-0">
                <Switch
                  checked={pricing.utilitiesIncluded}
                  onCheckedChange={(checked) =>
                    updateMonthUtilities(pricing.months, checked)
                  }
                  aria-label={`Utilities included for ${pricing.months} month lease`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface RowProps {
  label: string;
  subLabel?: React.ReactNode;
  labelCls?: string;
  subLabelCls?: string;
  children: React.ReactNode;
}

const Row: React.FC<RowProps> = ({
  label,
  subLabel,
  labelCls,
  subLabelCls,
  children,
}) => (
  <div className="flex items-start gap-4 justify-between">
    <div className="flex-1 min-w-0">
      <label
        className={
          labelCls ||
          "font-medium text-base md:text-lg text-[#404040] [font-family:'Poppins',Helvetica]"
        }
      >
        {label}
      </label>
      {subLabel && (
        <p
          className={
            subLabelCls ||
            "font-light text-sm text-[#666666] [font-family:'Poppins',Helvetica] mt-1"
          }
        >
          {subLabel}
        </p>
      )}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const Divider: React.FC = () => (
  <div className="h-px bg-black/10 w-full" aria-hidden="true" />
);

interface CurrencyInputProps {
  id: string;
  value: string;
  placeholder?: string;
  suffix?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  onBlur: () => void;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  id,
  value,
  placeholder = "0",
  suffix,
  onChange,
  onFocus,
  onBlur,
}) => (
  <div className="relative w-full max-w-[173px]">
    <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 text-base">
      $
    </span>
    {suffix && (
      <span className="absolute inset-y-0 right-3 flex items-center text-gray-500 text-sm">
        {suffix}
      </span>
    )}
    <Input
      id={id}
      className={`w-full h-9 rounded-[10px] border-2 border-[#0000004c] pl-7 text-base ${
        suffix ? "pr-12" : ""
      }`}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      type="text"
      inputMode="numeric"
      pattern="[0-9,]*"
    />
  </div>
);

export default ListingCreationPricingAndTerms;
