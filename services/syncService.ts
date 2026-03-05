
import { communityService } from './communityService';

interface QueuedAction {
    id: string;
    action: 'like' | 'vote' | 'comment' | 'report';
    payload: any;
    timestamp: number;
}

class SyncService {
    private queue: QueuedAction[] = [];
    private isSyncing = false;

    constructor() {
        this.loadQueue();
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this.sync());
        }
    }

    private loadQueue() {
        if (typeof window === 'undefined') return;
        const saved = localStorage.getItem('mira_sync_queue');
        if (saved) {
            try {
                this.queue = JSON.parse(saved);
            } catch (e) {
                this.queue = [];
            }
        }
    }

    private saveQueue() {
        if (typeof window === 'undefined') return;
        localStorage.setItem('mira_sync_queue', JSON.stringify(this.queue));
    }

    async enqueue(action: 'like' | 'vote' | 'comment' | 'report', payload: any) {
        const item: QueuedAction = {
            id: Math.random().toString(36).substring(2, 11),
            action,
            payload,
            timestamp: Date.now()
        };

        this.queue.push(item);
        this.saveQueue();

        if (navigator.onLine) {
            this.sync();
        }
    }

    async sync() {
        if (this.isSyncing || this.queue.length === 0 || !navigator.onLine) return;
        this.isSyncing = true;

        console.log(`[SyncService] Sincronizando ${this.queue.length} ações pendentes...`);

        const remainingQueue: QueuedAction[] = [];

        for (const item of this.queue) {
            try {
                switch (item.action) {
                    case 'like':
                        await communityService.voteOrLike(item.payload.postId, item.payload.userId, 'like');
                        break;
                    case 'vote':
                        await communityService.voteOrLike(item.payload.postId, item.payload.userId, item.payload.voteType);
                        break;
                    case 'comment':
                        await communityService.createComment(item.payload.postId, item.payload.userId, item.payload.content);
                        break;
                }
            } catch (err) {
                console.error(`[SyncService] Erro ao sincronizar ${item.id}:`, err);
                remainingQueue.push(item);
            }
        }

        this.queue = remainingQueue;
        this.saveQueue();
        this.isSyncing = false;

        if (this.queue.length > 0 && navigator.onLine) {
            setTimeout(() => this.sync(), 30000);
        }
    }
}

export const syncService = new SyncService();
