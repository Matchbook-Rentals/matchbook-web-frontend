import { PAGE_MARGIN } from '@/constants/styles';
import SocialLinks from "@/components/SocialLinks";
import Footer from "@/components/marketing-landing-components/footer";
import MatchbookHeader from "@/components/marketing-landing-components/matchbook-header";
import Image from "next/image";
import { Montserrat } from 'next/font/google';
import { CareersIcon, InquiriesIcon, NewspaperIcon, SupportIcon } from "@/components/svgs/svg-components";
const montserrat = Montserrat({ subsets: ["latin"], variable: '--font-montserrat' });

export default function ContactPage() {
  return (
    <>
      <MatchbookHeader />
      <main className={`${PAGE_MARGIN} mx-auto px-4 py-8`}>
        {/* Page Title */}
        <h1 className='text-[32px] md:text-[48px] text-left mb-4 md:mb-8 font-normal'> Contact </h1>
        <div className='flex justify-between items-end px-1'>
          <h3 className={`${montserrat.className}`}>October 28, 2024</h3>
          <SocialLinks className='' />
        </div>

        {/* Hero Image */}
        <Image
          src={"/article-images/contact.png"}
          alt={"Blog article image"}
          width={1515}
          height={337}
          className="w-full mx-auto mt-1 md:w-full aspect-[1500/800] md:aspect-[1515/375] rounded-lg object-cover"
          priority={true}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1515px"
        />

        <h2 className="text-[36px] font-medium font-serif my-8">Contact Us</h2>
        <div className="grid md:grid-cols-2 gap-12">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Media and Press */}
            <div className="flex items-start gap-4">
              <NewspaperIcon className="h-10 w-10" />
              <div>
                <h3 className="font-medium mb-1 text-xl">Media and Press</h3>
                <a
                  href="mailto:press@matchbookrentals.com"
                  className="text-gray-600 hover:underline text-lg"
                >
                  press@matchbookrentals.com
                </a>
              </div>
            </div>

            {/* General Inquiries */}
            <div className="flex items-start gap-4">
              <InquiriesIcon className="h-10 w-10" />
              <div>
                <h3 className="font-medium mb-1 text-xl">General Inquiries</h3>
                <a
                  href="mailto:supports@matchbookrentals.com"
                  className="text-gray-600 hover:underline text-lg"
                >
                  info@matchbookrentals.com
                </a>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Support */}
            <div className="flex items-start gap-4">
              <SupportIcon className="h-10 w-10" />
              <div>
                <h3 className="font-medium mb-1 text-xl">Support</h3>
                <a
                  href="mailto:info@matchbookrentals.com"
                  className="text-gray-600 hover:underline text-lg"
                >
                  support@matchbookrentals.com
                </a>
              </div>
            </div>

            {/* Join our Team */}
            <div className="flex items-start gap-4">
              <CareersIcon className="h-10 w-10" />
              <div>
                <h3 className="font-medium mb-1 text-xl">Join our Team</h3>
                <a
                  href="mailto:careers@matchbookrentals.com"
                  className="text-gray-600 hover:underline text-lg"
                >
                  careers@matchbookrentals.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Headquarters */}

        {/* Follow Us */}
      </main>
      <Footer />
    </>
  );
}
