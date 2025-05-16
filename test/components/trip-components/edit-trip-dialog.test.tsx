import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EditTripDialog from '@/app/platform/trips/(trips-components)/edit-trip-dialog';
import { Trip } from '@prisma/client';

// Mock the SearchEditBar component
vi.mock('@/components/home-components/search-edit-bar', () => ({
  default: ({ onClose }: { onClose?: () => void }) => (
    <div data-testid="search-edit-bar">
      {onClose && (
        <button onClick={onClose} data-testid="close-button">
          Close
        </button>
      )}
    </div>
  ),
}));

describe('EditTripDialog', () => {
  const mockTrip: Trip = {
    id: '1',
    locationString: 'Test Location',
    latitude: 40.7128,
    longitude: -74.0060,
    startDate: new Date(),
    endDate: new Date(),
    numAdults: 2,
    numChildren: 0,
    numPets: 0,
    flexibleStart: 0,
    flexibleEnd: 0,
    userId: 'user1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should pass onClose handler to SearchEditBar', () => {
    render(<EditTripDialog trip={mockTrip} />);
    
    // Open the dialog
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);
    
    // Check that SearchEditBar is rendered with close button
    const searchEditBar = screen.getByTestId('search-edit-bar');
    expect(searchEditBar).toBeInTheDocument();
    
    const closeButton = screen.getByTestId('close-button');
    expect(closeButton).toBeInTheDocument();
  });
});