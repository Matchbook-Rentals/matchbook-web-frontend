import { notFound } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";

interface BlogPageProps {
  params: {
    slug: string;
  };
}

export default async function BlogArticlePage({ params }: BlogPageProps) {
  const { slug } = params;

  const article = await prisma.blogArticle.findUnique({
    where: { slug },
  });

  if (!article) {
    notFound();
  }

  const formattedDate = article.publishedAt
    ? format(new Date(article.publishedAt), "MMMM d, yyyy")
    : "Unpublished";

  return (
    <Container>
      <div className="max-w-4xl mx-auto py-12">
        <PageHeader title={article.title} />
        
        {article.imageUrl && (
          <div className="relative w-full h-[400px] mb-8 rounded-lg overflow-hidden">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
        
        <div className="mb-6 text-gray-600">
          <p className="text-sm">Published on {formattedDate}</p>
        </div>
        
        {article.excerpt && (
          <div className="mb-8">
            <p className="text-lg font-medium text-gray-700">{article.excerpt}</p>
          </div>
        )}
        
        <div className="prose prose-lg max-w-none">
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </div>
      </div>
    </Container>
  );
}