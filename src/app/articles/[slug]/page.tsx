import ReactMarkdown from 'react-markdown';
import prisma from '@/lib/prismadb';
import { PAGE_MARGIN } from '@/constants/styles';
import { notFound } from 'next/navigation';
import { BlogArticle } from '@prisma/client';
import Link from 'next/link';
import Image from 'next/image';
import SocialLinks from '@/components/SocialLinks';
import { Poppins } from 'next/font/google';

const poppins = Poppins({ subsets: ["latin"], weight: "400", variable: '--font-poppins' });

interface Params {
  params: {
    slug: string;
  };
}

export default async function ArticlePage({ params }: Params) {
  const article = await prisma.blogArticle.findUnique({
    where: { slug: params.slug },
  });

  if (!article) {
    notFound();
  }

  return (
    <main className={`${PAGE_MARGIN} ${poppins.className} mx-auto  px-4 py-8`}>
      <h1 className="text-[32px] md:text-[48px] text-left mb-4 md:mb-8 font-normal">
        <Link href="/articles" className="hover:underline">Articles</Link> &gt; {article.title}
      </h1>
      <div className="flex justify-between items-center px-1 mb-1 text-foreground">
        <h3 className={`${poppins.className}`}>{new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(article.createdAt))}</h3>
        <SocialLinks className='mb-1' />
      </div>
      {article.imageUrl && (
        <Image
          src={article.imageUrl}
          alt={article.title}
          width={1515}
          height={337}
          className="w-full h-auto mb-4 rounded-lg object-cover"
          priority={true}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1515px"
        />
      )}
      <article className="w-full prose-sm md:prose-base lg:prose-lg mb-8">
        <ReactMarkdown
          components={{
            h1: ({node, ...props}) => <h1 className="text-[36px] font-semibold my-3" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-[32px] font-semibold my-3" {...props} />,
            p: ({node, ...props}) => <p className="mb-2" {...props} />,
            img: ({node, ...props}) => <img className="w-full h-auto my-4" {...props} />,
            a: ({node, ...props}) => <a className="text-blue-500 hover:underline" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc ml-4" {...props} />,
            strong: ({node, ...props}) => <strong className="font-semibold" {...props} />
          }}
        >{article.content}</ReactMarkdown>
      </article>
      <div className="flex flex-col items-end mt-8">
        <h4 className="font-medium text-[34px]">{article.authorName}</h4>
        <h5 className="text-[20px] font-normal">{(article as any).authorTitle}</h5>
      </div>
    </main>
  );
}
