import Redis from 'ioredis';
import { config } from '../../configs/config.js';
import { StructuredInsight } from '../analyzer/gemini.js';

// Define max lengths for the insight history lists
const INSIGHT_HISTORY_LENGTH = {
    '5m': 10,  // Keep the last 10 5-minute insights (~50 minutes of history)
    '20m': 5, // Keep the last 5 20-minute insights (~100 minutes of history)
    '45m': 3,  // Keep the last 3 45-minute insights (~135 minutes of history)
};

/**
 * Manages all interactions with the Redis server.
 * This class handles two main responsibilities:
 * 1. Acting as a message queue for incoming chat messages per user.
 * 2. Storing a history of analysis insights for hierarchical summarization.
 */
export class RedisRepository {
    private client: Redis;

    constructor() {
        this.client = new Redis(config.redis.url, {
            // Lazy connect to avoid issues in test environments
            lazyConnect: true,
        });
        this.client.connect().catch(err => {
            console.error('[REDIS] Failed to connect:', err);
        });
        console.log('[REDIS] Client initialized.');
    }

    // --- Key Generation ---
    private getMessageQueueKey(username: string): string {
        return `streamly:${username}:messages_queue`;
    }

    private getInsightHistoryKey(username: string, batchType: '5m' | '20m' | '45m'): string {
        return `streamly:${username}:insights:${batchType}`;
    }

    private getRecentMessagesKey(username: string): string {
        return `streamly:${username}:recent_messages`;
    }

    // --- Message Queue Methods ---

    /**
     * Pushes a new message to a user's processing queue and recent live stream list.
     * @param username The user or channel being tracked.
     * @param message The message object from the scraper.
     */
    async pushMessage(username: string, message: any): Promise<void> {
        const queueKey = this.getMessageQueueKey(username);
        const recentKey = this.getRecentMessagesKey(username);
        const payload = JSON.stringify(message);

        const pipeline = this.client.pipeline();
        // 1. Push to batch processing queue
        pipeline.lpush(queueKey, payload);
        pipeline.expire(queueKey, 3 * 60 * 60);

        // 2. Push to recent live messages feed (capped at 50 messages)
        pipeline.lpush(recentKey, payload);
        pipeline.ltrim(recentKey, 0, 49);
        pipeline.expire(recentKey, 3 * 60 * 60);

        await pipeline.exec();
    }

    /**
     * Retrieves the latest N live chat messages without clearing the queue.
     * Used for real-time frontend live feed display.
     */
    async getRecentMessages(username: string, count: number = 30): Promise<any[]> {
        const recentKey = this.getRecentMessagesKey(username);
        let messagesStr = await this.client.lrange(recentKey, 0, count - 1);

        if (!messagesStr || messagesStr.length === 0) {
            const queueKey = this.getMessageQueueKey(username);
            messagesStr = await this.client.lrange(queueKey, 0, count - 1);
        }

        if (!messagesStr || messagesStr.length === 0) {
            return [];
        }

        return messagesStr.map(m => {
            try {
                return JSON.parse(m);
            } catch {
                return null;
            }
        }).filter(Boolean);
    }

    /**
     * Atomically retrieves all messages for a user and clears the queue.
     * Uses RENAME for atomicity to prevent race conditions.
     * @param username The user being tracked.
     * @returns An array of message objects.
     */
    async getAndClearMessageQueue(username: string): Promise<any[]> {
        const key = this.getMessageQueueKey(username);
        const tempKey = `${key}:${Date.now()}`;
        
        try {
            // Atomically rename the key. If the key doesn't exist, this throws an error.
            await this.client.rename(key, tempKey);
        } catch (error) {
            // This is okay, it just means the list was empty.
            return [];
        }
        
        // Get all messages from the temporary key
        const messagesStr = await this.client.lrange(tempKey, 0, -1);

        // Delete the temporary key
        await this.client.del(tempKey);

        if (messagesStr.length === 0) {
            return [];
        }

        // Messages are LIFO, so reverse to get FIFO order.
        return messagesStr.reverse().map(m => JSON.parse(m));
    }


    // --- Insight History Methods ---

    /**
     * Adds a new analysis insight to the beginning of its history list.
     * The list is then trimmed to a maximum size to prevent it from growing indefinitely.
     * @param username The user being tracked.
     * @param batchType The type of analysis ('5m', '20m', '45m').
     * @param insightData The structured JSON data from the analyzer.
     */
    async saveInsight(username: string, batchType: '5m' | '20m' | '45m', insightData: StructuredInsight): Promise<void> {
        const key = this.getInsightHistoryKey(username, batchType);
        const payload = JSON.stringify(insightData);
        const maxLength = INSIGHT_HISTORY_LENGTH[batchType];

        // Use a transaction to push and trim atomically
        const pipeline = this.client.pipeline();
        pipeline.lpush(key, payload);
        pipeline.ltrim(key, 0, maxLength - 1); // Keep the list to the desired size
        await pipeline.exec();
    }

    /**
     * Retrieves the latest N insights for a specific user and batch type.
     * @param username The user being tracked.
     * @param batchType The type of analysis ('5m', '20m', '45m').
     * @param count The number of insights to retrieve.
     * @returns An array of parsed insight objects (from newest to oldest).
     */
    async getLatestInsights(username: string, batchType: '5m' | '20m' | '45m', count: number): Promise<StructuredInsight[]> {
        const key = this.getInsightHistoryKey(username, batchType);
        const results = await this.client.lrange(key, 0, count - 1);
        
        if (!results || results.length === 0) {
            return [];
        }

        return results.map(r => JSON.parse(r));
    }


    async disconnect(): Promise<void> {
        await this.client.quit();
    }
}
