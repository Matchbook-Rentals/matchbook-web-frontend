#!/bin/bash

# Run the tests for the map refactoring
echo "Running tests for map refactoring..."

# Run the useTripSnapshot test
echo "Testing useTripSnapshot hook..."
npx vitest run test/hooks/useTripSnapshot.test.tsx

# Run the search-map test
echo "Testing search-map component..."
npx vitest run test/components/map/search-map.test.tsx

echo "Tests completed!"