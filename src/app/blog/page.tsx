import SocialLinks from '@/components/SocialLinks';
import { PAGE_MARGIN } from '@/constants/styles';
import prisma from '@/lib/prismadb'
import { BlogArticle } from '@prisma/client';
import Image from 'next/image';


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
      <h1 className="text-5xl text-left mb-8">Articles</h1>
      {articles.map((article) => (
        <>
          <h3 key={article.id}>{article.createdAt.toDateString()}</h3>
          <img src='/article-images/introduction.png' className='w-full h-[375px] rounded-lg' alt='Introducing Matchbook - Lead Image' />
          <div>
            <div className='flex justify-between'>
              <h2 className='text-[30px] font-semibold'> {article.title} </h2>
              <SocialLinks />


            </div>

          </div>

        </>
      ))}
    </main>
  );
}
