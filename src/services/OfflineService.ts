import { Issue, CreateIssueData, UpdateIssueData } from '@/types/civic';

interface OfflineQueueItem {
  id: string;
  type: 'CREATE_ISSUE' | 'UPDATE_ISSUE' | 'DELETE_ISSUE' | 'UPLOAD_IMAGE' | 'SEND_MESSAGE' | 'SUBMIT_ANOMALY' | 'SUBMIT_ANOMALY_BATCH';
  data: unknown;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'high' | 'medium' | 'low';
}

interface OfflineCache {
  issues: Issue[];
  userLocation?: { latitude: number; longitude: number; address: string };
  lastSync: number;
  version: string;
}

class OfflineService {
  private dbName = 'CityScopeOfflineDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private isOnline = navigator.onLine;
  private syncInProgress = false;

  constructor() {
    this.initializeDB();
    this.setupEventListeners();
  }

  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create offline queue store
        if (!db.objectStoreNames.contains('offlineQueue')) {
          const queueStore = db.createObjectStore('offlineQueue', { keyPath: 'id' });
          queueStore.createIndex('timestamp', 'timestamp');
          queueStore.createIndex('priority', 'priority');
          queueStore.createIndex('type', 'type');
        }

        // Create issues cache store
        if (!db.objectStoreNames.contains('issuesCache')) {
          const issuesStore = db.createObjectStore('issuesCache', { keyPath: 'id' });
          issuesStore.createIndex('category', 'category');
          issuesStore.createIndex('status', 'status');
          issuesStore.createIndex('createdAt', 'createdAt');
        }

        // Create user data store
        if (!db.objectStoreNames.contains('userData')) {
          db.createObjectStore('userData', { keyPath: 'key' });
        }

