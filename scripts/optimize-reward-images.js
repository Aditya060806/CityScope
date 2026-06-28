import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration for reward images
const REWARDS_DIR = path.join(__dirname, '..', 'public', 'rewards');
const QUALITY = 85; // Higher quality for reward images
const MAX_SIZE = 400; // Square size for reward images

async function optimizeRewardImage(inputPath, outputPath) {
  try {
    const stats = await fs.promises.stat(inputPath);
    const originalSize = stats.size;
    
    await sharp(inputPath)
      .resize(MAX_SIZE, MAX_SIZE, {
        withoutEnlargement: true,
        fit: 'inside',
        background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
      })
      .webp({ 
        quality: QUALITY,
        effort: 6
      })
      .toFile(outputPath);
    
    const optimizedStats = await fs.promises.stat(outputPath);
    const optimizedSize = optimizedStats.size;
    const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
    
    console.log(`✅ ${path.basename(inputPath)}: ${(originalSize / 1024).toFixed(1)}KB → ${(optimizedSize / 1024).toFixed(1)}KB (${savings}% smaller)`);
    return { originalSize, optimizedSize };
  } catch (error) {
    console.error(`❌ Failed to optimize ${path.basename(inputPath)}:`, error);
    return { originalSize: 0, optimizedSize: 0 };
  }
}

async function processRewardImages() {
  console.log('\n🎁 Processing reward images...');
  let processedCount = 0;
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;

  try {
    const files = await fs.promises.readdir(REWARDS_DIR);
    
    for (const file of files) {
      const inputPath = path.join(REWARDS_DIR, file);
      const fileExtension = path.extname(file).toLowerCase();

      if (['.png', '.jpg', '.jpeg'].includes(fileExtension)) {
        const outputFileName = `${path.basename(file, fileExtension)}.webp`;
        const outputPath = path.join(REWARDS_DIR, outputFileName);

        // Check if WebP version already exists and is newer
        let skip = false;
        try {
          const inputStat = await fs.promises.stat(inputPath);
          const outputStat = await fs.promises.stat(outputPath);
          if (outputStat.mtimeMs > inputStat.mtimeMs) {
            console.log(`⏭️  Skipping ${file} (WebP is newer)`);
            skip = true;
          }
        } catch (e) {
          // WebP file doesn't exist, proceed with optimization
        }

        if (!skip) {
          const { originalSize, optimizedSize } = await optimizeRewardImage(inputPath, outputPath);
          totalOriginalSize += originalSize;
          totalOptimizedSize += optimizedSize;
          processedCount++;
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error processing rewards directory:`, error);
  }

  const savings = totalOriginalSize > 0 
    ? ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1)
    : 'NaN';

  console.log(`\n🎁 Reward images optimization complete!`);
  console.log(`📊 Processed: ${processedCount} images`);
  console.log(`💾 Average savings: ${savings}%`);
}

processRewardImages();
