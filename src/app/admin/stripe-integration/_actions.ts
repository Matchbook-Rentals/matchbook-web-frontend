'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prismadb'
import { checkRole } from '@/utils/roles'
import stripe from '@/lib/stripe'

export async function getConnectedAccounts() {
  if (!checkRole('admin')) {
    throw new Error('Unauthorized')
  }

  try {
    console.log('Starting to fetch Stripe accounts...')
    
    // First, try a simple accounts.list() call
    const accounts = await stripe.accounts.list({
      limit: 10
    })

    console.log('Stripe accounts response:', accounts)

    if (!accounts || !accounts.data) {
      console.error('Stripe API returned invalid response:', accounts)
      throw new Error('Invalid response from Stripe API')
    }

    // Get all users with stripe account IDs from database for cross-reference
    const usersWithStripeAccounts = await prisma.user.findMany({
      where: {
        stripeAccountId: {
          not: null
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        stripeAccountId: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Create a map of stripe account IDs to user data
    const usersByStripeAccount = new Map(
      usersWithStripeAccounts.map(user => [user.stripeAccountId, user])
    )

    // Combine Stripe accounts with user data
    const accountsWithDetails = accounts.data.map(stripeAccount => {
      const user = usersByStripeAccount.get(stripeAccount.id)
      
      return {
        id: user?.id || `stripe-${stripeAccount.id}`,
        email: user?.email || stripeAccount.email || 'No email',
        firstName: user?.firstName || null,
        lastName: user?.lastName || null,
        stripeAccountId: stripeAccount.id,
        createdAt: user?.createdAt || new Date(stripeAccount.created * 1000),
        updatedAt: user?.updatedAt || new Date(stripeAccount.created * 1000),
        inDatabase: !!user,
        stripeAccount: {
          id: stripeAccount.id,
          email: stripeAccount.email,
          country: stripeAccount.country,
          charges_enabled: stripeAccount.charges_enabled,
          payouts_enabled: stripeAccount.payouts_enabled,
          details_submitted: stripeAccount.details_submitted,
          created: stripeAccount.created,
          type: stripeAccount.type,
          business_profile: stripeAccount.business_profile,
          individual: stripeAccount.individual,
          company: stripeAccount.company
        }
      }
    })

    // Sort by creation date (newest first)
    accountsWithDetails.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    console.log('Returning accounts:', accountsWithDetails.length)
    return accountsWithDetails
  } catch (error) {
    console.error('Error fetching connected accounts:', error)
    
    // Fallback: return database accounts only if Stripe fails
    try {
      console.log('Falling back to database-only results...')
      const usersWithStripeAccounts = await prisma.user.findMany({
        where: {
          stripeAccountId: {
            not: null
          }
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          stripeAccountId: true,
          createdAt: true,
          updatedAt: true
        }
      })

      const fallbackAccounts = usersWithStripeAccounts.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        stripeAccountId: user.stripeAccountId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        inDatabase: true,
        stripeAccount: {
          id: user.stripeAccountId!,
          error: 'Unable to fetch from Stripe API'
        }
      }))

      return fallbackAccounts
    } catch (dbError) {
      console.error('Database fallback also failed:', dbError)
      throw new Error('Failed to fetch connected accounts from both Stripe and database')
    }
  }
}

export async function deleteConnectedAccount(userId: string, stripeAccountId: string) {
  if (!checkRole('admin')) {
    throw new Error('Unauthorized')
  }

  try {
    // Delete from Stripe first
    await stripe.accounts.del(stripeAccountId)
    
    // Only update database if this isn't a Stripe-only account
    if (!userId.startsWith('stripe-')) {
      await prisma.user.update({
        where: { id: userId },
        data: { stripeAccountId: null }
      })
    }

    revalidatePath('/admin/stripe-integration')
    return { success: true }
  } catch (error) {
    console.error('Error deleting connected account:', error)
    throw new Error('Failed to delete connected account')
  }
}