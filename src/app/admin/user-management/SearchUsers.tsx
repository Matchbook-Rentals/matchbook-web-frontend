'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export const SearchUsers = () => {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div>
      <form
        className="flex gap-2 items-end"
        onSubmit={(e) => {
          e.preventDefault()
          const form = e.currentTarget
          const formData = new FormData(form)
          const queryTerm = formData.get('search') as string
          router.push(pathname + '?search=' + queryTerm)
        }}
      >
        <div className="flex flex-col gap-1 flex-1">
          <label htmlFor="search" className="text-sm font-medium">Search for users</label>
          <Input id="search" name="search" type="text" placeholder="Email or name..." />
        </div>
        <Button type="submit">Search</Button>
      </form>
    </div>
  )
}