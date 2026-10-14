import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GeminiAnalyzer, StructuredInsight } from './gemini.js';

describe('GeminiAnalyzer (Temporal Zoom Architecture)', () => {
    let analyzer: GeminiAnalyzer;
    
    let mockGenerativeModel: {
        generateContent: any;
    };
    
    let mockGenAIClient: {
        getGenerativeModel: any;
    };

    // --- MOCK RESPONSES ---
    const MOCK_5M_AI_RESPONSE = {
        sentiment_score: 0.8,
        sentiment_trend: "stable",
        summary: "High enthusiasm for the new feature.",
        actionable_insight: "Pin a link to the tutorial.",
        emerging_topics: ["new feature", "tutorial"],
    };

    const MOCK_20M_AI_RESPONSE = {
        sentiment_score: 0.6,
        sentiment_trend: "falling",
        summary: "Initially high enthusiasm, but users started asking about price.",
        actionable_insight: "Address pricing concerns now.",
        emerging_topics: ["pricing", "availability"],
    };

    beforeEach(() => {
        mockGenerativeModel = {
            generateContent: vi.fn(),
        };
        
        mockGenAIClient = {
            getGenerativeModel: vi.fn().mockReturnValue(mockGenerativeModel),
        };

        analyzer = new GeminiAnalyzer(mockGenAIClient as any);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // --- TEST CASE: 5 MINUTE BATCH (RAW DATA) ---
    describe('5m Batch Analysis', () => {
        it('should transform raw messages into a structured insight', async () => {
            const messages = [
                { user: 'rio', message: 'Keren banget fiturnya!' },
                { user: 'adul', message: 'Cara pakenya gimana?' }
            ];

            mockGenerativeModel.generateContent.mockResolvedValue({
                response: { text: () => JSON.stringify(MOCK_5M_AI_RESPONSE) },
            });

            const result = await analyzer.analyze('riofirman', '5m', { messages });

            expect(result?.insight.batch_type).toBe('5m');
            expect(result?.insight.message_count).toBe(2);
            expect(result?.insight.username).toBe('riofirman');
            expect(mockGenerativeModel.generateContent).toHaveBeenCalledWith(
                expect.stringContaining('Keren banget fiturnya!')
            );
        });
    });

    // --- TEST CASE: 20 MINUTE BATCH (AGGREGATION) ---
    describe('20m Batch Analysis', () => {
        it('should aggregate 4x 5m insights and calculate total message count', async () => {
            // Mock 4 insights dari batch 5 menit sebelumnya
            const mock5mInsights: StructuredInsight[] = Array(4).fill(null).map((_, i) => ({
                id: `id-${i}`,
                username: 'riofirman',
                batch_type: '5m',
                created_at: new Date().toISOString(),
                sentiment_score: 0.5,
                sentiment_trend: 'stable',
                emerging_topics: ['topic'],
                summary: `Summary ${i}`,
                actionable_insight: 'insight',
                message_count: 50, // Total per 5 menit
            }));

            mockGenerativeModel.generateContent.mockResolvedValue({
                response: { text: () => JSON.stringify(MOCK_20M_AI_RESPONSE) },
            });

            const result = await analyzer.analyze('riofirman', '20m', { insights: mock5mInsights });

            // Pastikan message_count terakumulasi (4 * 50 = 200)
            expect(result?.insight.message_count).toBe(200);
            expect(result?.insight.batch_type).toBe('20m');
            
            // Cek apakah prompt mengandung data JSON dari 5m
            const prompt = mockGenerativeModel.generateContent.mock.calls[0][0];
            expect(prompt).toContain('Summary 0');
            expect(prompt).toContain('Summary 3');
        });
    });

    // --- TEST CASE: 45 MINUTE BATCH (GRAND STRATEGY) ---
    describe('45m Batch Analysis', () => {
        it('should synthesize 2x 20m and 1x 5m insights', async () => {
            const twentyMinuteInsights: any[] = [
                { batch_type: '20m', message_count: 500, summary: "First Half Stable" },
                { batch_type: '20m', message_count: 400, summary: "Second Half Rising" }
            ];
            const fiveMinuteInsight: any = { 
                batch_type: '5m', 
                message_count: 100, 
                summary: "Last Moment Peak" 
            };

            mockGenerativeModel.generateContent.mockResolvedValue({
                response: { text: () => JSON.stringify({
                    sentiment_score: 0.9,
                    sentiment_trend: "rising",
                    summary: "Overall successful stream.",
                    actionable_insight: "Prepare for Q&A session.",
                    emerging_topics: ["success", "future"]
                }) },
            });

            const result = await analyzer.analyze('riofirman', '45m', { 
                twentyMinuteInsights, 
                fiveMinuteInsight 
            });

            // Total: 500 + 400 + 100 = 1000
            expect(result?.insight.message_count).toBe(1000);
            expect(result?.insight.batch_type).toBe('45m');
            
            const prompt = mockGenerativeModel.generateContent.mock.calls[0][0];
            expect(prompt).toContain('First Half Stable');
            expect(prompt).toContain('Last Moment Peak');
        });
    });
});