import React from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
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
      <div className="flex flex-col gap-5">
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

        <Row label="What date is the unit first available for rent?">
          <AvailableDatePicker
            value={availableDate}
            onChange={onAvailableDateChange}
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
          {/* Header — mobile: content-sized cols; md+: capped at 1/3 with justify-between */}
          <div className="flex items-center gap-x-3 sm:gap-x-4 md:gap-x-0 md:justify-between bg-[#e7f0f0] px-4 md:px-8 py-3 font-medium text-xs text-[#475467]">
            <div className="w-24 shrink-0 md:w-1/3 md:max-w-[33%]">
              <span className="inline-block">Lease Length</span>
            </div>
            <div className="flex-1 min-w-0 md:flex-none md:w-1/3 md:max-w-[33%]">
              <span className="inline-block">Monthly Rent</span>
            </div>
            <div className="shrink-0 flex items-center gap-2 pl-1 md:pl-0 md:w-1/3 md:max-w-[33%] md:justify-end">
              <span className="max-w-16 text-right leading-tight md:max-w-none">Utilities Included</span>
              <Switch
                checked={allRowsUtilitiesOn}
                onCheckedChange={setAllRowUtilities}
                aria-label="Toggle utilities for all lease lengths"
              />
            </div>
          </div>

          {/* Body rows — mobile: col 3 shrinks to just the switch, letting col 2 (input) grow;
               md+: columns capped at 1/3 with justify-between */}
          {monthlyPricing.map((pricing) => (
            <div
              key={`pricing-${pricing.months}`}
              className="flex items-center gap-x-3 sm:gap-x-4 md:gap-x-0 md:justify-between px-4 md:px-8 py-4 border-b last:border-b-0"
            >
              <div className="w-24 shrink-0 text-sm text-[#373940] whitespace-nowrap md:w-1/3 md:max-w-[33%]">
                <span className="inline-block">
                  {pricing.months} month{pricing.months !== 1 && "s"}
                </span>
              </div>
              <div className="flex-1 min-w-0 md:flex-none md:w-1/3 md:max-w-[33%]">
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
              <div className="shrink-0 flex justify-end pl-1 md:pl-0 md:w-1/3 md:max-w-[33%]">
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
  <div className="relative w-[173px]">
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

interface AvailableDatePickerProps {
  value: string; // ISO "YYYY-MM-DD"
  onChange: (iso: string) => void;
}

// Auto-format as MM/DD/YYYY while typing
const formatDateInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

// Parse "MM/DD/YYYY" → Date (null on invalid/incomplete)
const parseDateInput = (formatted: string): Date | null => {
  const digits = formatted.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  const mm = parseInt(digits.slice(0, 2), 10);
  const dd = parseInt(digits.slice(2, 4), 10);
  const yyyy = parseInt(digits.slice(4, 8), 10);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || yyyy < 1900) return null;
  const d = new Date(yyyy, mm - 1, dd);
  if (d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

const dateToMMDDYYYY = (d: Date): string => {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()}`;
};

const dateToIso = (d: Date): string => {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

const isoToDate = (iso: string): Date | null => {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  const result = new Date(y, m - 1, d);
  result.setHours(0, 0, 0, 0);
  return result;
};

const AvailableDatePicker: React.FC<AvailableDatePickerProps> = ({
  value,
  onChange,
}) => {
  const [open, setOpen] = React.useState(false);
  const selected = isoToDate(value) ?? undefined;
  const [text, setText] = React.useState(() =>
    selected ? dateToMMDDYYYY(selected) : ""
  );

  // Sync local text when parent value changes externally (e.g., calendar pick)
  React.useEffect(() => {
    setText(selected ? dateToMMDDYYYY(selected) : "");
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const today = React.useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateInput(e.target.value);
    setText(formatted);
    if (formatted === "") {
      onChange("");
      return;
    }
    const parsed = parseDateInput(formatted);
    if (parsed && parsed >= today) onChange(dateToIso(parsed));
  };

  const handleTextBlur = () => {
    // Snap back to a valid display if text is incomplete/invalid
    setText(selected ? dateToMMDDYYYY(selected) : "");
  };

  return (
    <div className="relative w-[173px]">
      <Input
        type="text"
        inputMode="numeric"
        placeholder="MM/DD/YYYY"
        value={text}
        onChange={handleTextChange}
        onBlur={handleTextBlur}
        maxLength={10}
        className="w-full h-9 rounded-[10px] border-2 border-[#0000004c] pl-3 pr-9 text-sm"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blueBrand"
            aria-label="Open calendar"
          >
            <CalendarIcon className="h-4 w-4 text-gray-500" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(d) => {
              if (d) {
                onChange(dateToIso(d));
                setOpen(false);
              }
            }}
            disabled={{ before: today }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ListingCreationPricingAndTerms;
