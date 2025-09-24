'use client'

import {
  MapPinIcon,
  MoreVerticalIcon,
  PawPrintIcon,
  SearchIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { BrandButton } from "@/components/ui/brandButton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getOrCreateListingConversation } from "@/app/actions/housing-requests";

interface HousingRequestWithDetails {
  id: string;
  status: string;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    city: string;
    state: string;
    imageSrc: string | null;
    listingImages: Array<{
      id: string;
      url: string;
      category: string | null;
      rank: number | null;
    }>;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    } | null;
  };
  trip: {
    id: string;
    numAdults: number;
    numChildren: number;
    numPets: number;
  };
  hasMatch: boolean;
  hasBooking: boolean;
  bookingId: string | null;
  matchId: string | null;
}

interface ApplicationsClientProps {
  housingRequests: HousingRequestWithDetails[];
}

export default function ApplicationsClient({ housingRequests }: ApplicationsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredApplications = useMemo(() => {
    return filterAndTransformApplications(housingRequests, searchTerm, statusFilter);
  }, [housingRequests, searchTerm, statusFilter]);

  return (
    <div className="flex flex-col items-start gap-8 px-4 sm:px-6 py-6 sm:py-8 bg-[#f9f9f9] min-h-screen">
      <ApplicationsHeader />
      
      <div className="flex flex-col items-start gap-6 sm:gap-8 w-full">
        <SearchAndFilterBar 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        <ApplicationCards applications={filteredApplications} />
      </div>
    </div>
  );
}

const ApplicationsHeader = () => (
  <header className="flex items-end gap-6 w-full">
    <div className="flex flex-col items-start gap-2 flex-1">
      <h1 className="[font-family:'Poppins',Helvetica] font-medium text-[#020202] text-2xl tracking-[0] leading-[28.8px]">
        Applications
      </h1>
      <p className="[font-family:'Poppins',Helvetica] font-normal text-greygrey-500 text-base tracking-[0] leading-6">
        Here you can see pending, approved and declined applications and edit your general application
      </p>
    </div>
  </header>
);

interface SearchAndFilterBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

const SearchAndFilterBar = ({ 
  searchTerm, 
  onSearchChange, 
  statusFilter, 
  onStatusFilterChange 
}: SearchAndFilterBarProps) => (
  <div className="flex flex-col sm:flex-row items-start gap-3 w-full">
    <div className="relative w-full sm:w-auto sm:min-w-[300px] md:min-w-[400px] lg:w-[434px]">
      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      <Input
        placeholder="Search by title"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 h-12 bg-white rounded-lg border-gray-200 w-full"
      />
    </div>

    <div className="flex flex-row items-center justify-end gap-3 flex-1 w-full sm:w-auto">
      <span className="[font-family:'Poppins',Helvetica] font-normal text-greygrey-500 text-base tracking-[0] leading-6 whitespace-nowrap hidden sm:inline">
        Filter by status
      </span>

      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-full sm:w-[142px] h-12 bg-white">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="declined">Declined</SelectItem>
        </SelectContent>
      </Select>

      <BrandButton
        variant="outline"
        href="/app/rent/applications/general"
        className="w-full sm:w-auto whitespace-nowrap"
      >
        Edit General Application
      </BrandButton>
    </div>
  </div>
);

interface ApplicationCardsProps {
  applications: Array<{
    id: string;
    status: string;
    statusColor: string;
    title: string;
    appliedDate: string;
    location: string;
    adults: number;
    kids: number;
    pets: number;
    image: string;
    showMessageHost: boolean;
    showBookNow: boolean;
    showGoToBooking: boolean;
    bookingId: string | null;
    listingId: string;
    hostUserId: string | null;
    matchId: string | null;
  }>;
}

const ApplicationCards = ({ applications }: ApplicationCardsProps) => {
  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-8 justify-center py-12 text-gray-500 w-full">
        <img
          src="/host-dashboard/empty/applications.png"
          alt="No applications"
          className="w-full h-auto max-w-[260px] mb-0"
        />
        <div className="text-lg font-medium">
          No applications yet
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-6 sm:gap-8 w-full">
      {applications.map((application) => (
        <ApplicationCard key={application.id} application={application} />
      ))}
    </div>
  );
};

