import React from 'react';

interface GuestType {
  type: 'adults' | 'children' | 'pets';
  label: string;
  min: number;
}

interface GuestCounts {
  adults: number;
  children: number;
  pets: number;
}

interface GuestTypeCounterProps {
  guests: GuestCounts;
  setGuests: React.Dispatch<React.SetStateAction<GuestCounts>>;
}

const GuestTypeCounter: React.FC<GuestTypeCounterProps> = ({ guests, setGuests }) => {
  const guestTypes: GuestType[] = [
    { type: 'adults', label: 'Adults', min: 1 },
    { type: 'children', label: 'Children', min: 0 },
    { type: 'pets', label: 'Pets', min: 0 }
  ];

  return (
    <div className="p-4 space-y-4">
      {guestTypes.map(({ type, label, min }) => (
        <div key={type} className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-medium">{label}</span>
            <span className="text-sm text-gray-500">
              {type === 'adults' ? 'Ages 18 or above' :
               type === 'children' ? '17 and under' :
               'Cats and Dogs'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setGuests(prev => ({
                ...prev,
                [type]: Math.max(prev[type] - 1, min)
              }))}
              disabled={guests[type] <= min}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center
                       disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-400"
            >
              -
            </button>
            <span className="w-6 text-center">{guests[type]}</span>
            <button
              onClick={() => setGuests(prev => ({
                ...prev,
                [type]: prev[type] + 1
              }))}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center
                       hover:border-gray-400"
            >
              +
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GuestTypeCounter;
