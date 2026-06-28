import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const INPUT_DIR = 'public';
const OUTPUT_DIR = 'public';
const QUALITY = 80; // WebP quality (0-100)
const MAX_WIDTH = 800; // Maximum width for optimization

// Image directories to optimize
const IMAGE_DIRS = [
  'Artisans',
  'Partners', 
  'rewards',
  'icons'
];

// Supported formats
const SUPPORTED_FORMATS = ['.png', '.jpg', '.jpeg'];

async function optimizeImage(inputPath, outputPath) {
  try {
    const stats = await fs.promises.stat(inputPath);
    const originalSize = stats.size;
    
        await sharp(inputPath)
          .resize(MAX_WIDTH, MAX_WIDTH, {
            withoutEnlargement: true,
            fit: 'inside',
            background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
          })
          .webp({ 
            quality: QUALITY,
            effort: 6 // Higher effort for better compression
          })
          .toFile(outputPath);
    
    const optimizedStats = await fs.promises.stat(outputPath);
    const optimizedSize = optimizedStats.size;
    const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
    
    console.log(`✅ ${path.basename(inputPath)}: ${(originalSize / 1024).toFixed(1)}KB → ${(optimizedSize / 1024).toFixed(1)}KB (${savings}% smaller)`);
    
    return { originalSize, optimizedSize, savings: parseFloat(savings) };
  } catch (error) {
    console.error(`❌ Failed to optimize ${inputPath}:`, error.message);
    return null;
  }
}

async function processDirectory(dirPath) {
  const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
  let totalSavings = 0;
  let processedCount = 0;
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item.name);
    
    if (item.isDirectory()) {
      // Recursively process subdirectories
      const subResults = await processDirectory(fullPath);
      totalSavings += subResults.totalSavings;
      processedCount += subResults.processedCount;
    } else if (item.isFile()) {
      const ext = path.extname(item.name).toLowerCase();
      
      if (SUPPORTED_FORMATS.includes(ext)) {
        const outputPath = fullPath.replace(ext, '.webp');
        
        // Only optimize if WebP doesn't already exist or is older
        try {
          const inputStats = await fs.promises.stat(fullPath);
          const outputStats = await fs.promises.stat(outputPath);
          
          if (outputStats.mtime > inputStats.mtime) {
            console.log(`⏭️  Skipping ${item.name} (WebP is newer)`);
            continue;
          }
        } catch {
          // Output file doesn't exist, proceed with optimization
        }
        
        const result = await optimizeImage(fullPath, outputPath);
        if (result) {
          totalSavings += result.savings;
          processedCount++;
        }
      }
    }
  }
  
  return { totalSavings, processedCount };
}

async function main() {
  console.log('🚀 Starting image optimization...\n');
  
  let totalSavings = 0;
  let totalProcessed = 0;
  
  for (const dir of IMAGE_DIRS) {
    const dirPath = path.join(INPUT_DIR, dir);
    
    if (fs.existsSync(dirPath)) {
      console.log(`📁 Processing ${dir}...`);
      const results = await processDirectory(dirPath);
      totalSavings += results.totalSavings;
      totalProcessed += results.processedCount;
      console.log(`   Processed ${results.processedCount} images\n`);
    } else {
      console.log(`⚠️  Directory ${dir} not found, skipping...\n`);
    }
  }
  
  console.log('🎉 Optimization complete!');
  console.log(`📊 Total: ${totalProcessed} images processed`);
  console.log(`💾 Average savings: ${(totalSavings / totalProcessed).toFixed(1)}%`);
}

// Run the optimization
main().catch(console.error);
