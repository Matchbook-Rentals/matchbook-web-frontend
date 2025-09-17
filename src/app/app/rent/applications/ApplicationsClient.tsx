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
    <div className="flex flex-col items-start gap-6 px-6 py-8 bg-[#f9f9f9] min-h-screen">
      <ApplicationsHeader />
      
      <div className="flex flex-col items-start gap-[18px] w-full">
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
  <div className="flex items-start gap-3 w-full">
    <div className="relative w-[434px]">
      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      <Input
        placeholder="Search by title"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 h-12 bg-white rounded-lg border-gray-200"
      />
    </div>

    <div className="flex items-center justify-end gap-3 flex-1">
      <span className="[font-family:'Poppins',Helvetica] font-normal text-greygrey-500 text-base tracking-[0] leading-6 whitespace-nowrap">
        Filter by status
      </span>

      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[142px] h-12 bg-white">
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
  }>;
}

const ApplicationCards = ({ applications }: ApplicationCardsProps) => (
  <div className="flex flex-col items-start gap-6 w-full">
    {applications.map((application) => (
      <ApplicationCard key={application.id} application={application} />
    ))}
  </div>
);

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
  };
}

const ApplicationCard = ({ application }: ApplicationCardProps) => (
  <Card className="w-full bg-white rounded-xl shadow-[0px_0px_5px_#00000029] border-0">
    <CardContent className="p-6">
      <div className="flex items-start gap-2">
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
  <div className="w-[209px] h-[140px] rounded-xl overflow-hidden flex-shrink-0">
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
  <div className="flex flex-col w-[219px] items-end justify-between h-[147px]">
    <div className="flex justify-end">
      <BrandButton
        variant="outline"
        size="icon"
      >
        <MoreVerticalIcon className="w-5 h-5" />
      </BrandButton>
    </div>

    <div className="text-right">
      <p className="[font-family:'Poppins',Helvetica] font-normal text-[#777b8b] text-base tracking-[0] leading-[normal]">
        {application.appliedDate}
      </p>
    </div>

    <ApplicationButtons application={application} />
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
    <div className="flex items-center gap-3">
      <BrandButton variant="outline" size="sm">
        View this application
      </BrandButton>

      {application.showMessageHost && application.hostUserId && (
        <BrandButton 
          variant="outline" 
          size="sm"
          onClick={handleMessageHost}
        >
          Message Host
        </BrandButton>
      )}

      {application.showBookNow && (
        <BrandButton variant="default" size="sm">
          Book Now
        </BrandButton>
      )}
      
      {application.showGoToBooking && application.bookingId && (
        <BrandButton 
          variant="default" 
          size="sm"
          href={`/app/rent/bookings/${application.bookingId}`}
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