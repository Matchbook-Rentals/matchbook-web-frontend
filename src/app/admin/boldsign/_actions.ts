'use server'

import prisma from '@/lib/prismadb'
import { revalidatePath } from 'next/cache'

export async function getBoldSignStats() {
  try {
    const [templates, leases] = await Promise.all([
      prisma.boldSignTemplate.findMany({
        select: {
          id: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.boldSignLease.findMany({
        select: {
          id: true,
          createdAt: true,
          landlordSigned: true,
          tenantSigned: true,
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    ])

    const signedLeases = leases.filter(lease => lease.landlordSigned && lease.tenantSigned).length
    const pendingLeases = leases.filter(lease => !lease.landlordSigned || !lease.tenantSigned).length

    return {
      totalTemplates: templates.length,
      totalLeases: leases.length,
      signedLeases,
      pendingLeases,
      lastTemplateCreated: templates[0]?.createdAt || null,
      lastLeaseCreated: leases[0]?.createdAt || null,
    }
  } catch (error) {
    console.error('Error fetching BoldSign stats:', error)
    return {
      totalTemplates: 0,
      totalLeases: 0,
      signedLeases: 0,
      pendingLeases: 0,
      lastTemplateCreated: null,
      lastLeaseCreated: null,
    }
  }
}

export async function deleteAllBoldSignDocuments() {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const deletedLeases = await tx.boldSignLease.deleteMany({})
      const deletedTemplates = await tx.boldSignTemplate.deleteMany({})
      
      return {
        deletedLeases: deletedLeases.count,
        deletedTemplates: deletedTemplates.count,
        totalDeleted: deletedLeases.count + deletedTemplates.count
      }
    })

    revalidatePath('/admin/boldsign')
    
    return {
      success: true,
      message: `Successfully deleted ${result.totalDeleted} documents (${result.deletedTemplates} templates, ${result.deletedLeases} leases)`,
      ...result
    }
  } catch (error) {
    console.error('Error deleting BoldSign documents:', error)
    return {
      success: false,
      message: 'Failed to delete documents. Please try again.',
      deletedLeases: 0,
      deletedTemplates: 0,
      totalDeleted: 0
    }
  }
}