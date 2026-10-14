import { TikTokScraper } from '../internal/scraper/scraper.js';
import { RedisRepository } from '../internal/repository/redis.js';
import { DatabaseRepository } from '../internal/repository/db.js';
import { GeminiAnalyzer } from '../internal/analyzer/gemini.js';
import { AnalysisOrchestrator } from '../internal/service/orchestrator.js';

async function main() {
    const username = process.argv[2];
    if (!username) {
        console.error('Usage: npm start <tiktok-username>');
        process.exit(1);
    }

    console.log(`--- Starting Streamly for @${username} ---`);

    // Initialize dependencies
    const redisRepo = new RedisRepository();
    const dbRepo = new DatabaseRepository();
    const analyzer = new GeminiAnalyzer();

    // Initialize services
    const scraper = new TikTokScraper(username, redisRepo, dbRepo);
    const orchestrator = new AnalysisOrchestrator(redisRepo, dbRepo, analyzer);

    // Handle graceful shutdown
    const shutdown = async () => {
        console.log('\nShutting down...');
        orchestrator.stop();
        await scraper.stop();
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // Start everything
    try {
        await scraper.start();
        orchestrator.start();
        console.log('Streamly is running. Press Ctrl+C to stop.');
    } catch (err) {
        console.error('Critical Error on Startup:', err);
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Unhandled Exception:', err);
    process.exit(1);
});
