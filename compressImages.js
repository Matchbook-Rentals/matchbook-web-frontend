const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

const inputDir = './public/placeholderImages';

async function compressImages() {
  try {
    // Read all files in the input directory
    const files = await fs.readdir(inputDir);

    // Filter for image files (you can add more extensions if needed)
    const imageFiles = files.filter(file => 
      ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(file).toLowerCase())
    );

    // Process each image
    for (const file of imageFiles) {
      const inputPath = path.join(inputDir, file);
      const outputPath = path.join(inputDir, `temp_${file}`);

      await sharp(inputPath)
        .resize({ width: 1000, withoutEnlargement: true })
        .toFile(outputPath);

      // Replace the original file with the compressed version
      await fs.unlink(inputPath);
      await fs.rename(outputPath, inputPath);

      console.log(`Compressed and replaced: ${file}`);
    }

    console.log('All images have been processed successfully.');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

compressImages();
