import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnalysisOrchestrator } from './orchestrator.js';
import { RedisRepository } from '../repository/redis.js';
import { QdrantRepository } from '../repository/qdrant.js';
import { GeminiAnalyzer } from '../analyzer/gemini.js';

// Mock the full repositories and analyzer
vi.mock('../repository/redis.js');
vi.mock('../repository/qdrant.js');
vi.mock('../analyzer/gemini.js');

describe('AnalysisOrchestrator (v2 Architecture)', () => {
    let orchestrator: AnalysisOrchestrator;
    let mockRedisRepo: RedisRepository;
    let mockQdrantRepo: QdrantRepository;
    let mockAnalyzer: GeminiAnalyzer;

    const username = 'testuser';
    const mockMessages = [{ user: 'user1', message: 'Hello world' }];
    const mockAnalysisResult = {
        insight: { id: 'uuid-123', summary: 'Test summary' },
        vector: [0.1, 0.2, 0.3],
    };

    beforeEach(() => {
        // Instantiate the mocked classes
        mockRedisRepo = new RedisRepository();
        mockQdrantRepo = new QdrantRepository();
        mockAnalyzer = new GeminiAnalyzer();

        // Provide mock implementations for all used methods
        vi.spyOn(mockRedisRepo, 'getAndClearMessageQueue').mockResolvedValue(mockMessages);
        vi.spyOn(mockRedisRepo, 'saveInsight').mockResolvedValue();
        vi.spyOn(mockQdrantRepo, 'searchSimilarInsights').mockResolvedValue([]);
        vi.spyOn(mockQdrantRepo, 'addInsight').mockResolvedValue();
        
        // Mock the main analyze function and the internal embedding model for context search
        vi.spyOn(mockAnalyzer, 'analyze').mockResolvedValue(mockAnalysisResult as any);
        (mockAnalyzer as any).embeddingModel = {
            embedContent: vi.fn().mockResolvedValue({ embedding: { values: [0.5, 0.5] } })
        };
        
        // Get a fresh instance for each test
        orchestrator = AnalysisOrchestrator.getInstance(mockRedisRepo, mockQdrantRepo, mockAnalyzer);
        
        // Use fake timers to control setInterval
        vi.useFakeTimers();
    });

    afterEach(() => {
        // Stop any running orchestrators and clear mocks
        orchestrator.stop(username);
        vi.restoreAllMocks();
        vi.useRealTimers();
        // Reset the singleton instance to prevent state pollution between tests
        (AnalysisOrchestrator as any).instance = undefined;
    });

    it('should start and stop analysis timers for a user', () => {
        orchestrator.start(username);
        expect((orchestrator as any).activeUsers.has(username)).toBe(true);
        expect((orchestrator as any).activeUsers.get(username).timers).toHaveLength(3);

        orchestrator.stop(username);
        expect((orchestrator as any).activeUsers.has(username)).toBe(false);
    });

    it('should execute the full processing pipeline for a batch', async () => {
        orchestrator.start(username);

        // Advance time to trigger the 5-minute interval
        await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
        
        // 1. Get messages from Redis
        expect(mockRedisRepo.getAndClearMessageQueue).toHaveBeenCalledWith(username);

        // 2. Search for context in Qdrant
        expect((mockAnalyzer as any).embeddingModel.embedContent).toHaveBeenCalledWith(mockMessages.map(m=>m.message).join(' '));
        expect(mockQdrantRepo.searchSimilarInsights).toHaveBeenCalledWith([0.5, 0.5], 3);
        
        // 3. Perform analysis
        expect(mockAnalyzer.analyze).toHaveBeenCalledWith(username, '5m', mockMessages, []);

        // 4. Persist results
        expect(mockQdrantRepo.addInsight).toHaveBeenCalledWith({
            id: mockAnalysisResult.insight.id,
            vector: mockAnalysisResult.vector,
            payload: mockAnalysisResult.insight,
        });
        expect(mockRedisRepo.saveInsight).toHaveBeenCalledWith(username, '5m', mockAnalysisResult.insight);
    });

    it('should skip processing if no new messages are found', async () => {
        // Setup mock to return empty array
        vi.spyOn(mockRedisRepo, 'getAndClearMessageQueue').mockResolvedValue([]);

        orchestrator.start(username);
        await vi.advanceTimersByTimeAsync(5 * 60 * 1000);

        // Expect the pipeline to stop after fetching messages
        expect(mockRedisRepo.getAndClearMessageQueue).toHaveBeenCalledWith(username);
        expect(mockAnalyzer.analyze).not.toHaveBeenCalled();
        expect(mockQdrantRepo.addInsight).not.toHaveBeenCalled();
    });
});
