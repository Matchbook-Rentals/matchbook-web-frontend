import { notFound } from 'next/navigation';
import prisma from '@/lib/prismadb';
import ReactMarkdown from 'react-markdown';
import { PAGE_MARGIN } from '@/constants/styles';
//import { serialize } from 'next-mdx-remote/serialize';
//import { MDXRemote } from 'next-mdx-remote';


// Define the props for the component
type BlogArticleProps = {
  params: { slug: string };
};

// This is a server component, hence it's async
export default async function BlogArticle({ params }: BlogArticleProps) {
  // Fetch the blog article using the slug
  const blogArticle = await prisma.blogArticle.findUnique({
    where: {
      slug: params.slug,
    },
  });

  // If no article is found, redirect or show not found
  if (!blogArticle) {
    notFound(); // This will handle the 404 page for you
  }


  return (
    <article className={`${PAGE_MARGIN} mx-auto py-8 px-4`}>
      <h1 className="text-4xl font-bold mb-8">{blogArticle.title}</h1>
      <div className="prose prose-lg">
        <ReactMarkdown>{blogArticle.content}</ReactMarkdown>
      </div>
    </article>
  );
}

// If you want to generate static paths for all articles at build time:
export async function generateStaticParams() {
  const articles = await prisma.blogArticle.findMany({
    select: { slug: true },
  });
  return articles.map((article) => ({
    slug: article.slug,
  }));
}
