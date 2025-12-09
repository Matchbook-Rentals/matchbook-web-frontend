import ReactMarkdown from 'react-markdown';
import prisma from '@/lib/prismadb';
import { PAGE_MARGIN } from '@/constants/styles';
import { notFound } from 'next/navigation';
import { BlogArticle } from '@prisma/client';
import Link from 'next/link';
import Image from 'next/image';
import SocialLinks from '@/components/SocialLinks';
import { Poppins, Lora } from 'next/font/google';
import { MarketingPageHeader } from '@/components/marketing-landing-components/marketing-page-header';

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ["latin"]
});

const lora = Lora({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

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
    <main className={`max-w-3xl ${poppins.className} mx-auto px-4 py-8`}>
      <div className="flex justify-center mb-8">
        <MarketingPageHeader 
          headerText={article.title} 
          breadcrumbText="Articles"
          articleSlug={article.slug}
        />
      </div>
      <div className="flex justify-between items-center px-1 mb-1 text-foreground">
        <h3 className="text-[#0b6969] font-medium">{new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(article.createdAt))}</h3>
        <SocialLinks className='mb-1' />
      </div>
      {article.imageUrl && (
        <Image
          src={article.imageUrl}
          alt={article.title}
          width={1515}
          height={337}
          className="w-full aspect-[16/9] mb-4 rounded-lg object-cover"
          priority={true}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1515px"
        />
      )}
      <article className="w-full prose-sm md:prose-base lg:prose-lg mb-8">
        <ReactMarkdown
          components={{
            h1: ({node, ...props}) => <h1 className={`text-xl font-medium my-4 ${lora.className}`} {...props} />,
            h2: ({node, ...props}) => <h2 className={`text-lg font-medium my-3 ${lora.className}`} {...props} />,
            h3: ({node, ...props}) => <h3 className={`text-base font-medium my-2 ${lora.className}`} {...props} />,
            p: ({node, ...props}) => <p className="mb-2" {...props} />,
            img: ({node, ...props}) => <img className="w-full h-auto my-4" {...props} />,
            a: ({node, ...props}) => <a className="text-blue-500 hover:underline" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc ml-4" {...props} />,
            strong: ({node, ...props}) => <strong className="font-semibold" {...props} />
          }}
        >{article.content}</ReactMarkdown>
      </article>
      <div className="flex flex-col items-end mt-8">
        <h4 className="text-lg font-medium">{article.authorName}</h4>
        <h5 className="text-sm text-gray-500">{(article as any).authorTitle}</h5>
      </div>
    </main>
  );
}
