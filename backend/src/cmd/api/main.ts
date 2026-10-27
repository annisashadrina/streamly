import 'dotenv/config';
import { createApp } from './app.js';
import { RedisRepository } from '../../internal/repository/redis.js';
import { DatabaseRepository } from '../../internal/repository/db.js';
import { UserRepository } from '../../internal/repository/user.js';
import { AuthService } from '../../internal/service/auth.js';
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
    console.log('[BOOTSTRAP] Initializing Streamly services...');

    // 1. Initialize Database & Repositories
    const redisRepo = new RedisRepository();
    const dbRepo = new DatabaseRepository();
    const userRepo = new UserRepository(dbRepo);

    // 2. Initialize Services
    const authService = new AuthService(userRepo);
    const genAI = new GoogleGenerativeAI(config.gemini.apiKey || 'dummy-api-key');
    const analyzer = new GeminiAnalyzer(genAI);

    // 3. Get the singleton instance of the orchestrator
    const orchestrator = AnalysisOrchestrator.getInstance(
        redisRepo,
        analyzer
    );

    // 4. Create the Express App and inject dependencies
    const app = createApp(orchestrator, redisRepo, authService);

    // 5. Start the server
    app.listen(port, () => {
        console.log(`[API] Streamly Server is running on http://localhost:${port}`);
        console.log(`[API] Authentication endpoint ready at POST http://localhost:${port}/api/auth/login`);
    });
}

bootstrap().catch(error => {
    console.error("Failed to bootstrap the application:", error);
    process.exit(1);
});
