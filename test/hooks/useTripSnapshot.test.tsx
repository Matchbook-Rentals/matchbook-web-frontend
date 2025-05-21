import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { useTripSnapshot } from '@/hooks/useTripSnapshot';
import { useTripActions } from '@/hooks/useTripActions';
import { TripContextProviderNew } from '@/contexts/trip-context-provider-new';

// Mock data
const mockTripData = {
  id: 'trip-1',
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 86400000 * 5).toISOString(),
  favorites: [],
  dislikes: [],
  housingRequests: [],
  matches: []
} as any;

const mockListingsData = [
  { id: 'listing-1', name: 'Listing 1', price: 1000 },
  { id: 'listing-2', name: 'Listing 2', price: 2000 }
] as any[];

// Test component using snapshot hook
function TestComponent({ selector }: { selector: (state: any) => any }) {
  const data = useTripSnapshot(selector);
  const { optimisticLike } = useTripActions();

  return (
    <div>
      <div data-testid="data">{JSON.stringify(data)}</div>
      <button 
        data-testid="like-button"
        onClick={() => optimisticLike('listing-1')}
      >
        Like Listing
      </button>
    </div>
  );
}

describe('useTripSnapshot hook', () => {
  test('should return a static snapshot that does not update on state changes', async () => {
    let renderCount = 0;

    const CounterWrapper = () => {
      renderCount++;
      
      return (
        <TripContextProviderNew
          tripData={mockTripData}
          listingData={mockListingsData}
        >
          <TestComponent selector={state => state.listings} />
        </TripContextProviderNew>
      );
    };

    render(<CounterWrapper />);
    
    // Get initial render data
    const initialData = screen.getByTestId('data').textContent;
    
    // Trigger state change
    await act(async () => {
      screen.getByTestId('like-button').click();
    });
    
    // Get data after state change
    const dataAfterChange = screen.getByTestId('data').textContent;
    
    // Verify data hasn't changed
    expect(dataAfterChange).toBe(initialData);
    
    // The test component should have rendered exactly once
    expect(renderCount).toBe(1);
  });
});