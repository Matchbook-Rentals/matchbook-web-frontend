"use client";

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, X, CalendarIcon, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface UnavailabilityFormProps {
  listingId: string;
  onSuccess?: (unavailability: any) => void;
  onDelete?: (unavailabilityId: string) => void;
  onClearEdit?: () => void;
  editingUnavailability?: any;
}

interface UnavailabilityFormData {
  startDate: Date | undefined;
  endDate: Date | undefined;
  reason: string;
}

const UnavailabilityForm: React.FC<UnavailabilityFormProps> = ({
  listingId,
  onSuccess,
  onDelete,
  onClearEdit,
  editingUnavailability
}) => {
  const [formData, setFormData] = useState<UnavailabilityFormData>({
    startDate: undefined,
    endDate: undefined,
    reason: ''
  });
  const [originalData, setOriginalData] = useState<UnavailabilityFormData>({
    startDate: undefined,
    endDate: undefined,
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Update form when editing unavailability changes
  React.useEffect(() => {
    if (editingUnavailability) {
      const data = {
        startDate: new Date(editingUnavailability.startDate),
        endDate: new Date(editingUnavailability.endDate),
        reason: editingUnavailability.reason || ''
      };
      setFormData(data);
      setOriginalData(data);
    } else {
      const emptyData = {
        startDate: undefined,
        endDate: undefined,
        reason: ''
      };
      setFormData(emptyData);
      setOriginalData(emptyData);
    }
  }, [editingUnavailability]);

  const handleDateChange = (field: 'startDate' | 'endDate', date: Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
  };

  const handleReasonChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      reason: value
    }));
  };

  // Check if form has changes
  const hasChanges = () => {
    return (
      formData.startDate?.getTime() !== originalData.startDate?.getTime() ||
      formData.endDate?.getTime() !== originalData.endDate?.getTime() ||
      formData.reason !== originalData.reason
    );
  };

  const validateForm = (): boolean => {
    if (!formData.startDate) {
      toast({
        title: "Error",
        description: "Start date is required",
        variant: "destructive"
      });
      return false;
    }
    
    if (!formData.endDate) {
      toast({
        title: "Error", 
        description: "End date is required",
        variant: "destructive"
      });
      return false;
    }

    if (formData.startDate > formData.endDate) {
      toast({
        title: "Error",
        description: "Start date must be before or equal to end date",
        variant: "destructive"
      });
      return false;
    }

    if (formData.startDate < new Date(new Date().setHours(0, 0, 0, 0))) {
      toast({
        title: "Error",
        description: "Start date cannot be in the past",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const isEditing = !!editingUnavailability;
      const url = isEditing 
        ? `/api/listings/unavailability?id=${editingUnavailability.id}`
        : '/api/listings/unavailability';
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId,
          startDate: formData.startDate!.toISOString(),
          endDate: formData.endDate!.toISOString(),
          reason: formData.reason.trim() || undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'add'} unavailability`);
      }

      const updatedUnavailability = await response.json();

      toast({
        title: "Success",
        description: `Unavailability period ${isEditing ? 'updated' : 'added'} successfully`,
      });

      // Reset form if adding new, update original data if editing
      if (isEditing) {
        const newData = {
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason
        };
        setOriginalData(newData);
      } else {
        setFormData({
          startDate: undefined,
          endDate: undefined,
          reason: ''
        });
        setOriginalData({
          startDate: undefined,
          endDate: undefined,
          reason: ''
        });
      }

      // Notify parent component with the unavailability data
      if (onSuccess) {
        onSuccess(updatedUnavailability);
      }

    } catch (error) {
      console.error('Error adding unavailability:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to add unavailability',
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearForm = () => {
    const emptyData = {
      startDate: undefined,
      endDate: undefined,
      reason: ''
    };
    setFormData(emptyData);
    setOriginalData(emptyData);
    
    // Clear editing unavailability if provided
    if (editingUnavailability && onClearEdit) {
      onClearEdit();
    }
  };

  const handleDelete = async () => {
    if (!editingUnavailability || !onDelete) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/listings/unavailability?id=${editingUnavailability.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete unavailability');
      }

      toast({
        title: "Success",
        description: "Unavailability period deleted successfully",
      });

      // Notify parent component
      onDelete(editingUnavailability.id);

      // Clear form
      clearForm();

    } catch (error) {
      console.error('Error deleting unavailability:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete unavailability',
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {editingUnavailability ? 'Edit Unavailable Dates' : 'Block Unavailable Dates'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !formData.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => handleDateChange('startDate', date)}
                    initialFocus
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !formData.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => handleDateChange('endDate', date)}
                    initialFocus
                    disabled={(date) => {
                      const today = new Date(new Date().setHours(0, 0, 0, 0));
                      const startDate = formData.startDate;
                      return date < today || (startDate && date < startDate);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => handleReasonChange(e.target.value)}
              className="mt-1"
              placeholder="e.g., Personal use, maintenance, already booked elsewhere..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || (!editingUnavailability && false) || (editingUnavailability && !hasChanges())}
              className="flex-1"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {editingUnavailability ? 'Saving...' : 'Adding...'}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {editingUnavailability ? <></> : <Calendar className="h-4 w-4" />}
                  {editingUnavailability ? 'Save Changes' : 'Add Unavailability'}
                </div>
              )}
            </Button>
            
            {editingUnavailability && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting || isDeleting}
              >
                {isDeleting ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </div>
                )}
              </Button>
            )}
            
            <Button
              type="button"
              variant="outline"
              onClick={clearForm}
              disabled={isSubmitting || isDeleting}
            >
              <div className="flex items-center gap-2">
                <X className="h-4 w-4" />
                {editingUnavailability ? 'Cancel' : 'Clear'}
              </div>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default UnavailabilityForm;