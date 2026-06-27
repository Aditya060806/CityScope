import { apiService } from './ComprehensiveAPIService';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  networkLatency: number;
  cacheHitRate: number;
  errorRate: number;
}

interface OptimizationConfig {
  enableLazyLoading: boolean;
  enableImageOptimization: boolean;
  enableCodeSplitting: boolean;
  enableServiceWorker: boolean;
  enableCompression: boolean;
  enableCaching: boolean;
  maxCacheSize: number;
  cacheExpiryTime: number;
}

class PerformanceOptimizationService {
  private metrics: PerformanceMetrics = {
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    networkLatency: 0,
    cacheHitRate: 0,
    errorRate: 0
  };

  private config: OptimizationConfig = {
    enableLazyLoading: true,
    enableImageOptimization: true,
    enableCodeSplitting: true,
    enableServiceWorker: true,
    enableCompression: true,
    enableCaching: true,
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    cacheExpiryTime: 24 * 60 * 60 * 1000 // 24 hours
  };

  private cache = new Map<string, { data: unknown; timestamp: number; expiry: number }>();
  private imageCache = new Map<string, string>();

  // Initialize performance monitoring
  async initialize(): Promise<void> {
    console.log('🚀 Initializing Performance Optimization Service...');

    // Start performance monitoring
    this.startPerformanceMonitoring();

    // Initialize caching strategies
    if (this.config.enableCaching) {
      await this.initializeCaching();
    }

    // Initialize image optimization
    if (this.config.enableImageOptimization) {
      this.initializeImageOptimization();
    }

    // Initialize lazy loading
    if (this.config.enableLazyLoading) {
      this.initializeLazyLoading();
    }

    console.log('✅ Performance Optimization Service initialized');
  }

  // Performance Monitoring
  private startPerformanceMonitoring(): void {
    // Monitor page load time
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      this.metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart;
      
      // Track render time
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcp) {
        this.metrics.renderTime = fcp.startTime;
      }

      // Track memory usage
      if ('memory' in performance) {
        const memory = (performance as Record<string, unknown>).memory as { usedJSHeapSize: number; totalJSHeapSize: number };
        this.metrics.memoryUsage = memory.usedJSHeapSize / memory.totalJSHeapSize;
      }

