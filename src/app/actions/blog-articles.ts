'use server'

import prisma from "@/lib/prismadb";
import { BlogArticle } from "@prisma/client";

export async function getLatestBlogArticle(): Promise<BlogArticle | null> {
  console.log('HIT ARTICLE ACTION')
  try {
    const article = await prisma.blogArticle.findFirst({
      // add this clause back in when setting articles as preview status first 
      //where: {
      //  published: true
      //},
      orderBy: {
        createdAt: 'desc'
      }
    });


    console.log('ACTION RESULT',article)
    
    return article;
  } catch (error) {
    console.log('ARTICLE ERROR:', error)
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
