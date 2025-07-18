import { describe, it, expect } from 'vitest';

// Mock File class for testing
class MockFile {
  name: string;
  size: number;
  type: string;
  
  constructor(name: string, size: number, type = 'image/jpeg') {
    this.name = name;
    this.size = size;
    this.type = type;
  }
}

// Extract the batching logic for testing
const MAX_FILES_PER_BATCH = 4;
const MAX_BATCH_SIZE_MB = 8;

const createBatches = (files: File[]): File[][] => {
  if (files.length === 0) return [];
  
  const batches: File[][] = [];
  const maxBatchSizeBytes = MAX_BATCH_SIZE_MB * 1024 * 1024; // Convert MB to bytes
  
  // Sort files by size (smallest first) for better packing
  const sortedFiles = [...files].sort((a, b) => a.size - b.size);
  
  let currentBatch: File[] = [];
  let currentBatchSize = 0;
  
  for (const file of sortedFiles) {
    const fileSizeBytes = file.size;
    
    // Check if adding this file would exceed limits
    const wouldExceedFileLimit = currentBatch.length >= MAX_FILES_PER_BATCH;
    const wouldExceedSizeLimit = (currentBatchSize + fileSizeBytes) > maxBatchSizeBytes;
    
    // Start new batch if we would exceed either limit
    if (currentBatch.length > 0 && (wouldExceedFileLimit || wouldExceedSizeLimit)) {
      batches.push([...currentBatch]);
      currentBatch = [];
      currentBatchSize = 0;
    }
    
    // Add file to current batch
    currentBatch.push(file);
    currentBatchSize += fileSizeBytes;
    
    // If a single file exceeds the size limit, put it in its own batch
    if (fileSizeBytes > maxBatchSizeBytes && currentBatch.length === 1) {
      batches.push([...currentBatch]);
      currentBatch = [];
      currentBatchSize = 0;
    }
  }
  
  // Add the last batch if it has files
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }
  
  return batches;
};

describe('Photo Batching Logic', () => {
  it('should create single batch for small files', () => {
    const files = [
      new MockFile('photo1.jpg', 1024 * 1024), // 1MB
      new MockFile('photo2.jpg', 1024 * 1024), // 1MB
      new MockFile('photo3.jpg', 1024 * 1024), // 1MB
    ] as File[];
    
    const batches = createBatches(files);
    
    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(3);
  });

  it('should split files when exceeding size limit', () => {
    const files = [
      new MockFile('photo1.jpg', 5 * 1024 * 1024), // 5MB
      new MockFile('photo2.jpg', 5 * 1024 * 1024), // 5MB
    ] as File[];
    
    const batches = createBatches(files);
    
    expect(batches).toHaveLength(2);
    expect(batches[0]).toHaveLength(1);
    expect(batches[1]).toHaveLength(1);
  });

  it('should split files when exceeding file count limit', () => {
    const files = [
      new MockFile('photo1.jpg', 1024 * 1024), // 1MB each
      new MockFile('photo2.jpg', 1024 * 1024),
      new MockFile('photo3.jpg', 1024 * 1024),
      new MockFile('photo4.jpg', 1024 * 1024),
      new MockFile('photo5.jpg', 1024 * 1024), // 5th file should go to new batch
    ] as File[];
    
    const batches = createBatches(files);
    
    expect(batches).toHaveLength(2);
    expect(batches[0]).toHaveLength(4);
    expect(batches[1]).toHaveLength(1);
  });

  it('should handle very large single file', () => {
    const files = [
      new MockFile('huge-photo.jpg', 12 * 1024 * 1024), // 12MB (exceeds 8MB limit)
    ] as File[];
    
    const batches = createBatches(files);
    
    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(1);
  });

  it('should handle mixed file sizes efficiently', () => {
    const files = [
      new MockFile('small1.jpg', 1 * 1024 * 1024), // 1MB
      new MockFile('small2.jpg', 1 * 1024 * 1024), // 1MB
      new MockFile('large1.jpg', 6 * 1024 * 1024), // 6MB
      new MockFile('small3.jpg', 1 * 1024 * 1024), // 1MB
    ] as File[];
    
    const batches = createBatches(files);
    
    // Should create 2 batches:
    // Batch 1: 3 small files (3MB total, under 8MB limit)
    // Batch 2: 1 large file (6MB)
    expect(batches).toHaveLength(2);
    
    // Files are sorted by size (smallest first)
    const totalBatch1Size = batches[0].reduce((sum, file) => sum + file.size, 0);
    const totalBatch2Size = batches[1].reduce((sum, file) => sum + file.size, 0);
    
    expect(totalBatch1Size).toBeLessThanOrEqual(8 * 1024 * 1024);
    expect(totalBatch2Size).toBeLessThanOrEqual(8 * 1024 * 1024);
  });

  it('should handle empty file array', () => {
    const files: File[] = [];
    const batches = createBatches(files);
    
    expect(batches).toHaveLength(0);
  });
});