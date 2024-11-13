import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PAGE_MARGIN } from '@/constants/styles';
import SubscribeDialog from '@/components/marketing-landing-components/subscribe-dialog';
import SocialLinks from '@/components/SocialLinks';
import { Montserrat } from 'next/font/google';
const montserrat = Montserrat({ subsets: ["latin"], variable: '--font-montserrat' });

const BlogArticle = () => {
  return (
    <div className={`${PAGE_MARGIN} mx-auto py-8`}>
      <h1 className="text-[32px] md:text-[48px] text-left mb-4 md:mb-8 font-normal">

        <Link href="/articles" className="hover:underline">Articles</Link> &gt; Introduction
      </h1>
      <div className='flex justify-between px-1'>
        <h3 className={`${montserrat.className}`}>October 28, 2024</h3>

        <SocialLinks className='mb-1' />
      </div>
      <Image
        src={"/article-images/introduction.png"}
        alt={"Blog article image"}
        width={1515}
        height={337}
        className="w-full mx-auto md:w-full aspect-[1500/800] md:aspect-[1515/375] rounded-lg object-cover"
        priority={true}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1515px"
      />
      <article className="w-full mx-auto prose prose-sm md:prose-base lg:prose-lg text-left space-y-4  my-4 sm:my-8 md:my-16 bg-white rounded-xl">
        <div>
          <h1 className="text-[36px] font-semibold mb-1 text-left ">Introduction</h1>
        </div>
        <div className="w-full mx-auto bg-background pb-8 font-medium rounded-lg  space-y-4">
          <p className="mb-6">
            Finding a new place should be an exciting time; a time to celebrate new beginnings and
            fresh starts. The trouble is, currently the process of finding and renting a new spot is a
            pain in the ass... especially, if like many folks out there your rental needs don&apos;t
            fall into the traditional.
          </p>
          <p className="mb-6">
            After moving over 30 times in the last 10 years, my wife and I were so fed up that we
            decided to do something about it. MatchBook is designed to eliminate the ass pain and make
            the process of renting easy for both parties.
          </p>
          <p>
            We want to eliminate the clunky process of diving through random apartment listings on
            Craigslist, Facebook or Furnished Finders. We&apos;re here to get rid of $50+ fees per
            application, because seriously? We&apos;re here to standardize and streamline the lease
            process across the board, so you know you can trust the fine print. We&apos;re here to
            provide a simple and intuitive interface that helps you sift through the rough to find the
            diamonds. With us, you&apos;ll have the entire process of finding, renting, and rating a
            mid-term or long-term stay, all in one platform. From searching, to matching, to booking,
            and all your monthly payments- we&apos;ve got it here.
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
export default BlogArticle;
