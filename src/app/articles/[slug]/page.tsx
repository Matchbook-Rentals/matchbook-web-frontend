import ReactMarkdown from 'react-markdown';
import prisma from '@/lib/prismadb';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Poppins, Lora } from 'next/font/google';
import { MarketingPageHeader } from '@/components/marketing-landing-components/marketing-page-header';
import { checkAdminAccess } from '@/utils/roles';
import { AdminControls } from './admin-controls';
import { Metadata } from 'next';

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

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const article = await prisma.blogArticle.findUnique({
    where: { slug: params.slug },
  });

  if (!article) {
    return {
      title: 'Article Not Found',
    };
  }

  return {
    title: article.metaTitle || article.title,
    description: article.metaDescription || article.excerpt || undefined,
    openGraph: {
      title: article.metaTitle || article.title,
      description: article.metaDescription || article.excerpt || undefined,
      images: article.imageUrl ? [article.imageUrl] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: Params) {
  const article = await prisma.blogArticle.findUnique({
    where: { slug: params.slug },
  });

  if (!article) {
    notFound();
  }

  const isAdmin = await checkAdminAccess();

  // Reject non-admins from viewing unpublished articles
  if (!article.published && !isAdmin) {
    notFound();
  }

  const showAdminControls = isAdmin && !article.published;

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
        <h2 className={`text-4xl font-medium mt-2 ${lora.className}`}>
          {article.title}
        </h2>
      </div>
      {article.imageUrl && (
        <div className="relative mb-10">
          <Image
            src={article.imageUrl}
            alt={article.title}
            width={1515}
            height={337}
            className="w-full aspect-[16/9] rounded-lg object-cover"
            priority={true}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1515px"
          />
          {showAdminControls && (
            <div className="absolute top-3 left-3 bg-black/50 px-2 py-1 rounded">
              <span className="text-orange-400 text-sm font-medium">Editor Preview</span>
            </div>
          )}
        </div>
      )}
      <article className="w-full text-gray-600 leading-relaxed mb-8">
        <ReactMarkdown
          components={{
            h1: ({node, ...props}) => <h2 className="text-xl font-semibold my-4" {...props} />,
            h2: ({node, ...props}) => <h3 className="text-lg font-semibold my-3" {...props} />,
            h3: ({node, ...props}) => <h4 className="text-base font-semibold my-2" {...props} />,
            p: ({node, ...props}) => <p className="mb-2" {...props} />,
            img: ({node, ...props}) => <img className="w-full h-auto my-4" {...props} />,
            a: ({node, ...props}) => <a className="text-[#3c8787] underline hover:text-[#2a6363]" target="_blank" rel="noopener noreferrer" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc ml-6 my-2" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal ml-6 my-2" {...props} />,
            strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
            em: ({node, ...props}) => <em className="italic" {...props} />,
            u: ({node, ...props}) => <u className="underline" {...props} />
          }}
        >{article.content}</ReactMarkdown>
      </article>
      <div className="flex flex-col items-end mt-8">
        <h4 className="text-lg font-medium">{article.authorName}</h4>
        <h5 className="text-sm text-gray-500">{(article as any).authorTitle}</h5>
      </div>
      {showAdminControls && (
        <AdminControls articleId={article.id} articleSlug={article.slug} />
      )}
    </main>
  );
}
