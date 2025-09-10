import { notFound } from 'next/navigation'
import { getTemplateForEdit, fetchPdfFromUrl, getListingDetails } from '../../lease-actions'
import TemplateEditClient from './template-edit-client'

export default async function TemplateEditPage({
  params
}: {
  params: { listingId: string; templateId: string }
}) {
  const [template, listing] = await Promise.all([
    getTemplateForEdit(params.templateId, params.listingId),
    getListingDetails(params.listingId)
  ])

  if (!template || !listing) {
    notFound()
  }

  let pdfBase64: string | null = null
  
  if (template.pdfFileUrl) {
    try {
      const pdfArrayBuffer = await fetchPdfFromUrl(template.pdfFileUrl)
      // Convert ArrayBuffer to base64 for serialization
      const uint8Array = new Uint8Array(pdfArrayBuffer)
      pdfBase64 = Buffer.from(uint8Array).toString('base64')
    } catch (error) {
      console.error('Failed to fetch PDF:', error)
    }
  }

  const hostName = template.user ? 
    `${template.user.firstName || ''} ${template.user.lastName || ''}`.trim() : 
    undefined
  const hostEmail = template.user?.email || undefined
  const listingAddress = listing.streetAddress1 || ''

  // Convert template to plain object to avoid serialization issues
  const templateData = {
    id: template.id,
    title: template.title,
    type: template.type,
    templateData: template.templateData,
    pdfFileName: template.pdfFileName,
    pdfFileUrl: template.pdfFileUrl,
    updatedAt: template.updatedAt.toISOString(),
    user: template.user ? {
      id: template.user.id,
      firstName: template.user.firstName,
      lastName: template.user.lastName,
      email: template.user.email
    } : null
  }

  return (
    <TemplateEditClient
      template={templateData}
      pdfBase64={pdfBase64}
      listingId={params.listingId}
      hostName={hostName}
      hostEmail={hostEmail}
      listingAddress={listingAddress}
    />
  )
}