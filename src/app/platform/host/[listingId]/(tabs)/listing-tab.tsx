import React, { useState } from 'react';
import { useHostProperties } from '@/contexts/host-properties-provider';
import { addUnavailability } from '@/app/actions/listings';
import { useToast } from '@/components/ui/use-toast';

// Helper function to format dates
const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const ListingTab: React.FC = () => {
  const { currListing } = useHostProperties();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');

// on success create a toast and one for failure too
const { toast } = useToast();

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // Validate date inputs and handle potential errors
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      toast({
        title: "Error",
        description: "Invalid date format. Please enter valid dates.",
        variant: "destructive",
      });
    } else if (start > end) {
      toast({
        title: "Error",
        description: "Start date cannot be after end date.",
        variant: "destructive",
      });
    } else {
      try {

        let unavail = await addUnavailability(currListing!.id, start, end);
        toast({
          title: "Success",
          description: "Unavailability period added successfully.",
          variant: "default",
        });
          currListing?.unavailablePeriods?.push(unavail)
        // Reset form fields
        setStartDate('');
        setEndDate('');
        setReason('');
      } catch (error) {
        console.error('Error adding unavailability:', error);
        toast({
          title: "Error",
          description: "Failed to add unavailability period. Please try again.",
          variant: "destructive",
        });
      }
    }
  } else {
    toast({
      title: "Error",
      description: "Start and end dates are required.",
      variant: "destructive",
    });
  }
};

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="startDate">Start Date:</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="endDate">End Date:</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="reason">Reason (optional):</label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <button type="submit">Submit</button>
      </form>

      <h2>Current Unavailable Periods</h2>
      {currListing?.unavailablePeriods && currListing.unavailablePeriods.length > 0 ? (
        <ul>
          {currListing.unavailablePeriods.map((period, index) => (
            <li key={index}>
              {formatDate(new Date(period.startDate))} - {formatDate(new Date(period.endDate))}
              {period.reason && <span> (Reason: {period.reason})</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p>No unavailable periods set.</p>
      )}
    </div>
  );
};

export default ListingTab;
