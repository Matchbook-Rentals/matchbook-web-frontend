import SocialLinks from '@/components/SocialLinks';
import { PAGE_MARGIN } from '@/constants/styles';
import prisma from '@/lib/prismadb'
import { BlogArticle } from '@prisma/client';
import Image from 'next/image';
import Link from 'next/link';
import { Montserrat } from 'next/font/google';
import SubscribeDialog from '@/components/marketing-landing-components/subscribe-dialog';

const montserrat = Montserrat({ subsets: ["latin"], variable: '--font-montserrat' });

async function getBlogArticles(): Promise<BlogArticle[]> {
  const articles = await prisma.blogArticle.findMany({
    orderBy: {
      published: 'desc'
    }
  });
  return articles;
}

// For type safety when combining different article sources
interface ArticleDisplay {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  imageUrl: string;
  date: Date;
  isHardcoded?: boolean;
}

export default async function Home() {
  const dbArticles = await getBlogArticles();

  // Hardcoded articles that are not in the database
  const hardcodedArticles: ArticleDisplay[] = [
    {
      id: 'guest-verification',
      title: 'MatchBook Guest Verification',
      excerpt: "Applying for rentals shouldn't feel like a financial black hole. Stand out without breaking the bank.",
      slug: 'guest-verification',
      imageUrl: '/article-images/contact.png',
      date: new Date('2025-02-26'), // Parse the date string into a Date object
      isHardcoded: true
    },
    {
      id: 'introduction',
      title: 'Introduction',
      excerpt: 'Finding a new place should be an exciting time; a time to celebrate new beginnings and fresh starts.',
      slug: 'introduction',
      imageUrl: '/article-images/introduction.png',
      date: new Date('2024-10-28'), // Parse the date string into a Date object
      isHardcoded: true
    }
  ];

  // Convert database articles to the common format
  const formattedDbArticles: ArticleDisplay[] = dbArticles.map(article => ({
    id: article.id,
    title: article.title || 'Unnamed Article',
    excerpt: article.excerpt || '',
    slug: article.slug,
    imageUrl: '/article-images/introduction.png', // Default image
    date: new Date(article.createdAt), // Always use createdAt as a reliable date source
    isHardcoded: false
  }));

  // Combine all articles
  const allArticles = [...hardcodedArticles];

  // Only add database articles that don't duplicate hardcoded ones (by slug)
  const hardcodedSlugs = new Set(hardcodedArticles.map(a => a.slug));
  formattedDbArticles.forEach(dbArticle => {
    if (!hardcodedSlugs.has(dbArticle.slug)) {
      allArticles.push(dbArticle);
    }
  });

  // Sort all articles by date (newest first)
  allArticles.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <main className={`${PAGE_MARGIN} mx-auto px-4 py-8`}>
      <h1 className="text-[32px] md:text-[48px] text-left mb-4 md:mb-8 font-normal">Articles</h1>

      {/* Render all articles sorted by date */}
      {allArticles.map((article) => (
        <div key={article.id} className="mb-12">
          <div className='flex justify-between px-1'>
            <h3 className={`${montserrat.className}`}>
              {new Intl.DateTimeFormat('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              }).format(article.date)}
            </h3>
            <SocialLinks className='mb-1' />
          </div>
          <Image
            src={article.imageUrl}
            alt={`${article.title} article image`}
            width={1515}
            height={375}
            className="w-full aspect-[1500/800] md:aspect-[1515/375] rounded-lg object-cover"
            priority={true}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1515px"
          />
          <div>
            <div className='flex justify-between mt-5'>
              <h2 className='text-[30px] font-semibold'>{article.title}</h2>
            </div>
            <p className='mt-2'>{article.excerpt}</p>
            <Link
              href={`/articles/${article.slug}`}
              className="inline-block text-blue-500 hover:text-blue-700 mt-4"
            >
              <p className="flex items-center text-[#0170D7] hover:opacity-80 transition-opacity">
                Read More
              </p>
            </Link>
          </div>
        </div>
      ))}
    </main>
  );
}
