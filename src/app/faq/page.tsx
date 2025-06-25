
import React from 'react';
import TabSelector from '@/components/ui/tab-selector';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import MatchbookHeader from "@/components/marketing-landing-components/matchbook-header";
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
    "question": "What is MatchBook, and how does it work?",
    "answer": "Are you frustrated with the current rental market? Finding rentals that align with your lifestyle and budget shouldn't be so difficult. Matchbook is revolutionizing the way you search for your next home by making it as easy as online shopping. Our curated marketplace connects housing providers offering all types of rentals—short-term, mid-term, long-term, furnished, and unfurnished—with guests like you, while we handle all the details. Experience a seamless rental search with Matchbook today."
  },
  {
    "question": "What types of rentals can I find on Matchbook?",
    "answer": "On Matchbook, you can find both furnished and unfurnished rentals, ranging from single rooms to single-family homes. With flexible lease options starting from as little as 30 days up to full-year leases, we cater to your unique needs. Whether you're seeking a short-term stay or a long-term residence, Matchbook connects you with rentals that fit your lifestyle and budget. Explore our curated marketplace today and find your ideal home effortlessly."
  },
  {
    "question": "Are there any hidden fees?",
    "answer": "At Matchbook, we believe in complete price transparency. That means the price you see on the listing is the price you pay—no hidden fees or unexpected charges. We love surprises, just not that kind. Experience straightforward and honest renting with Matchbook today."
  },
  {
    "question": "How is the Matchbook application process different?",
    "answer": "Filling out multiple rental applications is a hassle. At Matchbook, we do better. All properties on our platform accept the Matchbook Universal Application. It's as simple as clicking 'Apply,' and it's completely free. No more repetitive forms or fees—just a streamlined rental experience. Simplify your rental search with Matchbook today."
  },
  {
    "question": "How does Matchbook verification work?",
    "answer": "We offer the Matchbook Verified Badge to guests who complete a simple screening that includes a credit check, criminal history, and eviction check. This screening is shared with your application and is valid for up to 3 months. By becoming Matchbook Verified, you increase your trustworthiness to housing providers, making your rental applications more competitive."
  },
  {
    "question": "What happens if I need to cancel a booking?",
    "answer": "We offer a 24-hour, no-questions-asked cancellation policy. If you cancel after this period but before move-in day, you'll forfeit your deposit but still receive a refund for your first month's rent. Cancellations after move-in must be arranged directly with your host."
  },
  {
    "question": "Can I apply to multiple properties at once?",
    "answer": "Yes, you can apply to as many properties as you'd like! To ensure serious interest, we limit the number of open applications to five at a time. If you've applied to five properties but find something you like more, simply withdraw one of your open applications and submit a new one to your preferred listing."
  },
  {
    "question": "What payment methods are accepted on Matchbook?",
    "answer": "Matchbook offers free bank transfers as a convenient, no-cost payment option. We also accept credit card payments with a small fee, providing you with flexible and hassle-free ways to secure your rental."
  },
  {
    "question": "How is my security deposit handled?",
    "answer": "When you book a property, Matchbook holds your security deposit until move-in day. Once both the host and guest verify check-in, the deposit is transferred to the host. At the end of the lease, if no damages require repair, the host will approve returning the deposit to you. Experience peace of mind with our transparent deposit process."
  },
  {
    "question": "What should I do if I need to extend my stay?",
    "answer": "If you'd like to extend your stay, simply reach out to your host. They can make the necessary changes, which you'll be able to approve before the extension is confirmed. Enjoy a seamless and flexible rental experience with Matchbook."
  }
];

const hostFaqData = [
  {
    "question": "What is MatchBook, and how does it work?",
    "answer": "As a host, finding the right tenants who appreciate your property and meet your requirements shouldn't be a daunting task—or break the bank. Matchbook is here to change that. We've created a streamlined rental platform that makes connecting with quality guests as simple as a few clicks, all at an affordable rate. Our curated marketplace brings together hosts and potential renters, offering a wide range of rental options from single rooms to entire homes. We handle all the details—from applications to payments—saving you time and money. With Matchbook, you can manage your listings effortlessly, enjoy secure transactions, and provide exceptional accommodations without the usual stress. Focus on what you do best: hosting. Let Matchbook simplify your hosting journey today, efficiently and affordably."
  },
  {
    "question": "How are leases generated on Matchbook?",
    "answer": "To streamline the hosting process, Matchbook automatically generates state-compliant leases for you. Simply answer a few straightforward questions, and our platform will complete the lease without the hassle of manually placing text boxes or filling out fields. This efficient system saves you time and ensures that all necessary legal requirements are met. Focus on providing excellent accommodations while Matchbook handles the paperwork, making rental management effortless and stress-free."
  },
  {
    "question": "How does Matchbook help ensure a smooth move-in process?",
    "answer": "Matchbook provides guests with detailed check-in information, allowing hosts to clearly outline check-in procedures. We also offer a messaging platform to keep communication open, making it easy to coordinate every step of the rental process. Our platform ensures that hosts and guests can seamlessly manage check-ins and maintain effective communication, enhancing the overall rental experience. Trust Matchbook to streamline your hosting and guest interactions efficiently."
  },
  {
    "question": "How do I update my listing or availability on Matchbook?",
    "answer": "Hosts can easily update their listings and availability through the Matchbook host dashboard. Our intuitive platform allows you to make real-time changes to property details, pricing, and booking availability, ensuring your listings are always current. With centralized management tools, you can efficiently handle multiple properties, track bookings, and communicate with guests seamlessly. Matchbook's host dashboard simplifies the entire process, saving you time and helping you maximize your rental potential. Experience streamlined property management and enhance your hosting efficiency with Matchbook today."
  },
  {
    "question": "What features does Matchbook offer to support hosts?",
    "answer": "Matchbook offers a complete suite of tools to simplify your rental management. We provide state-compliant leases valid in all 50 states, ensuring your agreements meet local regulations. Our built-in guest screening is available at no cost to you, helping you select reliable tenants effortlessly. With secure payment processing, managing your rental income is seamless and hassle-free. Additionally, our calendar management system keeps all your bookings organized in one place, preventing scheduling conflicts and maximizing your property's occupancy. Experience efficient and stress-free rental management with Matchbook's all-in-one platform."
  },
  {
    "question": "How are payments processed on Matchbook?",
    "answer": "Payments are scheduled at the time of booking and can be viewed by guests in their stay information and by hosts in the host dashboard. If modifications are needed, hosts can make adjustments, but any changes must be approved by the guest before they take effect. Matchbook ensures transparent and flexible payment management, providing both hosts and guests with clear visibility and control over their transactions. Experience hassle-free payment handling and maintain trust with your rental interactions through Matchbook."
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
    textSize: 'text-xl ',
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
          tabsListClassName={`p-0 test border-b-0 ${montserrat.className}`}
          tabsClassName='border-0 [&[data-state=active]]:shadow-none'
          className='border-0 mb-8'
          //selectedTabColor='#0B6E6E'
        />
      </div>
      <Footer />
    </>
  );
};

export default FAQPage;
