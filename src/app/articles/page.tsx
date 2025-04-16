import React from 'react';
import ReactMarkdown from 'react-markdown';
import { PAGE_MARGIN } from '@/constants/styles';
import prisma from '@/lib/prismadb'
import { Poppins } from 'next/font/google';
import { BlogArticle } from '@prisma/client';
import SocialLinks from '@/components/SocialLinks';
import Image from 'next/image';
import Link from 'next/link';

const poppins = Poppins({ 
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ["latin"]
});

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
    <main className={`${PAGE_MARGIN} ${poppins.className} mx-auto px-4 py-8`}>
      <h1 className="text-[32px] font-medium text-left mb-4 md:mb-8 ">Articles</h1>
      {articles.map((article) => (
        <React.Fragment key={article.id}>
          <div className='flex justify-between px-0 mt-8'>
            <h3 className={``}>
              {new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(article.createdAt))}
            </h3>
          </div>
          <Image
            src={`${article.imageUrl}`}
            alt={article.title || 'Blog article image'}
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
        </React.Fragment>
      ))}
    </main>
  );
}
