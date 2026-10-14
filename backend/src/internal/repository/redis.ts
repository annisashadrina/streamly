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

    // --- Message Queue Methods ---

    /**
     * Pushes a new message to a user's processing queue.
     * @param username The user being tracked.
     * @param message The message object from the scraper.
     */
    async pushMessage(username: string, message: any): Promise<void> {
        const key = this.getMessageQueueKey(username);
        const payload = JSON.stringify(message);
        await this.client.lpush(key, payload);
        // Set a TTL on the queue itself to auto-clean if a scraper runs rampant
        // and the consumer is down. 3 hours.
        await this.client.expire(key, 3 * 60 * 60);
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
