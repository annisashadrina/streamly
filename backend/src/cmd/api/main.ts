import 'dotenv/config';
import { createApp } from './app.js';
import { RedisRepository } from '../../internal/repository/redis.js';
import { QdrantRepository } from '../../internal/repository/qdrant.js';
import { GeminiAnalyzer } from '../../internal/analyzer/gemini.js';
import { AnalysisOrchestrator } from '../../internal/service/orchestrator.js';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../configs/config.js';

const port = process.env.PORT || 3000;

/**
 * The composition root of the application.
 * All major services and repositories are instantiated here as singletons
 * and passed down to the web application layer.
 */
async function bootstrap() {
    // 1. Initialize API clients and Repositories
    const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    const redisRepo = new RedisRepository();
    const analyzer = new GeminiAnalyzer(genAI); // Dependency is now injected

    // 3. Get the singleton instance of the orchestrator
    const orchestrator = AnalysisOrchestrator.getInstance(
        redisRepo,
        analyzer
    );

    // 4. Create the Express App and inject dependencies
    const app = createApp(orchestrator, redisRepo);

    // 5. Start the server
    app.listen(port, () => {
        console.log(`[API] Server is running on http://localhost:${port}`);
    });
}

bootstrap().catch(error => {
    console.error("Failed to bootstrap the application:", error);
    process.exit(1);
});
