import { redirect, notFound } from 'next/navigation'
import { checkAdminAccess } from '@/utils/roles'
import { PAGE_MARGIN } from '@/constants/styles'
import { ArticleForm } from '../../components/article-form'
import prisma from '@/lib/prismadb'

interface EditArticlePageProps {
  params: {
    slug: string
  }
}

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  if (!(await checkAdminAccess())) {
    redirect('/unauthorized')
  }

  const article = await prisma.blogArticle.findUnique({
    where: { slug: params.slug }
  })

  if (!article) {
    notFound()
  }

  return (
    <div className={`${PAGE_MARGIN} py-10`}>
      <ArticleForm article={article} />
    </div>
  )
}
