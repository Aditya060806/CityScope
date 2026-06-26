import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export function simpleImageOptimizationPlugin(options = {}) {
  const {
    quality = 80,
    maxWidth = 800,
    enabled = process.env.NODE_ENV === 'production'
  } = options;

  return {
    name: 'simple-image-optimization',
    buildStart() {
      if (!enabled) {
        console.log('🖼️  Image optimization disabled in development');
        return;
      }
      
      console.log('🖼️  Image optimization enabled for production build');
    },
    generateBundle: {
      order: 'pre',
      async handler(options, bundle) {
        if (!enabled) return;
        
        const imageFiles = Object.keys(bundle).filter(fileName => {
          const ext = path.extname(fileName).toLowerCase();
          return ['.png', '.jpg', '.jpeg'].includes(ext);
        });

        console.log(`🖼️  Found ${imageFiles.length} images to optimize`);

        for (const fileName of imageFiles) {
          try {
            const file = bundle[fileName];
            if (file.type === 'asset') {
              const inputBuffer = file.source;
              const originalSize = inputBuffer.length;
              
              // Optimize the image
              const optimizedBuffer = await sharp(inputBuffer)
                .resize(maxWidth, null, {
                  withoutEnlargement: true,
                  fit: 'inside'
                })
                .jpeg({ quality })
                .toBuffer();

              const optimizedSize = optimizedBuffer.length;
              const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
              
              file.source = optimizedBuffer;
              
              console.log(`✅ ${fileName}: ${(originalSize / 1024).toFixed(1)}KB → ${(optimizedSize / 1024).toFixed(1)}KB (${savings}% smaller)`);
            }
          } catch (error) {
            console.warn(`⚠️ Failed to optimize ${fileName}:`, error.message);
          }
        }
      }
    }
  };
}
