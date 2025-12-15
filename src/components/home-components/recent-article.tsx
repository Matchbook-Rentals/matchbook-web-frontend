"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardFooter } from "../../components/ui/card";
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
    <section className="relative w-full max-w-[1440px] mx-auto pb-[220px]">
      <div className="relative h-[496px]">
        {article.imageUrl && (
          <Image
            src={article.imageUrl}
            alt={article.title || "Featured article image"}
            fill
            className="object-cover"
          />
        )}

        <Card className="absolute bottom-0 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-[10%] w-[90%] max-w-[439px] rounded-xl overflow-hidden bg-[linear-gradient(180deg,rgba(3,3,3,1)_0%,rgba(17,17,17,0.9)_94%)] border-none translate-y-1/2">
          <CardContent className="p-6 flex flex-col gap-6">
            <div className="flex flex-col gap-6">
              <p 
                className="text-white" 
                style={{ 
                  fontFamily: 'Poppins',
                  fontWeight: 500,
                  fontSize: '16px',
                  letterSpacing: '0px'
                }}
              >
                Featured Article
              </p>

              <h3
                className="text-white"
                style={{
                  fontFamily: 'Lora',
                  fontWeight: 500,
                  fontSize: 'clamp(1.25rem, 4vw, 28px)',
                  lineHeight: 'normal',
                  letterSpacing: '0px'
                }}
              >
                {article.title}
              </h3>
            </div>
          </CardContent>

          <CardFooter className="p-6 pt-0 flex justify-end">
            <Button
              variant="link"
              className="p-0 h-auto flex items-center gap-2 text-[#e7f0f0] hover:text-white hover:no-underline"
              asChild
            >
              <Link href={`/articles/${article.slug}`}>
                <span className="font-['Poppins',Helvetica] font-semibold leading-6" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
                  Read Article
                </span>
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
