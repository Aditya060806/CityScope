import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration for partner and maker images
const PARTNERS_DIR = path.join(__dirname, '..', 'public', 'Partners');
const ARTISANS_DIR = path.join(__dirname, '..', 'public', 'Artisans');
const QUALITY = 90; // Higher quality for company logos
const MAX_SIZE = 600; // Larger size for better visibility

const imageDirs = [
  PARTNERS_DIR,
  path.join(ARTISANS_DIR, 'Indian-Traditional-Makers-Artisans'),
  path.join(ARTISANS_DIR, 'Recycled-Product-Innovators'),
  path.join(ARTISANS_DIR, 'Sustainable-Artisan-Marketplaces')
];

async function optimizePartnerImage(inputPath, outputPath) {
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

async function processDirectory(dir) {
  console.log(`\n📁 Processing ${path.basename(dir)}...`);
  let processedCount = 0;
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;

  try {
    const files = await fs.promises.readdir(dir);
    
    for (const file of files) {
      const inputPath = path.join(dir, file);
      const fileExtension = path.extname(file).toLowerCase();

      if (['.png', '.jpg', '.jpeg'].includes(fileExtension)) {
        const outputFileName = `${path.basename(file, fileExtension)}.webp`;
        const outputPath = path.join(dir, outputFileName);

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
          const { originalSize, optimizedSize } = await optimizePartnerImage(inputPath, outputPath);
          totalOriginalSize += originalSize;
          totalOptimizedSize += optimizedSize;
          processedCount++;
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error processing directory ${dir}:`, error);
  }

  console.log(`   Processed ${processedCount} images`);
  return { processedCount, totalOriginalSize, totalOptimizedSize };
}

async function runOptimization() {
  console.log('🚀 Starting partner and maker image optimization...');
  let totalProcessed = 0;
  let grandTotalOriginalSize = 0;
  let grandTotalOptimizedSize = 0;

  for (const dir of imageDirs) {
    const { processedCount, totalOriginalSize, totalOptimizedSize } = await processDirectory(dir);
    totalProcessed += processedCount;
    grandTotalOriginalSize += totalOriginalSize;
    grandTotalOptimizedSize += totalOptimizedSize;
  }

  const overallSavings = grandTotalOriginalSize > 0 
    ? ((grandTotalOriginalSize - grandTotalOptimizedSize) / grandTotalOriginalSize * 100).toFixed(1)
    : 'NaN';

  console.log('\n🎉 Partner and maker image optimization complete!');
  console.log(`📊 Total: ${totalProcessed} images processed`);
  console.log(`💾 Average savings: ${overallSavings}%`);
}

runOptimization();
