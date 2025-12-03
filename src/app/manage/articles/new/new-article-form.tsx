'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { BrandButton } from '@/components/ui/brandButton'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { uploadArticle } from './_actions'
import { UploadButton } from '@/app/utils/uploadthing'
import Image from 'next/image'

export function NewArticleForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [publishDate, setPublishDate] = useState(
    new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  )

  const handleImageUpload = (res: any) => {
    if (res && res.length > 0) {
      setImageUrl(res[0].url)
    }
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a title',
        variant: 'destructive',
      })
      return
    }

    if (!content.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter some content',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.set('title', title)
      formData.set('content', content)
      formData.set('imageUrl', imageUrl)
      formData.set('published', 'on')
      formData.set('authorName', 'The Matchbook Team')

      const result = await uploadArticle(formData)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: 'Success',
        description: 'Article created successfully',
      })

      router.push('/manage/articles')
      router.refresh()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to create article',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <p className="text-[#0b6969] font-medium">Published {publishDate}</p>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="text-4xl font-medium text-center w-full mt-2 border-none outline-none focus:ring-0 bg-transparent font-[Lora]"
        />
      </div>

      <div className="relative aspect-[16/9] bg-gray-100 rounded-lg overflow-hidden mb-10">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="Article featured image"
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={handleImageUpload}
                onUploadError={(error: Error) => {
                  toast({
                    title: 'Upload Error',
                    description: error.message,
                    variant: 'destructive',
                  })
                }}
                appearance={{
                  button: 'bg-transparent hover:bg-gray-200 text-gray-600 border-none shadow-none',
                  allowedContent: 'hidden',
                }}
                content={{
                  button: (
                    <div className="flex flex-col items-center">
                      <Plus className="h-12 w-12 text-gray-400" />
                    </div>
                  ),
                }}
              />
            </div>
          </div>
        )}
        {imageUrl && (
          <div className="absolute top-3 right-3">
            <UploadButton
              endpoint="imageUploader"
              onClientUploadComplete={handleImageUpload}
              onUploadError={(error: Error) => {
                toast({
                  title: 'Upload Error',
                  description: error.message,
                  variant: 'destructive',
                })
              }}
              appearance={{
                button: 'bg-white hover:bg-gray-100 text-gray-600 text-xs px-3 py-1',
                allowedContent: 'hidden',
              }}
              content={{
                button: 'Change Image',
              }}
            />
          </div>
        )}
      </div>

      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 font-[Lora]">
          <input
            type="text"
            placeholder="Title"
            className="w-full border-none outline-none focus:ring-0 bg-transparent"
            disabled
            value={title || 'Title'}
          />
        </h2>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Mi tincidunt elit, id quisque ligula ac diam, amet. Vel etiam suspendisse morbi eleifend faucibus eget vestibulum felis. Dictum quis montes, sit sit. Tellus aliquam enim urna, etiam..."
          className="w-full min-h-[400px] border-none outline-none focus:ring-0 bg-transparent resize-none text-gray-600 leading-relaxed"
        />
      </div>

      <div className="flex justify-center">
        <BrandButton
          onClick={handleSubmit}
          disabled={isSubmitting}
          spinOnClick
        >
          Continue
        </BrandButton>
      </div>
    </div>
  )
}
