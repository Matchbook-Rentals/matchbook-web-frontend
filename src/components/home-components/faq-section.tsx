import React from 'react';
import TabSelector from '@/components/ui/tab-selector';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Montserrat, Inter, Poppins } from 'next/font/google';
import MarketingContainer from '@/components/marketing-landing-components/marketing-container';

const montserrat = Montserrat({ subsets: ["latin"], variable: '--font-montserrat' });
const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const poppins = Poppins({ subsets: ["latin"], weight: ["500"], variable: '--font-poppins' });

interface Tab {
  value: string;
  label: string;
  icon?: React.ElementType;
  content: React.ReactNode;
  className?: string;
  textSize?: string;
}

const guestFaqData = [
  {
    "question": "What is MatchBook and how does it work?",
    "answer": "MatchBook is a place to find rentals that fit your needs and budget. Our curated marketplace connects renters like you with hosts offering a variety of rentals, all while we handle all the details."
  },
  {
    "question": "What types of rentals can I find on MatchBook?",
    "answer": "On MatchBook, you can find both furnished and unfurnished rentals, ranging from single rooms to single family homes. Lease options start from as little as 30 days up to full-year leases."
  },
  {
    "question": "Are there any hidden fees?",
    "answer": "At MatchBook, we believe in complete price transparency. That means the price you see on the listing is the price you pay, with no hidden fees. The only optional charges are MatchBook Renter Verification and a 3% fee if you choose to pay rent with a credit card instead of bank transfer."
  },
  {
    "question": "How is the MatchBook application process different?",
    "answer": "All properties on our platform accept the MatchBook Universal Application. It's as simple as clicking 'Apply,' and it's completely free. No more repetitive forms or fees, just a streamlined rental experience."
  },
  {
    "question": "How does MatchBook Renter Verification work?",
    "answer": (
      <>
        Matchbook Renter Verification is a background screening that includes a credit summary, criminal background, and eviction history check. When renters apply to properties on MatchBook, this screening is attached to the application. Matchbook Renter Verification is optional and costs $25 and is valid for 3 months.{" "}
        {/* <a href="#" className="text-blue-600 hover:text-blue-800 underline">
          See more
        </a> */}
      </>
    )
  },
  {
    "question": "What happens if I need to cancel a booking?",
    "answer": "If you need to cancel a booking, please contact your Host directly. Cancellations and refunds are initiated by Hosts and are governed by your Rental Agreement and applicable law."
  },
  {
    "question": "Can I apply to multiple properties at once?",
    "answer": "Yes, you can apply to as many properties as you'd like. To keep things manageable and ensure serious interest, MatchBook allows you to have up to five active applications at a time for a given search. If you reach that limit but find a property you like better, you can withdraw any of your active applications and submit a new one for your preferred listing."
  },
  {
    "question": "What payment methods are accepted on MatchBook?",
    "answer": "MatchBook offers free bank transfers as a convenient, no-cost payment option. If you prefer to use a credit card, you are welcome to do so for a 3% fee."
  },
  {
    "question": "How is my security deposit handled?",
    "answer": "On move-in day, your deposit is transferred to your host. After move-out, your host will evaluate any deductions and transfer the funds back to you in accordance with state and local regulations. Due to the varying regulations around security deposit return, hosts should coordinate with you to determine a good way for you to receive your deposit."
  },
  {
    "question": "What should I do if I need to extend my stay?",
    "answer": "If you'd like to extend your stay, simply reach out to your host. They can make the necessary changes, which you'll be able to approve before the extension is confirmed."
  }
];

const hostFaqData = [
  {
    "question": "What is MatchBook, and how does it work?",
    "answer": "MatchBook is the listing site and tool suite you have been waiting for. We offer our services completely free to hosts. No cost to list, no cost to accept applications, and no cost to securely transfer rent into your account on the first of every month. We offer a complete set of tools for you to list your property, receive applications, review qualified and verified prospective tenants, book them, and manage your calendar, all in one place."
  },
  {
    "question": "How do leases work on MatchBook?",
    "answer": "Our one-of-a-kind lease builder allows you to streamline the lease creation and signature process. Simply upload your lease, drag and drop the changeable fields such as renter name, dates, rent amount etc., and MatchBook will automatically generate the lease for each booking. When you accept an application, renters can sign the lease and book right on the platform. After they sign and book, you can sign and either download the lease for your records or keep it in your electronic record, on platform."
  },
  {
    "question": "How does MatchBook help ensure a smooth move-in process?",
    "answer": "On MatchBook, hosts can clearly outline check-in procedures which are shared with renters on move-in day. We also offer a messaging platform to keep communication open, making it easy to coordinate every step of the rental process. Our platform ensures that hosts and renters can seamlessly manage check-ins and maintain effective communication."
  },
  {
    "question": "How do I update my listing or availability on MatchBook?",
    "answer": "Hosts can easily update their listings and availability through the MatchBook host dashboard. You can make real-time changes to property details, pricing, and booking availability, ensuring your listings are always current. With centralized management tools, you can efficiently handle multiple properties, track bookings, and communicate with renters seamlessly."
  },
  {
    "question": "Can I sync my listings calendar if I get a booking on another website?",
    "answer": "Through our partners at Hospitable, we can automatically block out our availability if you receive a booking on other listings sites, like Airbnb."
  },
  {
    "question": "How are payments processed on MatchBook?",
    "answer": "Payments are scheduled at the time of booking and can be viewed by renters on their bookings page and by hosts on the host dashboard. If modifications are needed or requested, this can be done in the payments section of the host dashboard, but all changes must be approved by the renter before they take effect."
  }
];

const tabs: Tab[] = [
  {
    value: 'guest',
    label: 'Renter',
    className: 'px-0',
    textSize: 'text-base font-semibold leading-6 tracking-normal',
    content:
      <Accordion type="multiple" className="space-y-4" >
        {guestFaqData.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger alternativeArrow chevronClassName=' border-[1.5px] border-gray-400 text-gray-400 rounded-full group-hover:border-black group-hover:text-black transition-colors' className="group text-xl text-left pt-1 font-semibold flex items-start">{faq.question}</AccordionTrigger>
            <AccordionContent className=" text-[15px] text-tertiary pr-6">{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
  },
  {
    value: 'host',
    label: 'Host',
    className: 'px-0',
    textSize: 'text-base font-semibold leading-6 tracking-normal',
    content:
      <Accordion type="multiple" className="space-y-4" >
        {hostFaqData.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger alternativeArrow chevronClassName='border-[1.5px] border-gray-400 text-gray-400 rounded-full group-hover:border-black group-hover:text-black transition-colors' className="group text-xl text-left pt-1 font-semibold flex items-start">{faq.question}</AccordionTrigger>
            <AccordionContent className=" text-[15px] text-[#475467] pr-6">{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
  },
]

const FAQSection = () => {
  return (
    <MarketingContainer>
      <div className="w-full">
        {/* SEO Headings */}
        <div className="mb-8">
          <h1
            className={`font-medium text-center ${poppins.className}`}
            style={{
              fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
              lineHeight: '100%',
              letterSpacing: 'clamp(-1px, -0.1vw, -2px)',
            }}
          >
            Renter Questions
          </h1>
          <h2 className="sr-only">Host Questions</h2>
        </div>
        <TabSelector
          tabs={tabs}
          tabsListClassName={`px-0 space-x-6  border-b-0 ${inter.className}`}
          tabsClassName='border-0 [&[data-state=active]]:shadow-none'
          className='border-0 mb-8 px-0 '
          selectedTabColor='#0B6E6E'
        />
      </div>
    </MarketingContainer>
  );
};

export default FAQSection;
