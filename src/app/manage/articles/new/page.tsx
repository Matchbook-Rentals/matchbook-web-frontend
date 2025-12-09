import { redirect } from 'next/navigation'
import { checkAdminAccess } from '@/utils/roles'
import { PAGE_MARGIN } from '@/constants/styles'
import { NewArticleForm } from './new-article-form'

export default async function NewArticlePage() {
  if (!(await checkAdminAccess())) {
    redirect('/unauthorized')
  }

  return (
    <div className={`${PAGE_MARGIN} py-10`}>
      <NewArticleForm />
    </div>
  )
}
