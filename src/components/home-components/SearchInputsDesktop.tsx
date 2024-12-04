import React, { useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FaSearch } from "react-icons/fa";
import HeroDateRange from "@/components/ui/custom-calendar/date-range-selector/hero-date-range";

interface SearchInputsDesktopProps {
  hasAccess: boolean;
  locationContent?: React.ReactNode;
  moveInContent?: React.ReactNode;
  moveOutContent?: React.ReactNode;
  guestsContent?: React.ReactNode;
}

const SearchInputsDesktop: React.FC<SearchInputsDesktopProps> = ({
  hasAccess,
  locationContent = <h1>Location</h1>,
  moveInContent,
  moveOutContent,
  guestsContent = <h1>Guests</h1>
}) => {
  const [activeContent, setActiveContent] = React.useState<React.ReactNode | null>(null);
  const [location, setLocation] = React.useState<string>("");

  // Calculate initial end date (1 month from today)
  const calculateEndDate = () => {
    const today = new Date();
    const endDate = new Date(today);

    // Get the target month's last day
    endDate.setMonth(endDate.getMonth() + 1);

    // If the day of month exceeds the target month's length, set to last day
    const targetDay = today.getDate();
    endDate.setDate(1); // Move to first of next month
    endDate.setDate(Math.min(targetDay, new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate()));

    return endDate;
  };

  const [dateRange, setDateRange] = React.useState({
    start: new Date(),
    end: calculateEndDate()
  });

  const [totalGuests, setTotalGuests] = React.useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const inputClasses = `w-full px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none sm:border-r border-gray-300 ${
    hasAccess ? '' : 'cursor-not-allowed opacity-50'
  } bg-transparent`;

  // Set default values after state is initialized
  moveInContent = moveInContent ?? <HeroDateRange start={new Date()} end={new Date()} handleChange={(start, end) => setDateRange({ start, end })} />;
  moveOutContent = moveOutContent ?? (
    <HeroDateRange
      start={dateRange.start}
      end={dateRange.end}
      handleChange={(start, end) => setDateRange({ start, end })}
    />
  );

  // Format the dates for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div ref={containerRef}>
      <Popover>
        <PopoverTrigger className="w-full">
          <div className="flex flex-row p-3 items-center bg-gray-100 rounded-full shadow-md overflow-hidden">
            <input
              type="text"
              placeholder="Where to?"
              value={location || "Where to?"}
              className={inputClasses}
              readOnly={!hasAccess}
              onClick={() => setActiveContent(locationContent)}
            />
            <input
              type="text"
              placeholder="Move in:"
              value={formatDate(dateRange.start)}
              className={inputClasses}
              readOnly={!hasAccess}
              onClick={() => setActiveContent(moveInContent)}
            />
            <input
              type="text"
              placeholder="Move out:"
              value={formatDate(dateRange.end)}
              className={inputClasses}
              readOnly={!hasAccess}
              onClick={() => setActiveContent(moveOutContent)}
            />
            <input
              type="text"
              placeholder="Who?"
              value={`${totalGuests} guest${totalGuests !== 1 ? 's' : ''}`}
              className={`${inputClasses} sm:border-r-0`}
              readOnly={!hasAccess}
              onClick={() => setActiveContent(guestsContent)}
            />
            <button
              disabled={!hasAccess}
              className={`w-auto p-3 ${
                hasAccess ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
              } bg-primaryBrand rounded-full`}
            >
              <FaSearch className="text-white mx-auto" size={20} />
            </button>
          </div>
        </PopoverTrigger>

        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0 rounded-xl"
          align="start"
          sideOffset={8}
        >
          {activeContent}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SearchInputsDesktop;