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

  // Define custom components for markdown rendering
  const components = {
    // Style paragraphs with consistent spacing and typography
    p: ({ children }) => (
      <p className="mb-8 text-gray-800 leading-relaxed">{children}</p>
    ),
    // Handle line breaks properly
    br: () => <br> ## Fight me </br>,
    // Add heading styles
    h2: ({ children }) => (
      <h2 className="text-3xl font-bold mt-8 mb-4">{children}</h2>
    ),
    h3: ({ children }) => (
      <h2 className="text-2xl font-semibold mt-6 mb-3">{children}</h2>
    ),
    // Style lists
    ul: ({ children }) => (
      <ul className="list-disc list-inside mb-6 space-y-2">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside mb-6 space-y-2">{children}</ol>
    ),
    // Style links
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-blue-600 hover:text-blue-800 underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
    // Style code blocks
    code: ({ children }) => (
      <code className="bg-gray-100 rounded px-2 py-1 font-mono text-sm">
        {children}
      </code>
    ),
  };

  return (
    <article className={`${PAGE_MARGIN} mx-auto py-8 px-4`}>
      <h1 className="text-4xl font-bold mb-8">{blogArticle.title}</h1>
      <div className="prose prose-xl max-w-none whitespace-pre-wrap">
        <ReactMarkdown
          components={components}
        >
          {blogArticle.content}
        </ReactMarkdown>
      </div>
    </article >
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
