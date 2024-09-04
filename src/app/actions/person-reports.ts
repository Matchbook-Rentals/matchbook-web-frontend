'use server'

import prisma from "@/lib/prismadb"

export async function getPersonReports(userId: string) {
  try {
    const reports = await prisma.personReport.findUnique({
      where: { userId },
    })
    return reports
  } catch (error) {
    console.error('Error fetching person reports:', error)
    return null
  }
}