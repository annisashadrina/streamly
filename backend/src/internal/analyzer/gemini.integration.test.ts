import { describe, it, expect, beforeEach } from 'vitest';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiAnalyzer, StructuredInsight } from './gemini.js';
import 'dotenv/config';

// Integration test memakan waktu lebih lama karena memanggil server Google
// Kita set timeout 30 detik agar tidak error karena lambat
describe('GeminiAnalyzer Integration Test (Real API Call)', { timeout: 30000 }, () => {
    let analyzer: GeminiAnalyzer;

    beforeEach(() => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY tidak ditemukan di .env");
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        analyzer = new GeminiAnalyzer(genAI);
    });

    it('SHOULD return REAL JSON output for 5m batch from Gemini', async () => {
        const messages = [
            { user: 'user1', message: 'Kapan produk ini ready kak?' },
            { user: 'user2', message: 'Harganya kemahalan sih menurutku' },
            { user: 'user3', message: 'Cek keranjang kuning sekarang!' },
        ];

        console.log("--- Sending Real Request to Gemini (5m) ---");
        const result = await analyzer.analyze('test_streamer', '5m', { messages });

        console.log("Real AI Response (5m):", JSON.stringify(result, null, 2));

        expect(result).not.toBeNull();
        expect(result?.insight.batch_type).toBe('5m');
        expect(typeof result?.insight.sentiment_score).toBe('number');
        expect(Array.isArray(result?.insight.emerging_topics)).toBe(true);
    });

    it('SHOULD aggregate insights in 20m batch using REAL AI logic', async () => {
        // Simulasi 4 hasil analisis 5 menitan
        const mockInsights: StructuredInsight[] = [
            { sentiment_score: 0.5, summary: "Awal yang tenang", message_count: 10 } as any,
            { sentiment_score: 0.8, summary: "Lonjakan antusiasme", message_count: 50 } as any,
            { sentiment_score: -0.2, summary: "Banyak pertanyaan teknis", message_count: 30 } as any,
            { sentiment_score: 0.1, summary: "Diskusi harga mulai muncul", message_count: 40 } as any,
        ];

        console.log("--- Sending Real Request to Gemini (20m Aggregation) ---");
        const result = await analyzer.analyze('test_streamer', '20m', { insights: mockInsights });

        console.log("Real AI Response (20m):", JSON.stringify(result, null, 2));

        expect(result).not.toBeNull();
        expect(result?.insight.batch_type).toBe('20m');
        expect(result?.insight.message_count).toBe(130); // 10+50+30+40
    });
});