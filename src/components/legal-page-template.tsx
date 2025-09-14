import React from "react";
import MatchbookHeader from "@/components/marketing-landing-components/matchbook-header";
import Footer from "@/components/marketing-landing-components/footer";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

interface UserObject {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  emailAddresses?: { emailAddress: string }[];
  publicMetadata?: Record<string, any>;
}

interface LegalPageTemplateProps {
  userId: string | null;
  user: UserObject | null;
  isSignedIn: boolean;
  pageTitle: string;
  children?: React.ReactNode;
}

export default function LegalPageTemplate({
  userId,
  user,
  isSignedIn,
  pageTitle,
  children
}: LegalPageTemplateProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <MatchbookHeader 
        userId={userId} 
        user={user} 
        isSignedIn={isSignedIn} 
      />
      
      <main className="flex-1 container mx-auto px-6 py-2">
        <Breadcrumb className="mt-3">
          <BreadcrumbList className="flex items-center gap-[15px]">
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                <img src="/logo-small.svg" alt="Home" className="w-[18px] h-[18px] -translate-y-[1px]" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-small text-gray-3500">
              /
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="[font-family:'Poppins',Helvetica] font-normal text-gray-3900 text-[14px] md:text-base leading-6">
                {pageTitle}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-8 w-full">
          <h1 className="mb-6" style={{
            color: '#373940',
            fontFamily: 'Poppins',
            fontSize: '28px',
            fontStyle: 'normal',
            fontWeight: 500,
            lineHeight: 'normal'
          }}>
            {pageTitle}
          </h1>
          
          <div className="border border-gray-300 rounded-2xl p-8 w-full" style={{ borderRadius: '16px' }}>
            <div className="prose prose-gray max-w-none" style={{ 
              color: '#373940',
              fontFamily: 'Poppins',
              fontSize: '14px',
              fontStyle: 'normal',
              fontWeight: 400,
              lineHeight: 'normal'
            }}>
              {children || (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Placeholder Content</h2>
                    <p>
                      This is a placeholder for the {pageTitle} page. The actual legal content will be provided and inserted here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
