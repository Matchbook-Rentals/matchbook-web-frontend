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

export async function uploadArticle(formData: FormData) {
  const isAdmin = await checkAdminAccess()
  if (!isAdmin) {
    return {
      success: false,
      error: 'Unauthorized: Admin privileges required'
    }
  }

  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const imageUrl = formData.get('imageUrl') as string
  const published = formData.get('published') === 'on'
  const authorName = (formData.get('authorName') as string) || 'The Matchbook Team'
  const authorTitle = formData.get('authorTitle') as string

  if (!title || !content) {
    return {
      success: false,
      error: 'Title and content are required'
    }
  }

  const slug = slugify(title)

  // Generate excerpt from first 100 words of content
  const excerpt = content.split(/\s+/).slice(0, 100).join(' ')

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
