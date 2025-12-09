'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'
import { BrandButton } from '@/components/ui/brandButton'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { uploadArticle, updateArticle } from '../new/_actions'
import { UploadButton } from '@/app/utils/uploadthing'
import Image from 'next/image'
import { EditorCommandBar } from '@/components/ui/editor-command-bar'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { MarketingPageHeader } from '@/components/marketing-landing-components/marketing-page-header'
import { BlogArticle } from '@prisma/client'

interface ArticleFormProps {
  article?: BlogArticle
}

export function ArticleForm({ article }: ArticleFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const isEditing = !!article

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState(article?.title || '')
  const [content, setContent] = useState(article?.content || '')
  const [imageUrl, setImageUrl] = useState(article?.imageUrl || '')
  const [hasSelection, setHasSelection] = useState(false)
  const [publishDate] = useState(
    article?.createdAt
      ? new Date(article.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
      : new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  )
  const [authorName, setAuthorName] = useState(article?.authorName || '')
  const [authorTitle, setAuthorTitle] = useState((article as any)?.authorTitle || '')
  const [slug, setSlug] = useState(article?.slug || '')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!article?.slug)
  const titleRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize title textarea on mount
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto'
      titleRef.current.style.height = titleRef.current.scrollHeight + 'px'
    }
  }, [])

  // Auto-generate slug from title if not manually edited
  const generateSlug = (text: string) => {
    return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
  }

  const slugPreview = slug || generateSlug(title) || 'title'

  const generateLoremIpsum = () => {
    const loremContent = `# Introduction

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## Key Points

- Lorem ipsum dolor sit amet, consectetur adipiscing elit
- Sed do eiusmod tempor incididunt ut labore
- Ut enim ad minim veniam, quis nostrud exercitation
- Duis aute irure dolor in reprehenderit in voluptate

## Details

Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris.

Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor ultrices leo.

### Summary

Praesent dapibus, neque id cursus faucibus, tortor neque egestas augue, eu vulputate magna eros eu erat. Aliquam erat volutpat. Nam dui mi, tincidunt quis, accumsan porttitor, facilisis luctus, metus.`

    setContent(loremContent)
    setImageUrl('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=675&fit=crop')
  }

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    // Auto-update slug if not manually edited
    if (!slugManuallyEdited) {
      setSlug(generateSlug(newTitle))
    }
    if (newTitle.toLowerCase().trim() === 'lorem ipsum' && !content) {
      generateLoremIpsum()
    }
  }

  const handleSlugChange = (newSlug: string) => {
    setSlugManuallyEdited(true)
    // Sanitize the slug input
    setSlug(newSlug.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-'))
  }

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
      formData.set('slug', slugPreview)
      formData.set('content', content)
      formData.set('imageUrl', imageUrl)
      formData.set('published', article?.published ? 'on' : 'off')
      formData.set('authorName', authorName)
      formData.set('authorTitle', authorTitle)

      let result
      if (isEditing) {
        result = await updateArticle(article.id, formData)
      } else {
        result = await uploadArticle(formData)
      }

      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: 'Success',
        description: isEditing ? 'Article updated successfully' : 'Article created successfully',
      })

      router.push('/articles')
      router.refresh()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || `Failed to ${isEditing ? 'update' : 'create'} article`,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-center mb-10">
        <MarketingPageHeader
          headerText="Articles"
          articleSlug={slugPreview}
          onSlugChange={handleSlugChange}
        />
      </div>

      <div className="text-center mb-6">
        <p className="text-[#0b6969] font-medium">Published {publishDate}</p>
        <textarea
          ref={titleRef}
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Title"
          rows={1}
          className="text-4xl font-medium text-center w-full mt-2 border-none outline-none focus:ring-0 bg-transparent font-[Lora] resize-none overflow-hidden"
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement
            target.style.height = 'auto'
            target.style.height = target.scrollHeight + 'px'
          }}
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
          {title || 'Title'}
        </h2>
        <MarkdownEditor
          content={content}
          onContentChange={setContent}
          onSelectionChange={setHasSelection}
          placeholder="Start writing your article..."
        />
      </div>

      <div className="flex justify-end mb-10">
        <div className="text-right">
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Daniel Resner"
            className="text-lg font-medium text-right w-full border-none outline-none focus:ring-0 bg-transparent"
          />
          <input
            type="text"
            value={authorTitle}
            onChange={(e) => setAuthorTitle(e.target.value)}
            placeholder="CEO"
            className="text-sm text-gray-500 text-right w-full border-none outline-none focus:ring-0 bg-transparent"
          />
        </div>
      </div>

      <div className="flex justify-center pb-20">
        <BrandButton
          onClick={handleSubmit}
          disabled={isSubmitting}
          spinOnClick
        >
          {isEditing ? 'Save Changes' : 'Continue'}
        </BrandButton>
      </div>

      <EditorCommandBar
        hasSelection={hasSelection}
      />
    </div>
  )
}
