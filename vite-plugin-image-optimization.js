import { createFilter } from '@rollup/pluginutils';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

export function imageOptimizationPlugin(options = {}) {
  const {
    include = ['**/*.png', '**/*.jpg', '**/*.jpeg'],
    exclude = ['node_modules/**'],
    quality = 80,
    maxWidth = 800,
    outputDir = 'dist'
  } = options;

  const filter = createFilter(include, exclude);
  const processedImages = new Set();

  return {
    name: 'image-optimization',
    generateBundle: {
      order: 'pre',
      async handler(options, bundle) {
        const imageFiles = Object.keys(bundle).filter(fileName => {
          const ext = path.extname(fileName).toLowerCase();
          return ['.png', '.jpg', '.jpeg'].includes(ext) && filter(fileName);
        });

        for (const fileName of imageFiles) {
          if (processedImages.has(fileName)) continue;
          
          try {
            const file = bundle[fileName];
            if (file.type === 'asset') {
              const inputBuffer = file.source;
              const ext = path.extname(fileName).toLowerCase();
              const nameWithoutExt = path.basename(fileName, ext);
              
              // Generate WebP version
              const webpFileName = `${nameWithoutExt}.webp`;
              const webpBuffer = await sharp(inputBuffer)
                .resize(maxWidth, null, {
                  withoutEnlargement: true,
                  fit: 'inside'
                })
                .webp({ quality })
                .toBuffer();

              // Add WebP version to bundle
              bundle[webpFileName] = {
                type: 'asset',
                source: webpBuffer,
                fileName: webpFileName
              };

              // Optimize original
              const optimizedBuffer = await sharp(inputBuffer)
                .resize(maxWidth, null, {
                  withoutEnlargement: true,
                  fit: 'inside'
                })
                .jpeg({ quality })
                .toBuffer();

              file.source = optimizedBuffer;
              processedImages.add(fileName);
              
              console.log(`✅ Optimized ${fileName} (${(inputBuffer.length / 1024).toFixed(1)}KB → ${(optimizedBuffer.length / 1024).toFixed(1)}KB)`);
            }
          } catch (error) {
            console.warn(`⚠️ Failed to optimize ${fileName}:`, error.message);
          }
        }
      }
    }
  };
}
