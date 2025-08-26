'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prismadb';
import { checkAdminAccess } from '@/utils/roles';

/**
 * Helper function to generate a slug from a title
 */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Server action to upload a new blog article
 */
export async function uploadArticle(formData: FormData) {
  // Check if user has admin privileges
  console.log('uploadArticle', formData);
  const isAdmin = await checkAdminAccess();
  if (!isAdmin) {
    return {
      success: false,
      error: 'Unauthorized: Admin privileges required'
    };
  }

  // Extract fields from FormData
  const title = formData.get('title') as string;
  const excerpt = formData.get('excerpt') as string;
  const content = formData.get('content') as string;
  const imageUrl = formData.get('imageUrl') as string;
  const published = formData.get('published') === 'on';
  const authorName = (formData.get('authorName') as string) || 'The Matchbook Team';
  const authorTitle = formData.get('authorTitle') as string;

  // Extract publishedOn from formData
  const publishDateStr = formData.get('publishDate') as string;
  const createdAtValue = publishDateStr ? new Date(publishDateStr) : new Date();

  // Validate required fields
  if (!title || !content) {
    return {
      success: false,
      error: 'Title and content are required'
    };
  }

  // Generate slug from title
  const slug = slugify(title);

  try {
    // Create new blog article in database
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
        createdAt: createdAtValue,
        updatedAt: new Date(),
      },
    });

    // Revalidate the blog pages to reflect the new content
    revalidatePath('/blog');
    revalidatePath('/admin');

    // Return success
    return { success: true, message: 'Blog article created successfully' };
  } catch (error) {
    console.error('Error creating blog article:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create blog article'
    };
  }
}