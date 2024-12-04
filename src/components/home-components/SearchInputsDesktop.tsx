import React, { useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FaSearch } from "react-icons/fa";
import HeroDateRange from "@/components/ui/custom-calendar/date-range-selector/hero-date-range";
import { toast } from "@/components/ui/use-toast";
import HeroLocationSuggest from "./HeroLocationSuggest";
import { useAuth, useUser } from "@clerk/nextjs";

interface SearchInputsDesktopProps {
  dateRangeContent?: React.ReactNode;
  guestsContent?: React.ReactNode;
}

const SearchInputsDesktop: React.FC<SearchInputsDesktopProps> = ({
  dateRangeContent,
  guestsContent = <h1>Guests</h1>
}) => {
  const [hasAccess, setHasAccess] = React.useState(false);
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  React.useEffect(() => {
    const checkAccess = async () => {
      if (isSignedIn && user) {
        const userRole = user.publicMetadata.role as string;
        setHasAccess(userRole === 'moderator' || userRole === 'admin' || userRole === 'beta_user');
      } else {
        setHasAccess(false);
      }
    };

    checkAccess();
  }, [isSignedIn, user]);

  const [activeContent, setActiveContent] = React.useState<React.ReactNode | null>(null);
  const [totalGuests, setTotalGuests] = React.useState<number>(1);
  const [dateRange, setDateRange] = React.useState<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date(new Date().setMonth(new Date().getMonth() + 1))
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedLocation, setSelectedLocation] = React.useState({ destination: '', lat: null, lon: null });

  const inputClasses = `w-full px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none sm:border-r border-gray-300 ${hasAccess ? '' : 'cursor-not-allowed opacity-50'
    } bg-transparent`;

  // Replace separate moveIn/moveOut content with single dateRangeContent
  dateRangeContent = dateRangeContent ?? (
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

  const handleLocationSelect = (location: any) => {
    setSelectedLocation(location);
  };

  // Render different versions based on hasAccess
  if (!hasAccess) {
    return (
      <div ref={containerRef}>
        <div className="flex flex-row no-wrap p-3 items-center bg-gray-100 rounded-full shadow-md overflow-hidden">
          <input
            type="text"
            placeholder="Where to?"
            value={selectedLocation.description}
            className={inputClasses}
            readOnly
          />
          <input
            type="text"
            placeholder="Move in:"
            value={formatDate(dateRange.start)}
            className={inputClasses}
            readOnly
          />
          <input
            type="text"
            placeholder="Move out:"
            value={formatDate(dateRange.end)}
            className={inputClasses}
            readOnly
          />
          <input
            type="text"
            placeholder="Who?"
            value={`${totalGuests} guest${totalGuests !== 1 ? 's' : ''}`}
            className={`${inputClasses} sm:border-r-0`}
            readOnly
          />
          <div className="flex-shrink-0">
            <button
              disabled
              className="w-auto p-3 cursor-not-allowed opacity-50 bg-primaryBrand rounded-full"
            >
              <FaSearch className="text-white mx-auto" size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      <Popover>
        <PopoverTrigger className="w-full">
          <div className="flex flex-row no-wrap p-3 items-center bg-gray-100 rounded-full shadow-md overflow-hidden">
            <input
              type="text"
              placeholder="Where to?"
              value={selectedLocation.description}
              className={inputClasses}
              readOnly
              onClick={() => setActiveContent(<HeroLocationSuggest hasAccess={hasAccess} onLocationSelect={handleLocationSelect} />)}
            />
            <input
              type="text"
              placeholder="Move in:"
              value={formatDate(dateRange.start)}
              className={inputClasses}
              readOnly={!hasAccess}
              onClick={() => setActiveContent(dateRangeContent)}
            />
            <input
              type="text"
              placeholder="Move out:"
              value={formatDate(dateRange.end)}
              className={inputClasses}
              readOnly={!hasAccess}
              onClick={() => setActiveContent(dateRangeContent)}
            />
            <input
              type="text"
              placeholder="Who?"
              value={`${totalGuests} guest${totalGuests !== 1 ? 's' : ''}`}
              className={`${inputClasses} sm:border-r-0`}
              readOnly={!hasAccess}
              onClick={() => setActiveContent(guestsContent)}
            />
            <div className="flex-shrink-0">
              <button
                disabled={!hasAccess}
                className={`w-auto p-3 ${hasAccess ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                  } bg-primaryBrand rounded-full`}
              >
                <FaSearch className="text-white mx-auto" size={20} />
              </button>
            </div>
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
