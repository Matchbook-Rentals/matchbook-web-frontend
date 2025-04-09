'use server'

import prisma from "@/lib/prismadb";
import { BlogArticle } from "@prisma/client";

export async function getLatestBlogArticle(): Promise<BlogArticle | null> {
  try {
    const article = await prisma.blogArticle.findFirst({
      where: {
        published: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return article;
  } catch (error) {
    console.error('Error fetching latest blog article:', error);
    return null;
  }
}

export async function getBlogArticles(limit?: number): Promise<BlogArticle[]> {
  try {
    const articles = await prisma.blogArticle.findMany({
      where: {
        published: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      ...(limit ? { take: limit } : {})
    });
    
    return articles;
  } catch (error) {
    console.error('Error fetching blog articles:', error);
    return [];
  }
}
