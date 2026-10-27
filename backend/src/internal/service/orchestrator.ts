import { RedisRepository } from '../repository/redis.js';
import { GeminiAnalyzer, AnalysisResult, StructuredInsight } from '../analyzer/gemini.js';

type BatchType = '5m' | '20m' | '45m';

interface ActiveUser {
    username: string;
    timers: NodeJS.Timeout[];
}

const BATCH_INTERVALS: Record<BatchType, number> = {
    '5m': 5 * 60 * 1000,
    '20m': 20 * 60 * 1000,
    '45m': 45 * 60 * 1000,
};

/**
 * The central brain of the analysis system.
 * This service manages analysis schedules for multiple users, retrieves data
 * and historical insights from Redis, invokes the Gemini analyzer using a
 * hierarchical summarization strategy, and stores the results.
 * It is designed as a singleton to be instantiated once.
 */
export class AnalysisOrchestrator {
    private static instance: AnalysisOrchestrator;
    private redisRepo: RedisRepository;
    private analyzer: GeminiAnalyzer;
    private activeUsers = new Map<string, ActiveUser>();

    private constructor(
        redisRepo: RedisRepository,
        analyzer: GeminiAnalyzer
    ) {
        this.redisRepo = redisRepo;
        this.analyzer = analyzer;
        console.log('[ORCHESTRATOR] Service initialized.');
    }

    public static getInstance(
        redisRepo: RedisRepository,
        analyzer: GeminiAnalyzer
    ): AnalysisOrchestrator {
        if (!AnalysisOrchestrator.instance) {
            AnalysisOrchestrator.instance = new AnalysisOrchestrator(redisRepo, analyzer);
        }
        return AnalysisOrchestrator.instance;
    }

    /**
     * Starts the analysis process for a given username.
     * If already running, it does nothing.
     * @param username The TikTok username to start analyzing.
     */
    public start(username: string) {
        if (this.activeUsers.has(username)) {
            console.log(`[ORCHESTRATOR] Analysis for @${username} is already running.`);
            return;
        }

        console.log(`[ORCHESTRATOR] Starting analysis timers for @${username}...`);
        const timers = Object.entries(BATCH_INTERVALS).map(([batchType, interval]) => {
            return setInterval(() => {
                this.processBatch(username, batchType as BatchType);
            }, interval);
        });

        this.activeUsers.set(username, { username, timers });
    }

    /**
     * Stops the analysis process for a given username.
     * @param username The TikTok username to stop analyzing.
     */
    public stop(username: string) {
        const userData = this.activeUsers.get(username);
        if (userData) {
            console.log(`[ORCHESTRATOR] Stopping analysis timers for @${username}...`);
            userData.timers.forEach(clearInterval);
            this.activeUsers.delete(username);
        }
    }

    /**
     * Manually triggers immediate analysis of current messages for @username
     * without waiting for the 5-minute interval timer.
     */
    public async triggerImmediateAnalysis(username: string): Promise<StructuredInsight | null> {
        console.log(`[ORCHESTRATOR] Manual trigger: Processing immediate 5m batch for @${username}...`);
        let messages = await this.redisRepo.getAndClearMessageQueue(username);
        if (messages.length === 0) {
            // Check recent live messages if queue was already cleared
            messages = await this.redisRepo.getRecentMessages(username, 30);
        }

        if (messages.length === 0) {
            console.log(`[ORCHESTRATOR] No messages available to trigger analysis for @${username}.`);
            const existing = await this.redisRepo.getLatestInsights(username, '5m', 1);
            return existing[0] || null;
        }

        const analysisResult = await this.analyzer.analyze(username, '5m', { messages });
        if (analysisResult && analysisResult.insight) {
            await this.redisRepo.saveInsight(username, '5m', analysisResult.insight);
            console.log(`[ORCHESTRATOR] Manual trigger successfully saved insight for @${username}.`);
            return analysisResult.insight;
        }
        return null;
    }

    /**
     * The core processing logic for a single analysis batch.
     * It routes to the correct handler based on batch type.
     */
    private async processBatch(username: string, batchType: BatchType) {
        console.log(`
[ORCHESTRATOR] Processing '${batchType}' batch for @${username}...`);
        
        try {
            let analysisResult: AnalysisResult | null = null;

            if (batchType === '5m') {
                analysisResult = await this.handleFiveMinuteBatch(username);
            } else if (batchType === '20m') {
                analysisResult = await this.handleTwentyMinuteBatch(username);
            } else if (batchType === '45m') {
                analysisResult = await this.handleFortyFiveMinuteBatch(username);
            }

            if (!analysisResult) {
                console.log(`[ORCHESTRATOR] Analysis for @${username} (${batchType}) skipped or returned no result.`);
                return;
            }

            // Persist the new insight to Redis history
            await this.redisRepo.saveInsight(username, batchType, analysisResult.insight);

            console.log(`[ORCHESTRATOR] Successfully processed and stored '${batchType}' insight for @${username}.`);

        } catch (error) {
            console.error(`[ORCHESTRATOR] Error processing '${batchType}' batch for @${username}:`, error);
        }
    }

    /**
     * Handles the 5-minute batch: analyzes raw messages.
     */
    private async handleFiveMinuteBatch(username: string): Promise<AnalysisResult | null> {
        const messages = await this.redisRepo.getAndClearMessageQueue(username);
        if (messages.length === 0) {
            console.log(`[ORCHESTRATOR] No new messages for @${username} in this 5m batch.`);
            return null;
        }
        return this.analyzer.analyze(username, '5m', { messages });
    }

    /**
     * Handles the 20-minute batch: synthesizes the last four 5-minute insights.
     */
    private async handleTwentyMinuteBatch(username: string): Promise<AnalysisResult | null> {
        const insights = await this.redisRepo.getLatestInsights(username, '5m', 4);
        if (insights.length < 4) {
            console.log(`[ORCHESTRATOR] Not enough 5m insights for @${username} to create 20m batch (found ${insights.length}, need 4).`);
            return null;
        }
        // Insights are newest to oldest, reverse them for the LLM
        const orderedInsights = insights.reverse();
        return this.analyzer.analyze(username, '20m', { insights: orderedInsights });
    }

    /**
     * Handles the 45-minute batch: synthesizes the last two 20-minute and one 5-minute insights.
     */
    private async handleFortyFiveMinuteBatch(username: string): Promise<AnalysisResult | null> {
        const twentyMinuteInsights = await this.redisRepo.getLatestInsights(username, '20m', 2);
        const fiveMinuteInsight = await this.redisRepo.getLatestInsights(username, '5m', 1);

        if (twentyMinuteInsights.length < 2 || fiveMinuteInsight.length < 1) {
            console.log(`[ORCHESTRATOR] Not enough insights for @${username} to create 45m batch (found ${twentyMinuteInsights.length}x20m, ${fiveMinuteInsight.length}x5m).`);
            return null;
        }
        
        // Insights are newest to oldest, reverse them for the LLM
        const ordered20m = twentyMinuteInsights.reverse();

        return this.analyzer.analyze(username, '45m', {
            twentyMinuteInsights: ordered20m,
            fiveMinuteInsight: fiveMinuteInsight[0]
        });
    }
}
