'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prismadb'
import { checkAdminAccess } from '@/utils/roles'

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function checkSlugExists(slug: string, excludeArticleId?: string): Promise<boolean> {
  const existingArticle = await prisma.blogArticle.findUnique({
    where: { slug }
  })
  if (!existingArticle) return false
  // If editing, allow the same slug for the same article
  if (excludeArticleId && existingArticle.id === excludeArticleId) return false
  return true
}

export async function toggleArticlePublish(articleId: string) {
  const isAdmin = await checkAdminAccess()
  if (!isAdmin) {
    return {
      success: false,
      error: 'Unauthorized: Admin privileges required'
    }
  }

  try {
    const article = await prisma.blogArticle.findUnique({
      where: { id: articleId }
    })

    if (!article) {
      return {
        success: false,
        error: 'Article not found'
      }
    }

    const updated = await prisma.blogArticle.update({
      where: { id: articleId },
      data: { published: !article.published }
    })

    revalidatePath('/manage/articles')
    revalidatePath('/articles')

    return {
      success: true,
      published: updated.published,
      message: updated.published ? 'Article published' : 'Article unpublished'
    }
  } catch (error) {
    console.error('Error toggling article publish:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update article'
    }
  }
}

export async function deleteArticle(articleId: string) {
  const isAdmin = await checkAdminAccess()
  if (!isAdmin) {
    return {
      success: false,
      error: 'Unauthorized: Admin privileges required'
    }
  }

  try {
    const article = await prisma.blogArticle.findUnique({
      where: { id: articleId }
    })

    if (!article) {
      return {
        success: false,
        error: 'Article not found'
      }
    }

    await prisma.blogArticle.delete({
      where: { id: articleId }
    })

    revalidatePath('/manage/articles')
    revalidatePath('/articles')

    return { success: true, message: 'Article deleted successfully' }
  } catch (error) {
    console.error('Error deleting article:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete article'
    }
  }
}

export async function updateArticle(articleId: string, formData: FormData) {
  const isAdmin = await checkAdminAccess()
  if (!isAdmin) {
    return {
      success: false,
      error: 'Unauthorized: Admin privileges required'
    }
  }

  const title = formData.get('title') as string
  const slugFromForm = formData.get('slug') as string
  const content = formData.get('content') as string
  const imageUrl = formData.get('imageUrl') as string
  const published = formData.get('published') === 'on'
  const authorName = formData.get('authorName') as string
  const authorTitle = formData.get('authorTitle') as string
  const metaTitle = formData.get('metaTitle') as string
  const metaDescription = formData.get('metaDescription') as string

  if (!title || !content) {
    return {
      success: false,
      error: 'Title and content are required'
    }
  }

  const slug = slugFromForm || slugify(title)

  // Strip markdown formatting for excerpt
  const stripMarkdown = (text: string) => {
    return text
      .replace(/^#{1,6}\s+/gm, '') // Remove heading markers
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.+?)\*/g, '$1') // Remove italic
      .replace(/__(.+?)__/g, '$1') // Remove bold (alt)
      .replace(/_(.+?)_/g, '$1') // Remove italic (alt)
      .replace(/^[-*+]\s+/gm, '') // Remove list markers
      .replace(/^\d+\.\s+/gm, '') // Remove numbered list markers
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links, keep text
      .replace(/<u>(.+?)<\/u>/g, '$1') // Remove underline tags
      .trim()
  }

  // Generate excerpt from first 100 words of content
  const excerpt = stripMarkdown(content).split(/\s+/).slice(0, 100).join(' ')

  try {
    await prisma.blogArticle.update({
      where: { id: articleId },
      data: {
        title,
        slug,
        excerpt,
        content,
        imageUrl,
        published,
        authorName,
        authorTitle,
        metaTitle,
        metaDescription,
        updatedAt: new Date(),
      },
    })

    revalidatePath('/manage/articles')
    revalidatePath('/articles')
    revalidatePath(`/articles/${slug}`)

    return { success: true, message: 'Article updated successfully' }
  } catch (error) {
    console.error('Error updating article:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update article'
    }
  }
}

export async function uploadArticle(formData: FormData) {
  const isAdmin = await checkAdminAccess()
  if (!isAdmin) {
    return {
      success: false,
      error: 'Unauthorized: Admin privileges required'
    }
  }

  const title = formData.get('title') as string
  const slugFromForm = formData.get('slug') as string
  const content = formData.get('content') as string
  const imageUrl = formData.get('imageUrl') as string
  const published = formData.get('published') === 'on'
  const authorName = formData.get('authorName') as string
  const authorTitle = formData.get('authorTitle') as string
  const metaTitle = formData.get('metaTitle') as string
  const metaDescription = formData.get('metaDescription') as string

  if (!title || !content) {
    return {
      success: false,
      error: 'Title and content are required'
    }
  }

  const slug = slugFromForm || slugify(title)

  // Check if slug already exists
  const existingArticle = await prisma.blogArticle.findUnique({
    where: { slug }
  })
  if (existingArticle) {
    return {
      success: false,
      error: `An article with the URL "${slug}" already exists. Please choose a different title or edit the slug.`
    }
  }

  // Strip markdown formatting for excerpt
  const stripMarkdown = (text: string) => {
    return text
      .replace(/^#{1,6}\s+/gm, '') // Remove heading markers
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.+?)\*\*/g, '$1') // Remove italic
      .replace(/__(.+?)__/g, '$1') // Remove bold (alt)
      .replace(/_(.+?)_/g, '$1') // Remove italic (alt)
      .replace(/^[-*+]\s+/gm, '') // Remove list markers
      .replace(/^\d+\.\s+/gm, '') // Remove numbered list markers
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links, keep text
      .replace(/<u>(.+?)<\/u>/g, '$1') // Remove underline tags
      .trim()
  }

  // Generate excerpt from first 100 words of content
  const excerpt = stripMarkdown(content).split(/\s+/).slice(0, 100).join(' ')

  try {
    await prisma.blogArticle.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        imageUrl,
        published,
        authorName,
        authorTitle,
        metaTitle,
        metaDescription,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    revalidatePath('/manage/articles')
    revalidatePath('/articles')

    return { success: true, message: 'Article created successfully' }
  } catch (error) {
    console.error('Error creating article:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create article'
    }
  }
}