        // Create sync metadata store
        if (!db.objectStoreNames.contains('syncMetadata')) {
          db.createObjectStore('syncMetadata', { keyPath: 'key' });
        }
      };
    });
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Periodic sync when online
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncOfflineData();
      }
    }, 30000); // Sync every 30 seconds
  }

  // Queue operations for offline execution
  async queueOperation(
    type: OfflineQueueItem['type'],
    data: unknown,
    priority: OfflineQueueItem['priority'] = 'medium'
  ): Promise<string> {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const item: OfflineQueueItem = {
      id,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3,
      priority
    };

    await this.addToQueue(item);

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncOfflineData();
    }

    return id;
  }

  private async addToQueue(item: OfflineQueueItem): Promise<void> {
    if (!this.db) await this.initializeDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineQueue'], 'readwrite');
      const store = transaction.objectStore('offlineQueue');
      const request = store.add(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Cache issues for offline viewing
  async cacheIssues(issues: Issue[]): Promise<void> {
    if (!this.db) await this.initializeDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['issuesCache'], 'readwrite');
      const store = transaction.objectStore('issuesCache');
      
      // Clear existing cache
      store.clear();
      
      // Add new issues
      let completed = 0;
      issues.forEach(issue => {
        const request = store.add(issue);
        request.onsuccess = () => {
          completed++;
          if (completed === issues.length) {
            this.updateSyncMetadata('lastIssuesSync', Date.now());
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  // Get cached issues
  async getCachedIssues(): Promise<Issue[]> {
    if (!this.db) await this.initializeDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['issuesCache'], 'readonly');
      const store = transaction.objectStore('issuesCache');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Store user location
  async cacheUserLocation(location: { latitude: number; longitude: number; address: string }): Promise<void> {
    if (!this.db) await this.initializeDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userData'], 'readwrite');
      const store = transaction.objectStore('userData');
      const request = store.put({ key: 'userLocation', value: location, timestamp: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get cached user location
  async getCachedUserLocation(): Promise<{ latitude: number; longitude: number; address: string } | null> {
    if (!this.db) await this.initializeDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userData'], 'readonly');
      const store = transaction.objectStore('userData');
      const request = store.get('userLocation');

      request.onsuccess = () => {
        const result = request.result;
        if (result && Date.now() - result.timestamp < 24 * 60 * 60 * 1000) { // 24 hours
          resolve(result.value);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Sync offline data when connection is restored
  async syncOfflineData(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;

    this.syncInProgress = true;

    try {
      const queueItems = await this.getQueueItems();
      
      for (const item of queueItems) {
        try {
          await this.processQueueItem(item);
          await this.removeFromQueue(item.id);
        } catch (error) {
          console.error(`Failed to process queue item ${item.id}:`, error);
          
          // Increment retry count
          item.retryCount++;
          if (item.retryCount >= item.maxRetries) {
            console.error(`Max retries exceeded for item ${item.id}, removing from queue`);
            await this.removeFromQueue(item.id);
          } else {
            await this.updateQueueItem(item);
          }
        }
      }

      // Sync cached issues
      await this.syncCachedIssues();
      
    } catch (error) {
      console.error('Error during offline sync:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async getQueueItems(): Promise<OfflineQueueItem[]> {
    if (!this.db) await this.initializeDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineQueue'], 'readonly');
      const store = transaction.objectStore('offlineQueue');
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result || [];
        // Sort by priority and timestamp
        items.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          }
          return a.timestamp - b.timestamp;
        });
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async processQueueItem(item: OfflineQueueItem): Promise<void> {
    const { issueService } = await import('@/services/IssueService');
    const { notificationService } = await import('@/services/NotificationService');

    switch (item.type) {
      case 'CREATE_ISSUE':
        await issueService.createIssue(item.data);
        break;
      case 'UPDATE_ISSUE':
        await issueService.updateIssue(item.data.id, item.data.updates);
        break;
      case 'DELETE_ISSUE':
        await issueService.deleteIssue(item.data.id);
        break;
      case 'UPLOAD_IMAGE':
        await issueService.uploadImage(item.data.issueId, item.data.file);
        break;
      case 'SEND_MESSAGE':
        await notificationService.sendNotification(item.data);
        break;
      case 'SUBMIT_ANOMALY': {
        const { roadAnomalyService } = await import('@/services/RoadAnomalyService');
        await roadAnomalyService.submitAnomaly(item.data);
        break;
      }
      case 'SUBMIT_ANOMALY_BATCH': {
        const { roadAnomalyService: svc } = await import('@/services/RoadAnomalyService');
        await svc.submitAnomalyBatch(item.data as unknown[]);
        break;
      }
      default:
        throw new Error(`Unknown queue item type: ${item.type}`);
    }
  }

  private async removeFromQueue(id: string): Promise<void> {
    if (!this.db) await this.initializeDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineQueue'], 'readwrite');
      const store = transaction.objectStore('offlineQueue');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async updateQueueItem(item: OfflineQueueItem): Promise<void> {
    if (!this.db) await this.initializeDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineQueue'], 'readwrite');
      const store = transaction.objectStore('offlineQueue');
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async syncCachedIssues(): Promise<void> {
    try {
      const { issueService } = await import('@/services/IssueService');
      const issues = await issueService.getIssues({ limit: 100 });
      await this.cacheIssues(issues.issues);
    } catch (error) {
      console.error('Error syncing cached issues:', error);
    }
  }

  private async updateSyncMetadata(key: string, value: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    if (!this.db) await this.initializeDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncMetadata'], 'readwrite');
      const store = transaction.objectStore('syncMetadata');
      const request = store.put({ key, value, timestamp: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    isOnline: boolean;
    queueSize: number;
    lastSync: number;
    pendingOperations: string[];
  }> {
    const queueItems = await this.getQueueItems();
    const lastSync = await this.getLastSyncTime();

    return {
      isOnline: this.isOnline,
      queueSize: queueItems.length,
      lastSync,
      pendingOperations: queueItems.map(item => item.type)
    };
  }

  private async getLastSyncTime(): Promise<number> {
    if (!this.db) await this.initializeDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncMetadata'], 'readonly');
      const store = transaction.objectStore('syncMetadata');
      const request = store.get('lastIssuesSync');

      request.onsuccess = () => {
        resolve(request.result?.value || 0);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all offline data
  async clearOfflineData(): Promise<void> {
    if (!this.db) await this.initializeDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ['offlineQueue', 'issuesCache', 'userData', 'syncMetadata'],
        'readwrite'
      );

      let completed = 0;
      const stores = ['offlineQueue', 'issuesCache', 'userData', 'syncMetadata'];

      stores.forEach(storeName => {
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        
        request.onsuccess = () => {
          completed++;
          if (completed === stores.length) {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    });
  }
}

export const offlineService = new OfflineService();
