import { TikTokLiveConnection, WebcastEvent } from 'tiktok-live-connector';
import { RedisRepository } from '../repository/redis.js';
import { config } from '../../configs/config.js';

/**
 * Connects to a TikTok Live stream and pushes chat messages into a user-specific
 * Redis queue.
 */
export class TikTokScraper {
    private connection: TikTokLiveConnection;
    private redisRepo: RedisRepository;
    private targetUsername: string;

    constructor(
        targetUsername: string,
        redisRepo: RedisRepository,
    ) {
        this.targetUsername = targetUsername;
        this.redisRepo = redisRepo;

        this.connection = new TikTokLiveConnection(this.targetUsername, {
            signServerOptions: config.tiktok.signApiKey ? {
                apiKey: config.tiktok.signApiKey
            } : undefined,
            // Add other relevant options if needed
            disableEulerFallbacks: true,
        });

        this.setupEventListeners();
    }

    private setupEventListeners() {
        this.connection.on(WebcastEvent.CHAT, async (data: any) => {
            const chatLog = {
                timestamp: new Date().toISOString(),
                user: data.user?.displayId || data.user?.uniqueId || data.user?.nickname || 'anonymous',
                message: data.content || data.comment || ''
            };

            console.log(`[SCRAPER][${this.targetUsername}] ${chatLog.user}: ${chatLog.message}`);
            
            try {
                // Push to the queue for the specific user we are tracking
                await this.redisRepo.pushMessage(this.targetUsername, chatLog);
            } catch (err) {
                console.error(`[SCRAPER][${this.targetUsername}] Redis Push Error:`, err);
            }
        });

        this.connection.on(WebcastEvent.STREAM_END, () => {
            console.info(`[SCRAPER][${this.targetUsername}] Stream ended by host.`);
            // The orchestrator will handle the cleanup.
        });

        this.connection.on('disconnect', () => {
            console.info(`[SCRAPER][${this.targetUsername}] Disconnected from TikTok Live.`);
        });
    }

    public async start() {
        try {
            const state = await this.connection.connect();
            console.info(`[SCRAPER][${this.targetUsername}] Connected to roomId ${state.roomId}.`);
        } catch (err) {
            console.error(`[SCRAPER][${this.targetUsername}] Failed to connect to TikTok:`, err);
            throw err;
        }
    }

    public stop() {
        // Just disconnect from TikTok. Redis connection is managed centrally.
        this.connection.disconnect();
        console.log(`[SCRAPER][${this.targetUsername}] Disconnect signal sent.`);
    }
}
