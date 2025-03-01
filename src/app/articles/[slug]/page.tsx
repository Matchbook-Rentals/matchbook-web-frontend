import ReactMarkdown from 'react-markdown';
import prisma from '@/lib/prismadb';
import { PAGE_MARGIN } from '@/constants/styles';
import { notFound } from 'next/navigation';
import { BlogArticle } from '@prisma/client';

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
    <main className={`${PAGE_MARGIN} mx-auto px-4 py-8`}>
      <h1 className="text-[32px] md:text-[48px] text-left mb-4 md:mb-8 font-normal">
        {article.title}
      </h1>
      {article.imageUrl && (
        <img src={article.imageUrl} alt={article.title} className="w-full h-auto mb-2" />
      )}
      <p className="text-sm text-gray-600">By {article.authorName}</p>
      <p className="text-sm text-gray-600">
        {new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(article.createdAt))}
      </p>
      <ReactMarkdown
        components={{
          h1: ({node, ...props}) => <h1 className="text-[36px] font-semibold mb-1" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-[32px] font-semibold mb-1" {...props} />,
          p: ({node, ...props}) => <p className="mb-6" {...props} />,
          img: ({node, ...props}) => <img className="w-full h-auto my-4" {...props} />,
          a: ({node, ...props}) => <a className="text-blue-500 hover:underline" {...props} />
        }}
      >{article.content}</ReactMarkdown>
      <div className="flex flex-col items-end mt-8">
        <h4 className="font-medium text-[34px]">{article.authorName}</h4>
        <h5 className="text-[20px] font-normal">{(article as any).authorTitle}</h5>
      </div>
    </main>
  );
}