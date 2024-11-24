
import React from 'react';
import TabSelector from '@/components/ui/tab-selector';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import MatchbookHeader from '@/components/marketing-landing-components/matchbook-header';
import { Montserrat } from 'next/font/google';
import Footer from '@/components/marketing-landing-components/footer';

const montserrat = Montserrat({ subsets: ["latin"], variable: '--font-montserrat' });



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
    question: "What is MatchBook, and how does it work?",
    answer: "We think the current status quo in the rental market is pretty annoying. Why is it so difficult to find rentals that fit your lifestyle and budget? Matchbook is designed to make finding a place as easy as online shopping. We have built a curated marketplace where housing providers and guests are able to come together while we handle details."
  },
  {
    question: "What types of rentals can I find on Matchbook?",
    answer: "On Matchbook, you can find both furnished and unfurnished rentals, from single room to single family, with flexible lease options ranging from as little as 30 days to full-year leases."
  },
  {
    question: "Are there any hidden fees?",
    answer: "We believe in complete price transparency. For you that means that the price you see on the listing is the price you pay. We love surprises, just not that kind"
  },
  {
    question: "How is the Matchbook application process different?",
    answer: "Filling out one application is already a hassle, having to do it for each property is unthinkable. We can do better. All properties on our platform accept our matchbook universal application. Its as simple as clicking apply. Oh, and its completely free."
  },
  {
    question: "How does Matchbook verification work?",
    answer: "We offer the Matchbook verified badge to those guests who choose to complete a simple screening that includes a credit, criminal history, and eviction check. This screening is shared with your application and is valid for up to 3 months."
  },
  {
    question: "What happens if I need to cancel a booking?",
    answer: "We offer a 24-hour, no-questions-asked cancellation policy. If you cancel after this period and before move-in day, you'll forfeit your deposit but will still receive a refund for your first month's rent. Cancelations after move in must be arranged with your host."
  },
  {
    question: "Can I apply to multiple properties at once?",
    answer: "Yes, you can apply to as many properties as you'd like! To ensure serious interest, we limit the number of open applications to five at a time, so if you've applied to 5 properties but find something you like more, you can withdraw one of your open applications and submit a new one to the place you like more!"
  },
  {
    question: "What payment methods are accepted on Matchbook?",
    answer: "Matchbook offers free bank transfers as a convenient, no-cost option, and also accepts credit card payments with a small fee."
  },
  {
    question: "How is my security deposit handled?",
    answer: "When you book a property, Matchbook securely holds your security deposit until move-in day. Once both the host and guest verify check-in, the deposit is transferred to the host. At the end of the lease, if no damages require repair, the host will approve a return transfer of the deposit to you."
  },
  {
    question: "What should I do if I need to extend my stay?",
    answer: "If you'd like to extend your stay, reach out to your host. They can make the necessary changes, which you'll be able to approve before the extension is confirmed."
  }
];

const hostFaqData = [
  {
    question: "What is MatchBook, and how does it work?",
    answer: "We think the current status quo in the rental market is pretty annoying. Why is it so difficult to find rentals that fit your lifestyle and budget? Matchbook is designed to make finding a place as easy as online shopping. We have built a curated marketplace where housing providers and guests are able to come together while we handle details."
  },
  {
    question: "What features does Matchbook offer to support hosts?",
    answer: "Matchbook provides state-compliant leases valid in all 50 states, built-in guest screening at no cost to you, payment processing, and a calendar management system to keep everything organized in one place."
  },
  {
    question: "How are leases generated on Matchbook?",
    answer: "To simplify the process for hosts, Matchbook generates leases automatically. We ask a few straightforward questions, and your answers are used to complete the lease without the hassle of manually placing text boxes or filling out fields."
  },
  {
    question: "How do I update my listing or availability on Matchbook?",
    answer: "Hosts can easily update their listing and availability through the host dashboard."
  },
  {
    question: "How does Matchbook help ensure a smooth move-in process?",
    answer: "Matchbook provides guests with detailed check-in information, allowing hosts to clearly outline check-in procedures. We also offer a messaging platform to keep communication open, making it easy to coordinate every step of the process."
  },
  {
    question: "How are payments processed on Matchbook?",
    answer: "Payments are scheduled at the time of booking and can be viewed by the guest in their stay information and by the host in the host dashboard. If modifications are needed, the host can make adjustments, but any changes must be approved by the guest before they take effect."
  }
];

const tabs: Tab[] = [
  {
    value: 'guest',
    label: 'Guest',
    textSize: 'text-xl',
    content:
      <Accordion type="multiple" className="space-y-4" >
        {guestFaqData.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger alternativeArrow chevronClassName='mt-2' className="text-xl text-left pt-0 font-semibold flex items-start">{faq.question}</AccordionTrigger>
            <AccordionContent className=" text-[15px] pr-6">{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
  },
  {
    value: 'host',
    label: 'Host',
    textSize: 'text-xl',
    content:
      <Accordion type="multiple" className="space-y-4" >
        {hostFaqData.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger alternativeArrow chevronClassName='mt-2' className="text-xl text-left pt-0 font-semibold flex items-start">{faq.question}</AccordionTrigger>
            <AccordionContent className=" text-[15px] pr-6">{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
  },
]

const FAQPage = () => {
  return (
    <>
      <MatchbookHeader />
      <div className=" w-full md:w-[90vw] lg:w-[80vw] px-2 md:px-0 mx-auto mt-10 ">
        <h1 className="text-3xl  mb-8">Frequently Asked Questions</h1>
        <TabSelector
          tabs={tabs}
          tabsListClassName={`p-0 border-b-0 ${montserrat.className}`}
          tabsClassName='border-0 [&[data-state=active]]:shadow-none'
          className='border-0 mb-8'
        />
      </div>
      <Footer />
    </>
  );
};

export default FAQPage;
