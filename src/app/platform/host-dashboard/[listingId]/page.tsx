import { HelpCircleIcon } from "lucide-react";
import { ApplicationsIcon, BookingsIcon, ListingsIcon } from "@/components/icons/dashboard";
import { StarIcon } from "@/components/icons/marketing";
import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { APP_PAGE_MARGIN } from "@/constants/styles";

import { getListingById } from '@/app/actions/listings';
import PropertyDashboardClient from "./property-dashboard-client";
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

interface PropertyDashboardPageProps {
  params: { listingId: string }
}

const PropertyDashboardPage = async ({ params }: PropertyDashboardPageProps) => {
  const { listingId } = params;
  const listing = await getListingById(listingId);
  if (!listing) return notFound();
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PropertyDashboardClient listing={listing} />
    </Suspense>
  );
};

export default PropertyDashboardPage;
