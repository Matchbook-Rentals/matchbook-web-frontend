'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { 
  ArrowLeft, 
  Save,
  Calendar,
  DollarSign
} from 'lucide-react'
import { updateBookingDetails } from '../../_actions'

interface BookingData {
  id: string;
  startDate: Date;
  endDate: Date;
  monthlyRent: number | null;
  status: string;
  user: {
    firstName: string | null;
    lastName: string | null;
  };
  listing: {
    title: string;
    city: string | null;
    state: string | null;
  };
}

interface BookingEditFormProps {
  booking: BookingData;
}

const statusOptions = [
  { value: 'reserved', label: 'Reserved' },
  { value: 'active', label: 'Active' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' }
];

export default function BookingEditForm({ booking }: BookingEditFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    startDate: booking.startDate.toISOString().split('T')[0],
    endDate: booking.endDate.toISOString().split('T')[0],
    monthlyRent: booking.monthlyRent?.toString() || '',
    status: booking.status
  });

  // Track changes
  const [hasChanges, setHasChanges] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.startDate) {
      errors.push('Start date is required');
    }

    if (!formData.endDate) {
      errors.push('End date is required');
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start >= end) {
        errors.push('End date must be after start date');
      }
    }

    if (!formData.monthlyRent || isNaN(Number(formData.monthlyRent))) {
      errors.push('Valid monthly rent is required');
    } else if (Number(formData.monthlyRent) <= 0) {
      errors.push('Monthly rent must be greater than 0');
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const updates: any = {};
      
      // Check what changed and only update those fields
      if (formData.startDate !== booking.startDate.toISOString().split('T')[0]) {
        updates.startDate = new Date(formData.startDate);
      }
      
      if (formData.endDate !== booking.endDate.toISOString().split('T')[0]) {
        updates.endDate = new Date(formData.endDate);
      }
      
      if (Number(formData.monthlyRent) !== booking.monthlyRent) {
        updates.monthlyRent = Number(formData.monthlyRent);
      }
      
      if (formData.status !== booking.status) {
        updates.status = formData.status;
      }

      if (Object.keys(updates).length === 0) {
        toast({
          title: "No Changes",
          description: "No changes detected to save"
        });
        return;
      }

      await updateBookingDetails(booking.id, updates);
      
      toast({
        title: "Success",
        description: "Booking updated successfully"
      });
      
      router.push(`/admin/booking-management/${booking.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update booking",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
        return;
      }
    }
    router.back();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Booking</h1>
            <p className="text-muted-foreground">
              {booking.user.firstName} {booking.user.lastName} • {booking.listing.title}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dates Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5" />
                    <h3 className="text-lg font-medium">Stay Dates</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-date">Check-in Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="end-date">Check-out Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => handleInputChange('endDate', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5" />
                    <h3 className="text-lg font-medium">Pricing</h3>
                  </div>
                  
                  <div>
                    <Label htmlFor="monthly-rent">Monthly Rent ($)</Label>
                    <Input
                      id="monthly-rent"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Enter monthly rent amount"
                      value={formData.monthlyRent}
                      onChange={(e) => handleInputChange('monthlyRent', e.target.value)}
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      This will also update the associated match record
                    </p>
                  </div>
                </div>

                {/* Status Section */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="status">Booking Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => handleInputChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-6">
                  <Button
                    type="submit"
                    disabled={isLoading || !hasChanges}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Information */}
          <Card>
            <CardHeader>
              <CardTitle>Current Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Current Check-in</Label>
                <p>{booking.startDate.toLocaleDateString()}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Current Check-out</Label>
                <p>{booking.endDate.toLocaleDateString()}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Current Monthly Rent</Label>
                <p className="text-lg font-semibold">${booking.monthlyRent?.toLocaleString()}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Current Status</Label>
                <p className="capitalize">{booking.status}</p>
              </div>
            </CardContent>
          </Card>

          {/* Important Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Important Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <h4 className="font-medium text-yellow-800 mb-1">Date Changes</h4>
                <p className="text-yellow-700">
                  Changing dates may require manual adjustment of rent payment schedules.
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-medium text-blue-800 mb-1">Rent Changes</h4>
                <p className="text-blue-700">
                  Monthly rent changes will also update the associated match record.
                </p>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <h4 className="font-medium text-red-800 mb-1">Status Changes</h4>
                <p className="text-red-700">
                  Both guest and host will be notified of any status changes.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={`/admin/booking-management/${booking.id}`}>
                  View Booking Details
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={`/admin/listing-management/${booking.listing}`}>
                  View Listing
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}