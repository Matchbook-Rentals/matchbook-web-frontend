import ReactMarkdown from 'react-markdown';
import prisma from '@/lib/prismadb';
import { notFound } from 'next/navigation';
import Image from 'next/image';
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
      <div className="flex justify-center mb-10">
        <MarketingPageHeader
          headerText="Articles"
          articleSlug={article.slug}
        />
      </div>

      <div className="text-center mb-6">
        <p className="text-[#0b6969] font-medium">
          Published {new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(article.createdAt))}
        </p>
        <h1 className={`text-4xl font-medium mt-2 ${lora.className}`}>
          {article.title}
        </h1>
      </div>
      {article.imageUrl && (
        <Image
          src={article.imageUrl}
          alt={article.title}
          width={1515}
          height={337}
          className="w-full aspect-[16/9] mb-10 rounded-lg object-cover"
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
