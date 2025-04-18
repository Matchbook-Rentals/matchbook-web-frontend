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
import { PAGE_MARGIN } from "@/constants/styles";

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
        <div className="relative w-full h-full bg-gray-200 animate-pulse"></div>
      </section>
    );
  }

  if (!article) {
    return <div></div>;
  }

  return (
    <section
      // Reduced top margin for small screens, kept md height
      className={`relative w-full ${PAGE_MARGIN} mt-20 md:mt-[250px] md:h-[50vh]`}
    >
      {/* Use flex-col by default, md:items-end for medium+ screens */}
      <div className="relative w-full h-full flex flex-col md:flex-row md:items-end">
        {/* Main background image from latest article */}
        {article.imageUrl && (
          // Adjusted height for small screens, kept md styles
          <div className="relative w-full h-[40vh] md:h-full aspect-video md:aspect-auto">
            <Image
              src={article.imageUrl}
              alt={article.title || "Featured article image"}
              fill
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Featured article card */}
        {/* Full width below image on small screens, absolute positioning restored on md+ */}
        <Card
          className="w-full mt-0 md:w-[403px] md:absolute md:bottom-[-40px] md:right-12 bg-[#1f1f1f] text-white rounded-none border-none"
        >
          <CardHeader className="pb-0">
            <CardTitle className="font-['Poppins',Helvetica] font-semibold text-xl tracking-[-0.40px]">
              Featured Article
            </CardTitle>
          </CardHeader>
          <CardContent className="py-4">
            <h2 className="font-['Lora',Helvetica] font-bold text-[24px] md:text-[32px] tracking-[-0.64px] leading-8 md:leading-10">
              {article.title}
            </h2>
          </CardContent>
          <CardFooter>
            <Link
              href={`/articles/${article.slug}`}
              className="font-['Poppins',Helvetica] font-normal text-lg md:text-xl tracking-[-0.40px] hover:underline"
            >
              Read More
            </Link>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