interface ApplicationCardProps {
  application: {
    id: string;
    status: string;
    statusColor: string;
    title: string;
    appliedDate: string;
    location: string;
    adults: number;
    kids: number;
    pets: number;
    image: string;
    showMessageHost: boolean;
    showBookNow: boolean;
    showGoToBooking: boolean;
    bookingId: string | null;
    listingId: string;
    hostUserId: string | null;
    matchId: string | null;
  };
}

const ApplicationCard = ({ application }: ApplicationCardProps) => (
  <Card className="w-full bg-white rounded-xl shadow-[0px_0px_5px_#00000029] border-0 p-4 sm:p-6">
    <CardContent className="p-0">
      {/* Mobile Layout - Column with rows */}
      <div className="flex flex-col gap-4 sm:hidden">
        {/* Row 1: Image | Menu Button */}
        <div className="flex flex-row items-start justify-between gap-4">
          <div 
            className="relative w-[105px] h-[70px] rounded-xl bg-cover bg-[50%_50%] flex-shrink-0" 
            style={{ backgroundImage: `url(${application.image})` }}
          />
          <BrandButton
            variant="outline"
            size="icon"
            className="p-2 rounded-lg"
          >
            <MoreVerticalIcon className="w-4 h-4" />
          </BrandButton>
        </div>

        {/* Row 2: Title | Status Badge */}
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="font-medium text-[#484a54] text-base flex-1 min-w-0 truncate">
            {application.title}
          </div>
          <Badge className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${application.statusColor}`}>
            {application.status}
          </Badge>
        </div>

        {/* Row 3: Location | Applied Date */}
        <div className="flex flex-row items-start justify-between gap-2">
          <div className="flex items-start gap-1 flex-1 min-w-0">
            <MapPinIcon className="w-4 h-4 text-[#777b8b] flex-shrink-0 mt-0.5" />
            <div className="text-xs text-[#777b8b] truncate">
              {application.location}
            </div>
          </div>
          <div className="text-xs text-[#777b8b] flex-shrink-0">
            {application.appliedDate.replace('Applied on ', '')}
          </div>
        </div>

        {/* Row 4: Trip Details */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <UserIcon className="w-4 h-4 text-[#344054]" />
            <span className="text-xs text-[#344054]">
              {application.adults} Adult{application.adults !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <UsersIcon className="w-4 h-4 text-[#344054]" />
            <span className="text-xs text-[#344054]">
              {application.kids} Kid{application.kids !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <PawPrintIcon className="w-4 h-4 text-[#344054]" />
            <span className="text-xs text-[#344054]">
              {application.pets} pet{application.pets !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Row 5: Action Buttons */}
        <MobileApplicationButtons application={application} />
      </div>

      {/* Desktop Layout - Keep existing horizontal layout */}
      <div className="hidden sm:flex items-start gap-2">
        <ApplicationContent application={application} />
        <ApplicationActions application={application} />
      </div>
    </CardContent>
  </Card>
);

const ApplicationContent = ({ application }: ApplicationCardProps) => (
  <div className="flex items-start gap-6 flex-1">
    <ApplicationImage image={application.image} title={application.title} />
    <ApplicationDetails application={application} />
  </div>
);

const ApplicationImage = ({ image, title }: { image: string; title: string }) => (
  <div className="w-[157px] h-[105px] lg:w-[209px] lg:h-[140px] rounded-xl overflow-hidden flex-shrink-0">
    <img
      className="w-full h-full object-cover"
      alt={title}
      src={image}
    />
  </div>
);

const ApplicationDetails = ({ application }: ApplicationCardProps) => (
  <div className="flex flex-col items-start gap-4 flex-1">
    <div className="flex flex-col items-start gap-2 w-full">
      <Badge className={`${application.statusColor} rounded-full px-2.5 py-1 text-sm font-medium`}>
        {application.status}
      </Badge>

      <h3 className="font-text-label-large-medium font-[number:var(--text-label-large-medium-font-weight)] text-[#484a54] text-[length:var(--text-label-large-medium-font-size)] tracking-[var(--text-label-large-medium-letter-spacing)] leading-[var(--text-label-large-medium-line-height)] [font-style:var(--text-label-large-medium-font-style)]">
        {application.title}
      </h3>

      <p className="font-text-label-small-regular font-[number:var(--text-label-small-regular-font-weight)] text-[#777b8b] text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)] [font-style:var(--text-label-small-regular-font-style)]">
        {application.appliedDate}
      </p>

      <div className="flex items-center gap-2 w-full">
        <MapPinIcon className="w-5 h-5 text-[#777b8b]" />
        <span className="[font-family:'Poppins',Helvetica] font-normal text-[#777b8b] text-sm tracking-[0] leading-[normal] flex-1">
          {application.location}
        </span>
      </div>

      <TripDetails 
        adults={application.adults} 
        kids={application.kids} 
        pets={application.pets} 
      />
    </div>
  </div>
);

interface TripDetailsProps {
  adults: number;
  kids: number;
  pets: number;
}

const TripDetails = ({ adults, kids, pets }: TripDetailsProps) => (
  <div className="flex items-center gap-6 w-full">
    <div className="flex items-center gap-1.5">
      <UserIcon className="w-5 h-5 text-[#344054]" />
      <span className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5">
        {adults} Adult{adults !== 1 ? 's' : ''}
      </span>
    </div>

    <div className="flex items-center gap-1.5">
      <UsersIcon className="w-5 h-5 text-[#344054]" />
      <span className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5">
        {kids} Kid{kids !== 1 ? 's' : ''}
      </span>
    </div>

    <div className="flex items-center gap-1.5">
      <PawPrintIcon className="w-5 h-5 text-[#344054]" />
      <span className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5">
        {pets} pet{pets !== 1 ? 's' : ''}
      </span>
    </div>
  </div>
);

const ApplicationActions = ({ application }: ApplicationCardProps) => (
  <div className="flex flex-col items-end justify-start gap-4 w-full md:w-auto md:min-w-[280px] flex-shrink-0">
    <div className="flex w-full md:justify-end justify-start">
      <BrandButton
        variant="outline"
        size="icon"
        className="p-2.5 rounded-lg"
      >
        <MoreVerticalIcon className="w-5 h-5" />
      </BrandButton>
    </div>

    <div className="flex flex-col md:items-end items-start justify-center gap-3 w-full md:flex-shrink-0">
      <div className="w-full [font-family:'Poppins',Helvetica] font-normal text-[#777b8b] text-base tracking-[0] leading-[normal] md:text-right text-left">
        {application.appliedDate}
      </div>

      <ApplicationButtons application={application} />
    </div>
  </div>
);

const ApplicationButtons = ({ application }: ApplicationCardProps) => {
  const router = useRouter();

  const handleMessageHost = async () => {
    if (!application.hostUserId) return;
    
    try {
      const result = await getOrCreateListingConversation(
        application.listingId, 
        application.hostUserId
      );
      
      if (result.success && result.conversationId) {
        router.push(`/app/rent/messages?convo=${result.conversationId}`);
      } else {
        console.error('Failed to create conversation:', result.error);
      }
    } catch (error) {
      console.error('Error messaging host:', error);
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center md:justify-end gap-2 md:gap-3 w-full">
      <BrandButton 
        variant="outline" 
        size="sm"
        href={`/app/rent/applications/${application.id}`}
        className="w-full md:w-auto whitespace-nowrap"
      >
        View this application
      </BrandButton>

      {application.showMessageHost && application.hostUserId && (
        <BrandButton 
          variant="outline" 
          size="sm"
          onClick={handleMessageHost}
          className="w-full md:w-auto whitespace-nowrap"
        >
          Message Host
        </BrandButton>
      )}

      {application.showBookNow && application.matchId && (
        <BrandButton
          variant="default"
          size="sm"
          href={`/app/rent/match/${application.matchId}`}
          className="w-full md:w-auto whitespace-nowrap"
        >
          Book Now
        </BrandButton>
      )}
      
      {application.showGoToBooking && application.bookingId && (
        <BrandButton 
          variant="default" 
          size="sm"
          href={`/app/rent/bookings/${application.bookingId}`}
          className="w-full md:w-auto whitespace-nowrap"
        >
          Go to Booking
        </BrandButton>
      )}
    </div>
  );
};

const MobileApplicationButtons = ({ application }: ApplicationCardProps) => {
  const router = useRouter();

  const handleMessageHost = async () => {
    if (!application.hostUserId) return;
    
    try {
      const result = await getOrCreateListingConversation(
        application.listingId, 
        application.hostUserId
      );
      
      if (result.success && result.conversationId) {
        router.push(`/app/rent/messages?convo=${result.conversationId}`);
      } else {
        console.error('Failed to create conversation:', result.error);
      }
    } catch (error) {
      console.error('Error messaging host:', error);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <BrandButton
        variant="outline"
        href={`/app/rent/applications/${application.id}`}
        className="w-full"
      >
        View this application
      </BrandButton>
      
      {application.showMessageHost && application.hostUserId && (
        <BrandButton
          variant="outline"
          onClick={handleMessageHost}
          className="w-full"
        >
          Message Host
        </BrandButton>
      )}

      {application.showBookNow && application.matchId && (
        <BrandButton
          variant="default"
          href={`/app/rent/match/${application.matchId}`}
          className="w-full"
        >
          Book Now
        </BrandButton>
      )}
      
      {application.showGoToBooking && application.bookingId && (
        <BrandButton 
          variant="default"
          href={`/app/rent/bookings/${application.bookingId}`}
          className="w-full"
        >
          Go to Booking
        </BrandButton>
      )}
    </div>
  );
};

const filterAndTransformApplications = (
  housingRequests: HousingRequestWithDetails[],
  searchTerm: string,
  statusFilter: string
) => {
  const filtered = housingRequests.filter((request) => {
    const matchesSearch = request.listing.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return filtered.map(transformHousingRequestToApplication);
};

const transformHousingRequestToApplication = (request: HousingRequestWithDetails) => {
  const statusColor = getStatusColor(request.status);
  const image = getListingImage(request.listing);
  const appliedDate = formatAppliedDate(request.createdAt);
  const location = formatLocation(request.listing.city, request.listing.state);
  
  return {
    id: request.id,
    status: capitalizeStatus(request.status),
    statusColor,
    title: request.listing.title,
    appliedDate,
    location,
    adults: request.trip.numAdults,
    kids: request.trip.numChildren,
    pets: request.trip.numPets,
    image,
    showMessageHost: request.status === "approved",
    showBookNow: request.status === "approved" && !request.hasBooking,
    showGoToBooking: request.status === "approved" && request.hasBooking,
    bookingId: request.bookingId,
    listingId: request.listing.id,
    hostUserId: request.listing.user?.id || null,
    matchId: request.matchId,
  };
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "approved":
      return "bg-[#e6f6fd] text-[#00a6e8] border-[#00a6e8]";
    case "declined":
      return "bg-[#fdeaea] text-[#e62e2e] border-[#e62e2e]";
    default:
      return "bg-[#fff2cc] text-[#b7950b] border-[#b7950b]";
  }
};

const getListingImage = (listing: HousingRequestWithDetails['listing']) => {
  if (listing.listingImages && listing.listingImages.length > 0) {
    const sortedImages = listing.listingImages.sort((a, b) => (a.rank || 999) - (b.rank || 999));
    return sortedImages[0].url;
  }
  return listing.imageSrc || "/placeholder-image.jpg";
};

const formatAppliedDate = (dateString: string) => {
  const date = new Date(dateString);
  return `Applied on ${date.toLocaleDateString('en-US', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  })}`;
};

const formatLocation = (city: string, state: string) => {
  return `${city}, ${state}`;
};

const capitalizeStatus = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};