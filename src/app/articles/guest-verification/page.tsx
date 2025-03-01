import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PAGE_MARGIN } from '@/constants/styles';
import SubscribeDialog from '@/components/marketing-landing-components/subscribe-dialog';
import SocialLinks from '@/components/SocialLinks';
import { Montserrat } from 'next/font/google';
const montserrat = Montserrat({ subsets: ["latin"], variable: '--font-montserrat' });

const GuestVerificationArticle = () => {
  return (
    <div className={`${PAGE_MARGIN} mx-auto py-8`}>
      <h1 className="text-[32px] md:text-[48px] text-left mb-4 md:mb-8 font-normal">
        <Link href="/articles" className="hover:underline">Articles</Link> &gt; Guest Verification
      </h1>
      <div className='flex justify-between px-1'>
        <h3 className={`${montserrat.className}`}>February 26, 2025</h3>
        <SocialLinks className='mb-1' />
      </div>
      <Image
        src={"/article-images/contact.png"}
        alt={"Guest Verification article image"}
        width={1515}
        height={337}
        className="w-full mx-auto md:w-full aspect-[1500/800] md:aspect-[1515/375] rounded-lg object-cover"
        priority={true}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1515px"
      />
      <article className="w-full mx-auto prose prose-sm md:prose-base lg:prose-lg text-left space-y-4 my-4 sm:my-8 md:my-16 bg-white rounded-xl">
        <div>
          <h1 className="text-[36px] font-semibold mb-1 text-left">MatchBook Guest Verification: Stand Out Without Breaking the Bank</h1>
        </div>
        <div className="w-full mx-auto bg-background pb-8 font-medium rounded-lg space-y-4">
          <h2 className="text-2xl font-semibold mt-8">Let&apos;s Talk About Rental Application Fees (a.k.a. The Worst)</h2>
          <p className="mb-6">
            Applying for rentals shouldn&apos;t feel like a financial black hole. Yet, most renters drop <strong>$50+ per application</strong>—per person—just to <em>maybe</em> get a response. It&apos;s a system designed to drain your wallet, not get you housed.
          </p>
          <p className="mb-6">
            That&apos;s where we flip the script.
          </p>
          <p className="mb-6">
            On our platform, you can <strong>apply to properties for free</strong> (yes, FREE). No upfront costs, no wasted application fees. But if you want to <strong>stand out to landlords</strong>, we&apos;ve got an optional tool that can help: <strong>MatchBook Guest Verification.</strong>
          </p>

          <h2 className="text-2xl font-semibold mt-8">What Is MatchBook Guest Verification?</h2>
          <p className="mb-6">
            Think of it as a <strong>supercharged rental application</strong>—but without the constant cash drain. For just <strong>$25</strong>, you get a <strong>criminal history, credit check, and eviction history report</strong>—and here&apos;s the kicker: <strong>you keep the report</strong>. It&apos;s yours to review, dispute if needed, and use for as many applications as you&apos;d like over <strong>three months</strong>—on MatchBook <em>or</em> anywhere else.
          </p>
          <p className="mb-6">
            It&apos;s not required, but some landlords may <strong>prefer renters who provide it</strong> because it gives them instant insight into your rental background.
          </p>

          <h3 className="text-xl font-semibold mt-6">Here&apos;s How It Works:</h3>
          <ul className="list-disc pl-6 mb-6">
            <li><strong>Apply for free</strong> to properties on our platform—no MatchBook Guest Verification required.</li>
            <li>Want to <strong>boost your application?</strong> Get MatchBook Guest Verified for a <strong>one-time</strong> $25 fee.</li>
            <li>Get your MGV <strong>report</strong>, review it, and make sure everything looks good.</li>
            <li><strong>Use it as many times as you want</strong>—on our platform <em>or</em> off.</li>
            <li>Found a rental elsewhere? <strong>Send the landlord your MatchBook report</strong> instead of paying another screening fee.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8">Why Bother with MatchBook Guest Verification?</h2>
          <ul className="list-disc pl-6 mb-6">
            <li><strong>Control Your Own Data</strong> – The report belongs to YOU. Review it first, dispute errors, and decide who sees it.</li>
            <li><strong>Save Money</strong> – Stop paying <strong>$50+ per application</strong>. One report, unlimited uses, <strong>three months</strong>.</li>
            <li><strong>Look More Reliable to Hosts</strong> – Some hosts prefer renters with verified reports because it speeds up the decision-making process and ensures you&apos;re a quality guest.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8">The Bottom Line</h2>
          <p className="mb-6">
            You don&apos;t have to use MatchBook Guest Verification to apply, but if you want an edge in a competitive rental market, it&apos;s a small investment that can make a big difference.
          </p>
          <p className="mb-6">
            Why waste money on application fees when you could <strong>apply for free, take control of your own rental history, and stand out to landlords</strong>—all for less than the cost of nice (or not so nice, thanks inflation) dinner?
          </p>
          <p className="mb-6">
            Ready to rent smarter? Check out MatchBook Guest Verification today.
          </p>

          {/* Signature */}
          <div className='flex flex-col items-end'>
            <h4 className='font-medium text-[34px]'> Daniel Resner </h4>
            <h5 className='text-[20px] font-normal'> Co-Founder &amp; CEO </h5>
          </div>
        </div>
      </article>
    </div>
  );
};

export default GuestVerificationArticle;