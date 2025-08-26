'use client'

import React, { useState } from 'react'
import { BrandButton } from '@/components/ui/brandButton'
import BrandModal from '@/components/BrandModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Trip } from '@prisma/client'
import { XIcon, CalendarIcon, MinusIcon, PlusIcon } from 'lucide-react'
import { format } from 'date-fns'
import { InteractiveDatePicker } from "@/components/ui/custom-calendar/date-range-selector/interactive-date-picker"
import { editTrip } from '@/app/actions/trips'

interface EditSearchModalProps {
  trip: Trip
  triggerButton?: React.ReactNode
  onTripUpdate?: (trip: Trip) => void
}

export default function EditSearchModal({ 
  trip,
  triggerButton,
  onTripUpdate
}: EditSearchModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [location, setLocation] = useState(trip.locationString)
  const [adults, setAdults] = useState(trip.numAdults)
  const [children, setChildren] = useState(trip.numChildren)
  const [startDate, setStartDate] = useState<Date | undefined>(trip.startDate ? new Date(trip.startDate) : undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(trip.endDate ? new Date(trip.endDate) : undefined)
  const [startDateInput, setStartDateInput] = useState(trip.startDate ? format(new Date(trip.startDate), "MM/dd/yyyy") : "")
  const [endDateInput, setEndDateInput] = useState(trip.endDate ? format(new Date(trip.endDate), "MM/dd/yyyy") : "")

  const handleAdultsIncrease = () => setAdults(prev => prev + 1)
  const handleAdultsDecrease = () => setAdults(prev => Math.max(1, prev - 1))
  const handleChildrenIncrease = () => setChildren(prev => prev + 1)
  const handleChildrenDecrease = () => setChildren(prev => Math.max(0, prev - 1))

  const defaultTrigger = (
    <BrandButton 
      variant="outline" 
      className="min-w-0 px-4 py-2"
      onClick={() => setIsOpen(true)}
    >
      Edit
    </BrandButton>
  )

  const contentComponent = (
    <div className="flex flex-col w-full items-start gap-8 p-2 relative bg-white">
      <div className="flex flex-col items-start gap-8 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
          <div className="relative w-fit mt-[-1.00px] font-semibold text-gray-700 text-lg">
            Edit Search
          </div>

          <Button variant="ghost" size="icon" className="h-5 w-5 p-0" onClick={() => setIsOpen(false)}>
            <XIcon className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-col items-start gap-4 relative flex-1 self-stretch w-full grow">
          <Label className="relative self-stretch mt-[-1.00px] font-medium text-gray-700 text-sm">
            Location
          </Label>

          <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="flex h-12 items-center gap-2 px-3 py-2 relative self-stretch w-full bg-white rounded-lg border border-solid border-gray-300 shadow-sm text-gray-600"
              />
            </div>
          </div>
        </div>

        <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
            <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
              <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                <Label className="relative w-fit mt-[-1.00px] font-medium text-gray-700 text-sm tracking-[0] leading-5 whitespace-nowrap">
                  Move-in
                </Label>
              </div>

              <div className="relative w-full">
                <div className="hidden md:block">
                  <Input
                    className="h-12 w-full pr-10 bg-white focus:outline-none focus:ring-2 focus:ring-black border border-gray-300 rounded-lg"
                    placeholder="mm/dd/yyyy"
                    value={startDateInput}
                    onChange={(e) => setStartDateInput(e.target.value)}
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-gray-600">
                        <CalendarIcon className="h-5 w-5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <InteractiveDatePicker
                        selectedDate={startDate}
                        onDateSelect={(date) => {
                          setStartDate(date);
                          setStartDateInput(date ? format(date, "MM/dd/yyyy") : "");
                        }}
                        minDate={new Date()}
                        isRangeMode={true}
                        startDate={startDate}
                        endDate={endDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="md:hidden">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="h-12 w-full px-3 bg-white border border-gray-300 rounded-md flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-black">
                        <span className={startDate ? "text-gray-700" : "text-gray-400"}>
                          {startDate ? format(startDate, "MM/dd/yyyy") : "mm/dd/yyyy"}
                        </span>
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <InteractiveDatePicker
                        selectedDate={startDate}
                        onDateSelect={(date) => {
                          setStartDate(date);
                          setStartDateInput(date ? format(date, "MM/dd/yyyy") : "");
                        }}
                        minDate={new Date()}
                        isRangeMode={true}
                        startDate={startDate}
                        endDate={endDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-1.5 relative flex-1 grow">
            <div className="flex flex-col items-start gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
              <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                <Label className="relative w-fit mt-[-1.00px] font-medium text-gray-700 text-sm tracking-[0] leading-5 whitespace-nowrap">
                  Move-out
                </Label>
              </div>

              <div className="relative w-full">
                <div className="hidden md:block">
                  <Input
                    className="h-12 w-full pr-10 bg-white focus:outline-none focus:ring-2 focus:ring-black border border-gray-300 rounded-lg"
                    placeholder="mm/dd/yyyy"
                    value={endDateInput}
                    onChange={(e) => setEndDateInput(e.target.value)}
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-gray-600">
                        <CalendarIcon className="h-5 w-5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <InteractiveDatePicker
                        selectedDate={endDate}
                        onDateSelect={(date) => {
                          setEndDate(date);
                          setEndDateInput(date ? format(date, "MM/dd/yyyy") : "");
                        }}
                        minDate={startDate || new Date()}
                        isRangeMode={true}
                        startDate={startDate}
                        endDate={endDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="md:hidden">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="h-12 w-full px-3 bg-white border border-gray-300 rounded-md flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-black">
                        <span className={endDate ? "text-gray-700" : "text-gray-400"}>
                          {endDate ? format(endDate, "MM/dd/yyyy") : "mm/dd/yyyy"}
                        </span>
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <InteractiveDatePicker
                        selectedDate={endDate}
                        onDateSelect={(date) => {
                          setEndDate(date);
                          setEndDateInput(date ? format(date, "MM/dd/yyyy") : "");
                        }}
                        minDate={startDate || new Date()}
                        isRangeMode={true}
                        startDate={startDate}
                        endDate={endDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
          <Label className="relative self-stretch mt-[-1.00px] font-medium text-gray-700 text-sm">
            Renters
          </Label>

          <Card className="flex flex-col items-center justify-center gap-2 p-3 relative self-stretch w-full flex-[0_0_auto] rounded-lg border border-solid border-gray-200">
            <CardContent className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto] p-0">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <div className="relative w-fit font-medium text-gray-600 text-sm">
                  Adults
                </div>

                <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0"
                    onClick={handleAdultsDecrease}
                  >
                    <MinusIcon className="h-4 w-4" />
                  </Button>

                  <div className="relative w-fit mt-[-1.00px] font-medium text-gray-700 text-base">
                    {adults}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0"
                    onClick={handleAdultsIncrease}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <div className="relative flex-1 font-medium text-gray-600 text-sm">
                  Children
                </div>

                <div className="inline-flex items-center gap-[11px] relative flex-[0_0_auto]">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0"
                    onClick={handleChildrenDecrease}
                  >
                    <MinusIcon className="h-4 w-4" />
                  </Button>

                  <div className="relative w-fit mt-[-1.00px] font-medium text-gray-700 text-base">
                    {children}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0"
                    onClick={handleChildrenIncrease}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 relative self-stretch w-full flex-[0_0_auto]">
        <BrandButton
          variant="outline"
          className="min-w-0 px-4 py-2"
          disabled={isLoading}
          onClick={() => setIsOpen(false)}
        >
          Cancel
        </BrandButton>

        <BrandButton 
          variant="default"
          className="min-w-0 px-4 py-2"
          disabled={isLoading}
          onClick={async () => {
            setIsLoading(true)
            try {
              const result = await editTrip(trip.id, {
                locationString: location,
                startDate: startDate,
                endDate: endDate,
                numAdults: adults,
                numChildren: children,
              })
              
              if (result.success && result.trip) {
                onTripUpdate?.(result.trip)
                setIsOpen(false)
              } else {
                console.error('Failed to update trip:', result.error)
                // TODO: Show error message to user
              }
            } catch (error) {
              console.error('Error updating trip:', error)
              // TODO: Show error message to user
            } finally {
              setIsLoading(false)
            }
          }}
        >
          {isLoading ? 'Saving...' : 'Save'}
        </BrandButton>
      </div>
    </div>
  )

  return (
    <BrandModal
      triggerButton={triggerButton || defaultTrigger}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      heightStyle="!top-[10vh] md:!top-[25vh]"
      className="max-w-2xl"
    >
      {contentComponent}
    </BrandModal>
  )
}