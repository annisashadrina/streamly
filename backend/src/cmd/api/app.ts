import express from 'express';
import cors from 'cors';
import { TikTokScraper } from '../../internal/scraper/scraper.js';
import { RedisRepository } from '../../internal/repository/redis.js';
import { AnalysisOrchestrator } from '../../internal/service/orchestrator.js';

// This map tracks running scraper instances to prevent duplicates.
const activeScrapers = new Map<string, TikTokScraper>();

/**
 * Creates and configures the Express application.
 * @param orchestrator The singleton instance of the AnalysisOrchestrator.
 * @param redisRepo The singleton instance of the RedisRepository.
 * @returns The configured Express app.
 */
export const createApp = (orchestrator: AnalysisOrchestrator, redisRepo: RedisRepository) => {
    const app = express();

    app.use(cors());
    app.use(express.json());

    // --- API Endpoints ---

    // This endpoint has been renamed from /scraper/start to /login for clarity as per the API contract.
    app.post('/api/login', async (req, res) => {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ status: 'error', message: 'Username is required' });
        }
        if (activeScrapers.has(username)) {
            return res.json({ status: 'success', message: 'Scraper already running for this user.', username });
        }

        try {
            console.log(`[API] Received login request for @${username}.`);

            // 1. Start the physical scraper to push messages to Redis
            const scraper = new TikTokScraper(username, redisRepo);
            await scraper.start();
            activeScrapers.set(username, scraper);

            // 2. Start the logical analysis orchestrator for this user
            orchestrator.start(username);

            res.status(200).json({ status: 'success', message: 'Scraper and analysis started.', username });

        } catch (error) {
            console.error(`[API] Failed to start scraper for @${username}:`, error);
            res.status(500).json({ status: 'error', message: 'Failed to connect to TikTok Live. The stream may be offline.' });
        }
    });

    app.get('/api/insights', async (req, res) => {
        const { username, type } = req.query as { username?: string, type?: '5m' | '20m' | '45m' };
        
        if (!username) {
            return res.status(400).json({ status: 'error', message: 'Username query parameter is required.' });
        }

        try {
            // Case 1: A specific insight type is requested
            if (type && ['5m', '20m', '45m'].includes(type)) {
                const results = await redisRepo.getLatestInsights(username, type, 1);
                // getLatestInsights returns an array, return the first element or null
                return res.json({ status: 'success', data: results[0] || null });
            }

            // Case 2: All insights are requested
            const [insight5m, insight20m, insight45m] = await Promise.all([
                redisRepo.getLatestInsights(username, '5m', 1),
                redisRepo.getLatestInsights(username, '20m', 1),
                redisRepo.getLatestInsights(username, '45m', 1),
            ]);

            res.json({
                status: 'success',
                data: {
                    // Return the first element of each array, or null if empty
                    '5m': insight5m[0] || null,
                    '20m': insight20m[0] || null,
                    '45m': insight45m[0] || null,
                }
            });
        } catch (error) {
            console.error(`[API] Failed to fetch insights for @${username}:`, error);
            res.status(500).json({ status: 'error', message: 'An internal error occurred while fetching insights.' });
        }
    });

    return app;
};
