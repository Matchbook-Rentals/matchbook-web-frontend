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

export default async function Home() {
  const articles = await getBlogArticles();

  return (
    <main className={`${PAGE_MARGIN} mx-auto px-4 py-8`}>
      <h1 className="text-5xl text-left mb-8 font-normal">Articles</h1>
      {articles.map((article) => (
        <>
          <div className='flex justify-between mb-4 items-start'>
            <h3 key={article.id} className={`${montserrat.className}`}>{article.createdAt.toDateString()}</h3>
            <SocialLinks className='' />
          </div>
          <Image
            src={`/article-images/introduction.png`} // Assuming imageUrl is stored in article data
            alt={article.title || 'Blog article image'}
            width={1515}
            height={375}
            className="w-full aspect-[1500/800] md:aspect-[1515/375] rounded-lg object-cover"
            priority={true} // Loads image immediately for better UX
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1515px"
          />
          <div>
            <div className='flex justify-between mt-5'>
              <h2 className='text-[30px] font-semibold'> {article.title} </h2>
            </div>
            <p className='mt-2'>{article.excerpt} </p>

            <Link
              href={`/blog/${article.slug}`}
              className="inline-block text-blue-500 hover:text-blue-700 mt-4"
            >
              <p className="flex items-center text-[#0170D7] hover:opacity-80 transition-opacity">
                Read More
              </p>
            </Link>
          </div>

        </>
      ))}
    </main>
  );
}
