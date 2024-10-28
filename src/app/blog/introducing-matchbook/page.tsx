import React from 'react';
import Image from 'next/image';
import { PAGE_MARGIN } from '@/constants/styles';

const BlogArticle = () => {
  return (
    <div className={`${PAGE_MARGIN} mx-auto`}>
      <Image
        src={`/article-images/introduction.png`}
        alt={'Blog article image'}
        width={1515}
        height={337}
        className="w-full aspect-square lg:aspect-[1515/337] rounded-lg object-cover"
        priority={true} // Loads image immediately for better UX
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1515px"
      />
      <article className="max-w-2xl mx-auto prose prose-lg space-y-8 indent-4 my-4 sm:my-8 md:my-16">
        <div>
          <h1 className="text-4xl font-bold mb-1 text-center indent-0">Revolutionizing the Rental Experience</h1>
          <h2 className=" font-thin mb-6 text-left indent-0">from The Matchbook Team</h2>
        </div>
        <p>In an age of simplicity and efficiency, we are shocked by how annoying
          and redundant arguably the most important transaction, finding a place
          to live, still is. We are here to make renting easier for guests
          and hosts alike.</p>

        <p>We want to eliminate the clunky process of diving through random
          apartment listings on Craigslist or Facebook. We’re here to get rid
          of those $50+ fees per application because seriously? What are we
          paying for?</p>

        <p>We’re here to standardize and streamline the process across the
          board, so you know you can trust the fine print. And we’re here to
          make the process of finding an apartment fun—because right now, it’s
          just frustrating.</p>

        <p>With us, you’ll have the entire process of finding, renting, and
          rating a mid-term or long-term stay, all in one website and app.
          From searching, to matching, to booking, and managing all your
          monthly payments—we’ve got it here.</p>

        <h2 className="text-3xl font-semibold my-4">Our Story</h2>
        <p>After moving 50+ times in the last 10 years ourselves, we’re
          ready to change up the process, because lord knows, it’s about time.</p>

        <h2 className="text-3xl font-semibold my-4">Join Us</h2>
        <p>Ready to join us? Our launch is just a few months away, so
          subscribe to our email notifications if you want to say goodbye
          to the old process and welcome a new way of renting. Renting
          shouldn’t be so hard. Now it doesn’t have to be.</p>

        <div className="text-center mt-8">
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mt-12 rounded">
            Subscribe for Updates
          </button>
        </div>
      </article>
    </div>
  );
};

export default BlogArticle;
