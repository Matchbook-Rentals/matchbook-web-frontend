import { redirect } from 'next/navigation'
import { checkAdminAccess } from '@/utils/roles'
import { MarketingPageHeader } from '@/components/marketing-landing-components/marketing-page-header'
import { PAGE_MARGIN } from '@/constants/styles'
import { NewArticleForm } from './new-article-form'

export default async function NewArticlePage() {
  if (!(await checkAdminAccess())) {
    redirect('/unauthorized')
  }

  return (
    <div className={`${PAGE_MARGIN} py-10`}>
      <div className="flex justify-center mb-10">
        <MarketingPageHeader
          headerText="Articles"
          articleSlug="Title"
        />
      </div>

      <NewArticleForm />
    </div>
  )
}
