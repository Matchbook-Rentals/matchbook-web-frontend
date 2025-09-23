// Test script to verify calendar month logic for trip date rolling
// Based on the Trip model from Prisma schema

function addOneCalendarMonth(date) {
  const newDate = new Date(date);
  const currentMonth = newDate.getUTCMonth();
  const currentDay = newDate.getUTCDate();

  // Add one month
  newDate.setUTCMonth(currentMonth + 1);

  // Handle edge case where the day doesn't exist in the next month
  // e.g., Jan 31 -> Feb 31 doesn't exist, so it becomes Feb 28/29
  if (newDate.getUTCDate() !== currentDay) {
    // JavaScript automatically rolled over to next month, so go back to last day of target month
    newDate.setUTCDate(0); // Sets to last day of previous month
  }

  return newDate;
}

function testDateRollingWithCalendarMonth() {
  console.log('Testing date rolling logic with calendar month minimum...\n');

  // Test cases based on real-world scenarios
  const testCases = [
    {
      name: "1 month search: Jan 15 to Feb 15",
      startDate: new Date('2024-01-15T00:00:00.000Z'),
      endDate: new Date('2024-02-15T00:00:00.000Z')
    },
    {
      name: "1 month search: Jan 31 to Feb 29 (month boundary)",
      startDate: new Date('2024-01-31T00:00:00.000Z'),
      endDate: new Date('2024-02-29T00:00:00.000Z')  // 2024 is a leap year
    },
    {
      name: "Short search (10 days): Jan 15 to Jan 25 - should expand to 1 month",
      startDate: new Date('2024-01-15T00:00:00.000Z'),
      endDate: new Date('2024-01-25T00:00:00.000Z')
    },
    {
      name: "2 month search: Jan 15 to Mar 15",
      startDate: new Date('2024-01-15T00:00:00.000Z'),
      endDate: new Date('2024-03-15T00:00:00.000Z')
    },
    {
      name: "Very short search (3 days): Jan 28 to Jan 31 - should expand to 1 month",
      startDate: new Date('2024-01-28T00:00:00.000Z'),
      endDate: new Date('2024-01-31T00:00:00.000Z')
    },
    {
      name: "Edge case: Dec 31 to Jan 31 (crossing year)",
      startDate: new Date('2023-12-31T00:00:00.000Z'),
      endDate: new Date('2024-01-31T00:00:00.000Z')
    }
  ];

  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  testCases.forEach(testCase => {
    console.log(`\n--- ${testCase.name} ---`);
    console.log(`Original: ${testCase.startDate.toISOString().split('T')[0]} to ${testCase.endDate.toISOString().split('T')[0]}`);

    // Calculate original duration in days
    const originalDurationMs = testCase.endDate.getTime() - testCase.startDate.getTime();
    const originalDurationDays = Math.round(originalDurationMs / (1000 * 60 * 60 * 24));

    // New start date is tomorrow
    const newStartDate = new Date(tomorrow);

    // Calculate minimum end date (1 calendar month from start)
    const minimumEndDate = addOneCalendarMonth(newStartDate);
    const minimumDurationDays = Math.round((minimumEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24));

    // If original duration is less than 1 calendar month, use 1 calendar month
    // Otherwise, preserve the original duration
    let newEndDate;
    if (originalDurationDays < minimumDurationDays) {
      newEndDate = minimumEndDate;
      console.log(`⚠️  Duration was ${originalDurationDays} days (< 1 month), expanding to 1 calendar month`);
    } else {
      newEndDate = new Date(newStartDate);
      newEndDate.setUTCDate(newEndDate.getUTCDate() + originalDurationDays);
    }

    const newDurationDays = Math.round((newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24));

    console.log(`Rolling to: ${newStartDate.toISOString().split('T')[0]} to ${newEndDate.toISOString().split('T')[0]}`);
    console.log(`Original duration: ${originalDurationDays} days`);
    console.log(`New duration: ${newDurationDays} days`);
    console.log(`Minimum enforced: ${originalDurationDays < minimumDurationDays ? 'YES (expanded to 1 month)' : 'NO (already ≥ 1 month)'}`);
  });
}

testDateRollingWithCalendarMonth();