import React from 'react'
import RankView from './rank-view'
import prisma from '@/lib/prismadb'
import { Listing } from '@prisma/client'

const updateFavoriteRank = async (rankedListings: Listing[], tripId: string) => {
  'use server';

  const result = await prisma.$transaction(async (tx) => {
    await tx.favorite.updateMany({
      where: { tripId },
      data: {
        rank: {
          increment: 1000
        }
      }
    })
    let rank = 1
    for (let listing of rankedListings) {
      await tx.favorite.update({
        where: {
          tripId_listingId: {
            tripId, listingId: listing.id
          }
        },
        data: { rank }
      })
      rank++;
    }
  })
  return result
}

export default function FavoritesPage() {
  return (
    <RankView updateFavoriteRank={updateFavoriteRank} />
  )
}
