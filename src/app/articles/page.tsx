import { checkAdminAccess } from '@/utils/roles'
import prisma from '@/lib/prismadb'
import { BlogArticle } from '@prisma/client'
import { MarketingPageHeader } from '@/components/marketing-landing-components/marketing-page-header'
import { PAGE_MARGIN } from '@/constants/styles'
import { Metadata } from 'next'
import { BrandButton } from '@/components/ui/brandButton'
import { ArticleCard } from './components/article-card'
import { FeaturedArticleCarousel } from './components/featured-article-carousel'

export const metadata: Metadata = {
  title: 'MatchBook Rentals | Articles & Resources',
  description: 'Expert advice and resources for monthly rentals, midterm leasing, and property management. Learn tips for hosts and renters.',
};

async function getBlogArticles(isAdmin: boolean): Promise<BlogArticle[]> {
  const articles = await prisma.blogArticle.findMany({
    where: isAdmin ? {} : { published: true },
    orderBy: {
      createdAt: 'desc'
    }
  });
  return articles;
}

export default async function ArticlesPage() {
  const isAdmin = await checkAdminAccess();
  const articles = await getBlogArticles(isAdmin)

  const featuredArticles = articles.slice(0, 3)
  const gridArticles = articles

  return (
    <div className={`${PAGE_MARGIN} py-10`}>
      <div className="flex justify-center mb-10">
        <MarketingPageHeader
          headerText="Articles"
        />
      </div>

      <FeaturedArticleCarousel articles={featuredArticles} />

      <h2 className="text-3xl font-[Lora] font-medium text-center mb-8">
        Latest Articles
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gridArticles.map((article) => (
          <ArticleCard key={article.id} article={article} isAdmin={isAdmin} />
        ))}
      </div>

      {isAdmin && (
        <div className="flex justify-center mt-10">
          <BrandButton variant="outline" href="/manage/articles/new">
            Create New Article
          </BrandButton>
        </div>
      )}
    </div>
  )
}
