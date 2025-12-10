'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRightIcon } from 'lucide-react'
import { BlogArticle } from '@prisma/client'

interface FeaturedArticleCarouselProps {
  articles: BlogArticle[]
}

export function FeaturedArticleCarousel({ articles }: FeaturedArticleCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (articles.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % articles.length)
    }, 15000)

    return () => clearInterval(interval)
  }, [articles.length])

  if (articles.length === 0) return null

  const currentArticle = articles[currentIndex]

  return (
    <div className="mb-24">
      <div className="relative">
        <div className="relative h-[350px] md:h-[450px] lg:h-[550px] rounded-lg overflow-hidden">
          {currentArticle.imageUrl && (
            <Image
              src={currentArticle.imageUrl}
              alt={currentArticle.title || 'Featured article'}
              fill
              className="object-cover"
              priority
            />
          )}
        </div>

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-[10%] translate-y-1/2 w-[90%] max-w-[400px] bg-[linear-gradient(180deg,rgba(3,3,3,1)_0%,rgba(17,17,17,0.9)_94%)] rounded-xl p-6">
          <p className="text-white font-medium text-base mb-3">
            Featured Article
          </p>
          <h2 className="text-white font-[Lora] font-medium text-xl md:text-2xl leading-normal mb-6">
            {currentArticle.title}
          </h2>
          <div className="flex justify-end">
            <Link
              href={`/articles/${currentArticle.slug}`}
              className="flex items-center gap-2 text-[#e7f0f0] hover:text-white font-semibold"
            >
              Read Article
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {articles.length > 1 && (
        <div className="flex justify-center gap-2 mt-32">
          {articles.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                index === currentIndex
                  ? 'bg-[#3c8787]'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to article ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
