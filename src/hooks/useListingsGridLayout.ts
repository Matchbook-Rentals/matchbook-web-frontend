import { useState, useEffect, RefObject } from 'react';

// Layout constants
const CARD_WIDTH = 280;
const GAP_WIDTH = 16;
const MAX_COLUMNS = 3;
const MIN_MAP_WIDTH = 300;
const CONTAINER_PADDING = 16; // md:pr-4

interface UseListingsGridLayoutOptions {
  minMapWidth?: number;
}

interface UseListingsGridLayoutResult {
  columnCount: number;
  listingsWidth: number;
  mapWidth: number;
  shouldShowSideBySide: boolean;
  gridGap: number;
  isCalculated: boolean;
}

const calculateListingsWidth = (columns: number): number => {
  return columns * CARD_WIDTH + (columns - 1) * GAP_WIDTH + CONTAINER_PADDING;
};

const calculateMaxColumns = (availableWidth: number, minMapWidth: number): number => {
  // Try from max columns down to 1
  for (let cols = MAX_COLUMNS; cols >= 1; cols--) {
    const listingsWidth = calculateListingsWidth(cols);
    const remainingForMap = availableWidth - listingsWidth;
    if (remainingForMap >= minMapWidth) {
      return cols;
    }
  }
  return 0; // Can't fit even 1 column with map
};

export function useListingsGridLayout(
  containerRef: RefObject<HTMLElement | null>,
  options?: UseListingsGridLayoutOptions
): UseListingsGridLayoutResult {
  const minMapWidth = options?.minMapWidth ?? MIN_MAP_WIDTH;

  const [layoutState, setLayoutState] = useState<UseListingsGridLayoutResult>({
    columnCount: 2,
    listingsWidth: calculateListingsWidth(2),
    mapWidth: 400,
    shouldShowSideBySide: true,
    gridGap: GAP_WIDTH,
    isCalculated: false,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const calculateLayout = () => {
      const containerWidth = container.clientWidth;

      if (containerWidth === 0) return;

      const maxColumns = calculateMaxColumns(containerWidth, minMapWidth);

      if (maxColumns === 0) {
        // Can't fit side-by-side layout
        setLayoutState({
          columnCount: 1,
          listingsWidth: containerWidth,
          mapWidth: 0,
          shouldShowSideBySide: false,
          gridGap: GAP_WIDTH,
          isCalculated: true,
        });
        return;
      }

      const listingsWidth = calculateListingsWidth(maxColumns);
      const mapWidth = containerWidth - listingsWidth;

      setLayoutState({
        columnCount: maxColumns,
        listingsWidth,
        mapWidth,
        shouldShowSideBySide: true,
        gridGap: GAP_WIDTH,
        isCalculated: true,
      });
    };

    // Initial calculation
    calculateLayout();

    // Set up ResizeObserver for dynamic updates
    const resizeObserver = new ResizeObserver(() => {
      calculateLayout();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef, minMapWidth]);

  return layoutState;
}
