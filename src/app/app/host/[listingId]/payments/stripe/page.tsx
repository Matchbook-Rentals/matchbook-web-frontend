import React from "react";
import { HOST_PAGE_STYLE } from "@/constants/styles";
import { HostPageTitle } from "../../(components)/host-page-title";
import StripeDashboardRedirect from "@/components/stripe/stripe-dashboard-redirect";

export default function ListingStripeSettingsPage() {
  return (
    <div className={HOST_PAGE_STYLE}>
      <HostPageTitle
        title="Stripe Settings"
        subtitle="Manage your Stripe Connect dashboard and payment settings"
      />
      <StripeDashboardRedirect />
    </div>
  );
}