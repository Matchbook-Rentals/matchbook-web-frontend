
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { BlogArticle } from "@prisma/client";
import { getLatestBlogArticle } from "@/app/actions/blog-articles";

export default function RecentArticle() {
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const latestArticle = await getLatestBlogArticle();
        setArticle(latestArticle);
      } catch (error) {
        console.error("Error fetching latest article:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, []);

  if (isLoading) {
    return (
      <section className="relative w-full h-screen overflow-hidden">
        <div className="relative w-full h-full bg-gray-200 animate-pulse">
          {/* Loading state */}
        </div>
      </section>
    );
  }

  if (!article) {
    return <div></div>;
  }

  return (
    <section className="relative w-full h-screen overflow-hidden">
      <div className="relative w-full h-full">
        {/* Main background image from latest article */}
        {article.imageUrl ? (
          <Image
            src={article.imageUrl}
            alt={article.title || "Featured article image"}
            fill
            className="w-full h-full object-cover"
            sizes="100vw"
            priority
          />
        ) : (
        <div />
        )}

        {/* Featured article card */}
        <Card className="absolute bottom-0 right-0 w-[403px] bg-[#1f1f1f] text-white rounded-none border-none">
          <CardHeader className="pb-0">
            <CardTitle className="font-['Poppins',Helvetica] font-semibold text-xl tracking-[-0.40px]">
              Featured Article
            </CardTitle>
          </CardHeader>
          <CardContent className="py-4">
            <h2 className="font-['Lora',Helvetica] font-bold text-[32px] tracking-[-0.64px] leading-10">
              {article.title}
            </h2>
            {article.excerpt && (
              <p className="mt-2 font-['Poppins',Helvetica] text-sm line-clamp-3">
                {article.excerpt}
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Link
              href={`/articles/${article.slug}`}
              className="font-['Poppins',Helvetica] font-normal text-xl tracking-[-0.40px] underline"
            >
              Read More
            </Link>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
