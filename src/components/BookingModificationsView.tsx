'use client'

import React, { useState, useEffect } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, User, XIcon, ChevronDownIcon, Loader2 } from "lucide-react"
import { BrandButton } from "@/components/ui/brandButton"
import { Textarea } from "@/components/ui/textarea"
import { getAllBookingModifications, approveUnifiedModification, rejectUnifiedModification, UnifiedModification } from '@/app/actions/booking-modifications'
import { toast } from 'sonner'
import { useUser } from '@clerk/nextjs'


interface BookingModificationsViewProps {
  bookingId: string
  bookingTitle: string
}

const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-[#e9f7ee] text-[#1ca34e] border-[#1ca34e]'
    case 'pending':
      return 'bg-[#fff3cd] text-[#e67e22] border-[#e67e22]'
    case 'rejected':
      return 'bg-[#f8d7da] text-[#dc3545] border-[#dc3545]'
    default:
      return 'bg-gray-100 text-gray-600 border-gray-400'
  }
}

const getTypeBadgeStyle = (type: 'booking' | 'payment') => {
  switch (type) {
    case 'booking':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'payment':
      return 'bg-purple-50 text-purple-700 border-purple-200'
    default:
      return 'bg-gray-100 text-gray-600 border-gray-400'
  }
}

const formatDateRange = (startDate: Date, endDate: Date) => {
  const formatOptions: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }
  return `${startDate.toLocaleDateString('en-US', formatOptions)} - ${endDate.toLocaleDateString('en-US', formatOptions)}`
}

const getRequestorName = (requestor: BookingModification['requestor'], requestorId?: string) => {
  if (!requestor) {
    return requestorId ? `User (${requestorId.slice(-8)})` : 'Unknown User';
  }
  
  const fullName = requestor.fullName;
  const combinedName = `${requestor.firstName || ''} ${requestor.lastName || ''}`.trim();
  
  if (fullName) return fullName;
  if (combinedName) return combinedName;
  
  // Fallback to showing partial user ID if no name data
  return requestorId ? `User (${requestorId.slice(-8)})` : 'Unknown User';
}

const getModificationTitle = (modification: UnifiedModification) => {
  if (modification.type === 'booking') {
    return 'Move-in/Move-out Change'
  } else {
    return 'Payment Change'
  }
}