      // Log performance metrics
      this.logPerformanceMetrics();
    });

    // Monitor network performance
    this.monitorNetworkPerformance();

    // Monitor error rates
    this.monitorErrorRates();
  }

  private monitorNetworkPerformance(): void {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          this.metrics.networkLatency = resourceEntry.responseEnd - resourceEntry.requestStart;
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  private monitorErrorRates(): void {
    let errorCount = 0;
    let totalRequests = 0;

    // Monitor fetch errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      totalRequests++;
      try {
        const response = await originalFetch(...args);
        if (!response.ok) {
          errorCount++;
        }
        return response;
      } catch (error) {
        errorCount++;
        throw error;
      }
    };

    // Calculate error rate periodically
    setInterval(() => {
      this.metrics.errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
    }, 30000); // Every 30 seconds
  }

  // Caching System
  private async initializeCaching(): Promise<void> {
    // Initialize IndexedDB for persistent caching
    if ('indexedDB' in window) {
      await this.initializeIndexedDB();
    }

    // Initialize memory cache cleanup
    setInterval(() => {
      this.cleanupCache();
    }, 60000); // Every minute
  }

  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CityScopeCache', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('apiCache')) {
          db.createObjectStore('apiCache', { keyPath: 'key' });
        }
        
        if (!db.objectStoreNames.contains('imageCache')) {
          db.createObjectStore('imageCache', { keyPath: 'url' });
        }
      };
    });
  }

  // Cache Management
  async getFromCache<T>(key: string): Promise<T | null> {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() < cached.expiry) {
      this.metrics.cacheHitRate = (this.metrics.cacheHitRate + 1) / 2; // Simple moving average
      return cached.data;
    }

    if (cached) {
      this.cache.delete(key); // Remove expired cache
    }

    return null;
  }

  async setCache<T>(key: string, data: T, ttl?: number): Promise<void> {
    const expiry = Date.now() + (ttl || this.config.cacheExpiryTime);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry
    });

    // Check cache size limit
    if (this.cache.size > 1000) { // Limit number of cache entries
      this.cleanupCache();
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Image Optimization
  private initializeImageOptimization(): void {
    // Lazy load images
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadOptimizedImage(img);
            imageObserver.unobserve(img);
          }
        });
      });

      // Observe all images with data-src attribute
      document.addEventListener('DOMContentLoaded', () => {
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach((img) => imageObserver.observe(img));
      });
    }
  }

  private async loadOptimizedImage(img: HTMLImageElement): Promise<void> {
    const src = img.dataset.src;
    if (!src) return;

    // Check if image is already cached
    if (this.imageCache.has(src)) {
      img.src = this.imageCache.get(src)!;
      return;
    }

    try {
      // Create optimized image URL (in production, use image optimization service)
      const optimizedSrc = this.getOptimizedImageUrl(src);
      
      // Preload image
      const imageLoader = new Image();
      imageLoader.onload = () => {
        img.src = optimizedSrc;
        this.imageCache.set(src, optimizedSrc);
      };
      imageLoader.src = optimizedSrc;
    } catch (error) {
      console.warn('Image optimization failed:', error);
      img.src = src; // Fallback to original
    }
  }

  private getOptimizedImageUrl(originalUrl: string): string {
    // In production, integrate with image optimization service
    // For now, return original URL
    return originalUrl;
  }

  // Lazy Loading
  private initializeLazyLoading(): void {
    if ('IntersectionObserver' in window) {
      const lazyObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            this.loadLazyContent(element);
            lazyObserver.unobserve(element);
          }
        });
      });

      // Observe lazy-loaded components
      document.addEventListener('DOMContentLoaded', () => {
        const lazyElements = document.querySelectorAll('[data-lazy]');
        lazyElements.forEach((element) => lazyObserver.observe(element));
      });
    }
  }

  private async loadLazyContent(element: HTMLElement): Promise<void> {
    const lazyType = element.dataset.lazy;
    
    switch (lazyType) {
      case 'component':
        await this.loadLazyComponent(element);
        break;
      case 'data':
        await this.loadLazyData(element);
        break;
      default:
        console.warn('Unknown lazy loading type:', lazyType);
    }
  }

  private async loadLazyComponent(element: HTMLElement): Promise<void> {
    const componentName = element.dataset.component;
    if (!componentName) return;

    try {
      // Dynamic import for code splitting - using vite-ignore comment to suppress warning
      const module = await import(/* @vite-ignore */ `@/components/${componentName}`);
      const Component = module.default || module[componentName];
      
      // Render component
      if (typeof Component === 'function') {
        // This would need to be integrated with your React rendering system
        console.log('Loading lazy component:', componentName);
      }
    } catch (error) {
      console.error('Failed to load lazy component:', error);
    }
  }

  private async loadLazyData(element: HTMLElement): Promise<void> {
    const dataSource = element.dataset.dataSource;
    if (!dataSource) return;

    try {
      // Load data from cache or API
      const cacheKey = `lazy_data_${dataSource}`;
      let data = await this.getFromCache(cacheKey);
      
      if (!data) {
        // Fetch from API
        data = await this.fetchData(dataSource);
        await this.setCache(cacheKey, data);
      }

      // Update element with data
      element.textContent = JSON.stringify(data);
    } catch (error) {
      console.error('Failed to load lazy data:', error);
    }
  }

  private async fetchData(source: string): Promise<unknown> {
    // Implement data fetching logic
    const response = await fetch(source);
    return response.json();
  }

  // Performance Analytics
  private logPerformanceMetrics(): void {
    console.log('📊 Performance Metrics:', {
      loadTime: `${this.metrics.loadTime.toFixed(2)}ms`,
      renderTime: `${this.metrics.renderTime.toFixed(2)}ms`,
      memoryUsage: `${(this.metrics.memoryUsage * 100).toFixed(1)}%`,
      networkLatency: `${this.metrics.networkLatency.toFixed(2)}ms`,
      cacheHitRate: `${(this.metrics.cacheHitRate * 100).toFixed(1)}%`,
      errorRate: `${this.metrics.errorRate.toFixed(2)}%`
    });

    // Send metrics to analytics service
    apiService.trackEvent('performance_metrics', this.metrics);
  }

  // Public API
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getConfig(): OptimizationConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Preload critical resources
  async preloadCriticalResources(): Promise<void> {
    const criticalResources = [
      '/manifest.json',
      '/sw.js',
      // Add other critical resources
    ];

    for (const resource of criticalResources) {
      try {
        await fetch(resource, { method: 'HEAD' });
      } catch (error) {
        console.warn('Failed to preload resource:', resource);
      }
    }
  }

  // Optimize bundle size
  async optimizeBundle(): Promise<void> {
    // In production, this would integrate with build tools
    // For now, just log optimization suggestions
    console.log('📦 Bundle Optimization Suggestions:');
    console.log('- Enable tree shaking');
    console.log('- Use dynamic imports for large components');
    console.log('- Optimize images and assets');
    console.log('- Enable compression');
  }
}

// Export singleton instance
export const performanceService = new PerformanceOptimizationService();
export default performanceService;