export default function BookingModificationsView({ 
  bookingId,
  bookingTitle
}: BookingModificationsViewProps) {
  const { user } = useUser()
  const [modifications, setModifications] = useState<UnifiedModification[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedModifications, setExpandedModifications] = useState<Set<string>>(new Set())
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({})
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchModifications = async () => {
      try {
        const result = await getAllBookingModifications(bookingId)
        if (result.success && result.modifications) {
          setModifications(result.modifications)
        }
      } catch (error) {
        console.error('Error fetching modifications:', error)
        toast.error('Failed to load booking modifications')
      } finally {
        setLoading(false)
      }
    }

    fetchModifications()
  }, [bookingId])

  const refreshModifications = async () => {
    try {
      const result = await getAllBookingModifications(bookingId)
      if (result.success && result.modifications) {
        setModifications(result.modifications)
      }
    } catch (error) {
      console.error('Error refreshing modifications:', error)
    }
  }

  const toggleModification = (modificationId: string) => {
    const newExpanded = new Set(expandedModifications)
    if (newExpanded.has(modificationId)) {
      newExpanded.delete(modificationId)
    } else {
      newExpanded.add(modificationId)
    }
    setExpandedModifications(newExpanded)
  }

  const handleApprove = async (modificationId: string, modificationType: 'booking' | 'payment') => {
    setLoadingActions(prev => new Set([...prev, modificationId]))
    try {
      const result = await approveUnifiedModification(modificationId, modificationType)
      if (result.success) {
        toast.success(`${modificationType === 'booking' ? 'Booking' : 'Payment'} modification approved successfully`)
        refreshModifications()
      } else {
        throw new Error(result.error || 'Failed to approve modification')
      }
    } catch (error) {
      console.error('Error approving modification:', error)
      toast.error(`Failed to approve ${modificationType} modification`)
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev)
        newSet.delete(modificationId)
        return newSet
      })
    }
  }

  const handleReject = async (modificationId: string, modificationType: 'booking' | 'payment') => {
    const reason = rejectionReasons[modificationId]
    setLoadingActions(prev => new Set([...prev, modificationId]))
    try {
      const result = await rejectUnifiedModification(modificationId, modificationType, reason)
      if (result.success) {
        toast.success(`${modificationType === 'booking' ? 'Booking' : 'Payment'} modification rejected`)
        refreshModifications()
      } else {
        throw new Error(result.error || 'Failed to reject modification')
      }
    } catch (error) {
      console.error('Error rejecting modification:', error)
      toast.error(`Failed to reject ${modificationType} modification`)
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev)
        newSet.delete(modificationId)
        return newSet
      })
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#3c8787]" />
        <p className="text-[#777b8b]">Loading booking modifications...</p>
      </div>
    )
  }

  if (!modifications || modifications.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-[#777b8b]">No booking modifications found.</p>
      </div>
    )
  }

  const pendingModifications = modifications.filter(mod => mod.status === 'pending')
  const completedModifications = modifications.filter(mod => mod.status !== 'pending')

  return (
    <Card className="w-full bg-white rounded-xl">
      <CardContent className="flex flex-col items-center gap-6 p-6">

        <section className="flex flex-col items-start relative self-stretch w-full">
          {/* Pending Modifications */}
          {pendingModifications.length > 0 && (
            <div className="flex flex-col items-start gap-[18px] pt-0 pb-7 px-0 relative self-stretch w-full">
              <div className="flex items-center px-0 py-1 relative self-stretch w-full flex-[0_0_auto]">
                <div className="relative w-fit [font-family:'Public_Sans',Helvetica] font-medium text-[#2e18139e] text-[13px] tracking-[0] leading-4 whitespace-nowrap">
                  Pending Requests ({pendingModifications.length})
                </div>
              </div>

              <div className="relative self-stretch w-full space-y-4">
                {pendingModifications.map((modification) => (
                  <div
                    key={modification.id}
                    className="relative self-stretch w-full border border-[#6e4f4933] rounded-lg bg-white"
                  >
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer"
                      onClick={() => toggleModification(modification.id)}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="overflow-hidden text-[#281D1B] text-ellipsis [font-family:'Public_Sans',Helvetica] text-[15px] font-normal leading-5 tracking-[-0.075px] truncate">
                          {getModificationTitle(modification)}
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          <Badge
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-solid ${getStatusBadgeStyle(modification.status)}`}
                          >
                            <span className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-sm text-center tracking-[0] leading-5 whitespace-nowrap">
                              {modification.status === 'pending' ? 'Change requested' : modification.status.charAt(0).toUpperCase() + modification.status.slice(1)}
                            </span>
                          </Badge>
                        </div>
                      </div>

                      <Button variant="ghost" size="icon" className="h-auto p-0 flex-shrink-0">
                        <ChevronDownIcon className={`w-5 h-5 transition-transform ${expandedModifications.has(modification.id) ? 'rotate-180' : ''}`} />
                      </Button>
                    </div>

                    {expandedModifications.has(modification.id) && (
                      <div className="px-4 pb-4 border-t border-[#6e4f4933] bg-gray-50">
                        <div className="pt-5 flex flex-col md:flex-row gap-6">
                          {/* Left Column - Fields */}
                          <div className="flex-1 max-w-none md:max-w-[445px]">
                            {modification.type === 'payment' ? (
                              <div className="space-y-6">
                                {/* Current Values Row */}
                                <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                    <Label className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm">
                                      Current Due Date
                                    </Label>
                                    <Input
                                      value={modification.originalDueDate!.toLocaleDateString()}
                                      className="h-12 mt-1.5 bg-white border-[#d0d5dd] text-[#667085]"
                                      readOnly
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <Label className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm">
                                      Current Amount
                                    </Label>
                                    <Input
                                      value={`$${(modification.originalAmount! / 100).toFixed(2)}`}
                                      className="h-12 mt-1.5 bg-white border-[#d0d5dd] text-[#667085]"
                                      readOnly
                                    />
                                  </div>
                                </div>
                                
                                {/* New Values Row */}
                                <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                    <Label className="[font-family:'Poppins',Helvetica] font-semibold text-[#344054] text-sm">
                                      New Due Date
                                    </Label>
                                    <Input
                                      value={modification.newDueDate!.toLocaleDateString()}
                                      className="h-12 mt-1.5 bg-white border-[#d0d5dd] [font-family:'Poppins',Helvetica] font-semibold text-[#667085]"
                                      readOnly
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <Label className="[font-family:'Poppins',Helvetica] font-semibold text-[#344054] text-sm">
                                      New Amount
                                    </Label>
                                    <Input
                                      value={`$${(modification.newAmount! / 100).toFixed(2)}`}
                                      className="h-12 mt-1.5 bg-white border-[#d0d5dd] [font-family:'Poppins',Helvetica] font-semibold text-[#667085]"
                                      readOnly
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-6">
                                {/* Current Date Range */}
                                <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                    <Label className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm">
                                      Current Move-in Date
                                    </Label>
                                    <Input
                                      value={modification.originalStartDate!.toLocaleDateString()}
                                      className="h-12 mt-1.5 bg-white border-[#d0d5dd] text-[#667085]"
                                      readOnly
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <Label className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm">
                                      Current Move-out Date
                                    </Label>
                                    <Input
                                      value={modification.originalEndDate!.toLocaleDateString()}
                                      className="h-12 mt-1.5 bg-white border-[#d0d5dd] text-[#667085]"
                                      readOnly
                                    />
                                  </div>
                                </div>
                                
                                {/* New Date Range */}
                                <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                    <Label className="[font-family:'Poppins',Helvetica] font-semibold text-[#344054] text-sm">
                                      New Move-in Date
                                    </Label>
                                    <Input
                                      value={modification.newStartDate!.toLocaleDateString()}
                                      className="h-12 mt-1.5 bg-white border-[#d0d5dd] [font-family:'Poppins',Helvetica] font-semibold text-[#667085]"
                                      readOnly
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <Label className="[font-family:'Poppins',Helvetica] font-semibold text-[#344054] text-sm">
                                      New Move-out Date
                                    </Label>
                                    <Input
                                      value={modification.newEndDate!.toLocaleDateString()}
                                      className="h-12 mt-1.5 bg-white border-[#d0d5dd] [font-family:'Poppins',Helvetica] font-semibold text-[#667085]"
                                      readOnly
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Right Column - Action Buttons (bottom aligned) */}
                          <div className="flex items-end justify-end md:justify-start">
                            {user?.id === modification.recipientId ? (
                              <div className="flex gap-4">
                                <Button
                                  variant="outline"
                                  onClick={() => handleReject(modification.id, modification.type)}
                                  disabled={loadingActions.has(modification.id)}
                                  className="h-12 border-[#3c8787] text-[#3c8787] hover:bg-transparent [font-family:'Poppins',Helvetica] font-semibold"
                                >
                                  {loadingActions.has(modification.id) ? 'Processing...' : 'Decline Change'}
                                </Button>
                                <Button
                                  onClick={() => handleApprove(modification.id, modification.type)}
                                  disabled={loadingActions.has(modification.id)}
                                  className="h-12 w-[194px] bg-[#3c8787] hover:bg-[#2d6666] text-white [font-family:'Poppins',Helvetica] font-semibold"
                                >
                                  {loadingActions.has(modification.id) ? 'Processing...' : 'Approve Change'}
                                </Button>
                              </div>
                            ) : user?.id === modification.requestorId ? (
                              <div className="flex">
                                <p className="text-[#777b8b] [font-family:'Poppins',Helvetica] font-medium text-sm">
                                  Change is still pending
                                </p>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Modifications */}
          {completedModifications.length > 0 && (
            <div className="flex flex-col items-start gap-[18px] pt-0 pb-7 px-0 relative self-stretch w-full">
              <div className="flex items-center px-0 py-1 relative self-stretch w-full flex-[0_0_auto]">
                <div className="relative w-fit [font-family:'Public_Sans',Helvetica] font-medium text-[#2e18139e] text-[13px] tracking-[0] leading-4 whitespace-nowrap">
                  Previous Requests ({completedModifications.length})
                </div>
              </div>

              <div className="relative self-stretch w-full space-y-4">
                {completedModifications.map((modification) => (
                  <div
                    key={modification.id}
                    className="relative self-stretch w-full border border-[#6e4f4933] rounded-lg bg-white"
                  >
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer"
                      onClick={() => toggleModification(modification.id)}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="overflow-hidden text-[#281D1B] text-ellipsis [font-family:'Public_Sans',Helvetica] text-[15px] font-normal leading-5 tracking-[-0.075px] truncate">
                          {getModificationTitle(modification)}
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          <Badge
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-solid ${getStatusBadgeStyle(modification.status)}`}
                          >
                            <span className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-sm text-center tracking-[0] leading-5 whitespace-nowrap">
                              {modification.status === 'pending' ? 'Change requested' : modification.status.charAt(0).toUpperCase() + modification.status.slice(1)}
                            </span>
                          </Badge>
                        </div>
                      </div>

                      <Button variant="ghost" size="icon" className="h-auto p-0 flex-shrink-0">
                        <ChevronDownIcon className={`w-5 h-5 transition-transform ${expandedModifications.has(modification.id) ? 'rotate-180' : ''}`} />
                      </Button>
                    </div>

                    {expandedModifications.has(modification.id) && (
                      <div className="px-4 pb-4 border-t border-[#6e4f4933] bg-gray-50">
                        <div className="pt-5 flex flex-col md:flex-row gap-6">
                          {/* Left Column - Fields */}
                          <div className="flex-1 max-w-none md:max-w-[445px]">
                            {modification.type === 'payment' ? (
                              <div className="space-y-6">
                                {/* Current Values Row */}
                                <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                    <Label className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm">
                                      Current Due Date
                                    </Label>
                                    <Input
                                      value={modification.originalDueDate!.toLocaleDateString()}
                                      className="h-12 mt-1.5 bg-white border-[#d0d5dd] text-[#667085]"
                                      readOnly
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <Label className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm">
                                      Current Amount
                                    </Label>
                                    <Input
                                      value={`$${(modification.originalAmount! / 100).toFixed(2)}`}
                                      className="h-12 mt-1.5 bg-white border-[#d0d5dd] text-[#667085]"
                                      readOnly
                                    />
                                  </div>
                                </div>
                                
                                {/* New Values Row */}
                                <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                    <Label className="[font-family:'Poppins',Helvetica] font-semibold text-[#344054] text-sm">
                                      New Due Date
                                    </Label>
                                    <Input
                                      value={modification.newDueDate!.toLocaleDateString()}
                                      className="h-12 mt-1.5 bg-white border-[#d0d5dd] [font-family:'Poppins',Helvetica] font-semibold text-[#667085]"
                                      readOnly
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <Label className="[font-family:'Poppins',Helvetica] font-semibold text-[#344054] text-sm">
                                      New Amount
                                    </Label>
                                    <Input
                                      value={`$${(modification.newAmount! / 100).toFixed(2)}`}
                                      className="h-12 mt-1.5 bg-white border-[#d0d5dd] [font-family:'Poppins',Helvetica] font-semibold text-[#667085]"
                                      readOnly
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-6">
                                {/* Current Date Range */}
                                <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                    <Label className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm">
                                      Current Move-in Date
                                    </Label>
                                    <Input
                                      value={modification.originalStartDate!.toLocaleDateString()}
                                      className="h-12 mt-1.5 bg-white border-[#d0d5dd] text-[#667085]"
                                      readOnly
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <Label className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm">
                                      Current Move-out Date
                                    </Label>
                                    <Input
                                      value={modification.originalEndDate!.toLocaleDateString()}
                                      className="h-12 mt-1.5 bg-white border-[#d0d5dd] text-[#667085]"
                                      readOnly
                                    />
                                  </div>
                                </div>
                                
                                {/* New Date Range */}
                                <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                    <Label className="[font-family:'Poppins',Helvetica] font-semibold text-[#344054] text-sm">
                                      New Move-in Date
                                    </Label>
                                    <Input
                                      value={modification.newStartDate!.toLocaleDateString()}
                                      className="h-12 mt-1.5 bg-white border-[#d0d5dd] [font-family:'Poppins',Helvetica] font-semibold text-[#667085]"
                                      readOnly
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <Label className="[font-family:'Poppins',Helvetica] font-semibold text-[#344054] text-sm">
                                      New Move-out Date
                                    </Label>
                                    <Input
                                      value={modification.newEndDate!.toLocaleDateString()}
                                      className="h-12 mt-1.5 bg-white border-[#d0d5dd] [font-family:'Poppins',Helvetica] font-semibold text-[#667085]"
                                      readOnly
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Right Column - Action Buttons (bottom aligned) */}
                          <div className="flex items-end justify-end md:justify-start">
                            {modification.status === 'pending' && user?.id === modification.recipientId ? (
                              <div className="flex gap-4">
                                <Button
                                  variant="outline"
                                  onClick={() => handleReject(modification.id, modification.type)}
                                  disabled={loadingActions.has(modification.id)}
                                  className="h-12 border-[#3c8787] text-[#3c8787] hover:bg-transparent [font-family:'Poppins',Helvetica] font-semibold"
                                >
                                  {loadingActions.has(modification.id) ? 'Processing...' : 'Decline Change'}
                                </Button>
                                <Button
                                  onClick={() => handleApprove(modification.id, modification.type)}
                                  disabled={loadingActions.has(modification.id)}
                                  className="h-12 w-[194px] bg-[#3c8787] hover:bg-[#2d6666] text-white [font-family:'Poppins',Helvetica] font-semibold"
                                >
                                  {loadingActions.has(modification.id) ? 'Processing...' : 'Approve Change'}
                                </Button>
                              </div>
                            ) : modification.status === 'pending' && user?.id === modification.requestorId ? (
                              <div className="flex">
                                <p className="text-[#777b8b] [font-family:'Poppins',Helvetica] font-medium text-sm">
                                  Change is still pending
                                </p>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {modifications.length === 0 && (
            <div className="text-center py-8 text-[#777b8b]">
              No modification requests yet.
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  )
}
