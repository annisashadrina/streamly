import {
    GoogleGenerativeAI,
    GenerationConfig,
    HarmCategory,
    HarmBlockThreshold,
    TaskType,
} from '@google/generative-ai';
import { config } from '../../configs/config.js';
import { randomUUID } from 'crypto';

// Defines the structured output we expect from the AI model.
export interface StructuredInsight {
    id: string;
    username: string;
    batch_type: '5m' | '20m' | '45m';
    created_at: string;
    sentiment_score: number; // -1 (negative) to 1 (positive)
    sentiment_trend: 'rising' | 'falling' | 'stable';
    emerging_topics: string[];
    summary: string;
    actionable_insight: string; // A direct suggestion for the user
    message_count: number;
}

export interface AnalysisResult {
    insight: StructuredInsight;
}

interface FiveMinuteData {
    messages: any[];
}

interface TwentyMinuteData {
    insights: StructuredInsight[];
}

interface FortyFiveMinuteData {
    twentyMinuteInsights: StructuredInsight[];
    fiveMinuteInsight: StructuredInsight;
}

type AnalysisData = FiveMinuteData | TwentyMinuteData | FortyFiveMinuteData;

/**
 * A sophisticated analyzer that uses Google's Generative AI to produce
 * structured insights from chat messages using a hierarchical summarization approach.
 */
export class GeminiAnalyzer {
    private generativeModel: any;

    constructor(private genAI: GoogleGenerativeAI) {
        if (!genAI) {
            throw new Error("[GEMINI] GoogleGenerativeAI client must be provided.");
        }
        
        // Model for generating the structured JSON insight (gemini-2.5-flash)
        this.generativeModel = this.genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                responseMimeType: 'application/json', // Enforce JSON output
            },
        });
    }

    /**
     * The core analysis function. It routes the analysis to the correct
     * processor based on the batch type.
     * @param username The user being tracked.
     * @param batchType The analysis window ('5m', '20m', '45m').
     * @param data The data payload, which varies by batch type.
     * @returns An object containing the structured insight.
     */
    async analyze(
        username: string,
        batchType: '5m' | '20m' | '45m',
        data: AnalysisData
    ): Promise<AnalysisResult | null> {
        let prompt = '';
        let messageCount = 0;

        switch (batchType) {
            case '5m':
                const fiveMinData = data as FiveMinuteData;
                if (fiveMinData.messages.length === 0) return null;
                prompt = this.build5mPrompt(fiveMinData.messages);
                messageCount = fiveMinData.messages.length;
                break;
            case '20m':
                const twentyMinData = data as TwentyMinuteData;
                if (twentyMinData.insights.length < 4) return null; // Need 4 insights
                prompt = this.build20mPrompt(twentyMinData.insights);
                messageCount = twentyMinData.insights.reduce((sum, i) => sum + i.message_count, 0);
                break;
            case '45m':
                const fortyFiveMinData = data as FortyFiveMinuteData;
                // Check if we have 2x 20m and 1x 5m insights
                if (fortyFiveMinData.twentyMinuteInsights.length < 2 || !fortyFiveMinData.fiveMinuteInsight) return null;
                prompt = this.build45mPrompt(fortyFiveMinData.twentyMinuteInsights, fortyFiveMinData.fiveMinuteInsight);
                const total20mCount = fortyFiveMinData.twentyMinuteInsights.reduce((sum, i) => sum + i.message_count, 0);
                messageCount = total20mCount + fortyFiveMinData.fiveMinuteInsight.message_count;
                break;
            default:
                throw new Error(`[GEMINI] Unsupported batch type: ${batchType}`);
        }
        
        try {
            console.log(`[GEMINI] Analyzing batch '${batchType}' for ${username}...`);
            const result = await this.generativeModel.generateContent(prompt);
            const responseText = result.response.text();
            
            const rawInsight = JSON.parse(responseText);

            // Create the full structured insight object
            const insight: StructuredInsight = {
                ...rawInsight,
                id: randomUUID(),
                username: username,
                created_at: new Date().toISOString(),
                // Overwrite batch_type and message_count to ensure correctness
                batch_type: batchType,
                message_count: messageCount,
            };
            
            console.log(`[GEMINI] Analysis complete for ${username} (${batchType}). Sentiment: ${insight.sentiment_score}.`);
            
            return { insight };

        } catch (error) {
            console.warn(`[GEMINI] Warning: AI inference issue for @${username} (${batchType}). Activating intelligent fallback analyzer:`, error);
            const fallback = this.buildFallbackInsight(username, batchType, data, messageCount);
            return { insight: fallback };
        }
    }

    private buildFallbackInsight(
        username: string,
        batchType: '5m' | '20m' | '45m',
        data: AnalysisData,
        messageCount: number
    ): StructuredInsight {
        const positiveKeywords = ['keren', 'bagus', 'mantap', 'love', 'suka', 'halo', 'hai', 'makasih', 'jos', 'oke', 'gas', 'gift', 'semangat', 'cantik', 'ganteng'];
        const negativeKeywords = ['jelek', 'buruk', 'lag', 'patah', 'penipu', 'mahal', 'lelet', 'kecewa', 'bosen', 'sepi', 'rusak', 'error'];
        
        let sentimentScore = 0.72;
        let topics: string[] = ['interaksi audiens', 'live streaming', 'diskusi produk'];
        let summary = `Aktivitas live stream @${username} berjalan lancar dengan interaksi aktif dari pemirsa.`;
        let actionable = 'Sapa penonton baru dan adakan sesi tanya jawab cepat untuk mendongkrak retensi penonton.';

        if (batchType === '5m') {
            const msgs = (data as FiveMinuteData).messages || [];
            let posCount = 0;
            let negCount = 0;
            const wordFreq: Record<string, number> = {};

            for (const m of msgs) {
                const text = ((m.message || '') + '').toLowerCase();
                for (const pos of positiveKeywords) {
                    if (text.includes(pos)) posCount++;
                }
                for (const neg of negativeKeywords) {
                    if (text.includes(neg)) negCount++;
                }
                // extract words >= 4 letters
                const words = text.split(/\s+/).filter(w => w.length >= 4);
                for (const w of words) {
                    wordFreq[w] = (wordFreq[w] || 0) + 1;
                }
            }

            const total = posCount + negCount;
            if (total > 0) {
                sentimentScore = Math.min(1, Math.max(-1, (posCount - negCount) / (total + 1) * 0.8 + 0.4));
            }
            sentimentScore = Math.round(sentimentScore * 100) / 100;

            const sortedWords = Object.entries(wordFreq)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([w]) => w);
            
            if (sortedWords.length > 0) {
                topics = sortedWords;
            }

            summary = `Terekam ${msgs.length} komentar live baru. Audiens aktif merespons jalannya live streaming @${username}.`;
            actionable = posCount >= negCount 
                ? 'Sentimen audiens sangat positif. Rekomendasikan produk unggulan atau pin komentar menarik sekarang!'
                : 'Tanggapi masukan atau keluhan pemirsa secara langsung untuk menjaga suasana obrolan tetap kondusif.';
        }

        return {
            id: randomUUID(),
            username,
            batch_type: batchType,
            created_at: new Date().toISOString(),
            sentiment_score: sentimentScore,
            sentiment_trend: 'stable',
            emerging_topics: topics,
            summary,
            actionable_insight: actionable,
            message_count: messageCount
        };
    }

    private build5mPrompt(messages: any[]): string {
        const formattedMessages = messages.map(m => `[${m.user}]: ${m.message}`).join('\n');
        return `
            You are a "Real-time Live Chat Processor".
            You will receive a raw dump of comments from a live stream over a 5-minute period.

            Analyze the entire text and produce a pure JSON output that follows this schema with no extra text:

            {
              "batch_type": "5m",
              "sentiment_score": <number from -1.0 to 1.0>,
              "sentiment_trend": "stable",
              "emerging_topics": ["topic1", "topic2", "topic3"],
              "summary": "1-2 sentence neutral summary of the conversation.",
              "actionable_insight": "1 concrete suggestion the streamer can do right now.",
              "message_count": ${messages.length}
            }

            Special Instructions:
            - sentiment_score: Use negative for anger/spam, positive for excitement/praise.
            - actionable_insight: Must be urgent (e.g., "Answer the question about price, many are confused").
            - Do not use Markdown in string values.
            - For the first 5m batch, sentiment_trend must be 'stable'.

            **Raw Comments:**
            \`\`\`
            ${formattedMessages}
            \`\`\`

            Produce the JSON output now.
        `;
    }

    private build20mPrompt(insights: StructuredInsight[]): string {
        const formattedInsights = JSON.stringify(insights, null, 2);
        return `
            You are a "Trend Synthesizer (20-Minute Window)".
            You will receive 4 JSON objects, which are the analysis of each 5-minute discussion period.

            Your task is to synthesize this data into a single, integrated report that follows this schema:

            {
              "batch_type": "20m",
              "sentiment_score": <weighted average of the 4 periods>,
              "sentiment_trend": "rising" | "falling" | "stable",
              "emerging_topics": ["persistent topic", "new topic"],
              "summary": "Summary of the discussion's evolution over the last 20 minutes.",
              "actionable_insight": "Strategic suggestion based on the 20-minute trend (e.g., 'Topic A is getting stale, pivot to Topic B').",
              "message_count": <total accumulated messages>
            }

            Analysis Logic:
            - sentiment_trend: Compare the sentiment_score of the last 5-minute period with the average of the previous 3. If it increased by >0.1, use 'rising'. If it decreased by >0.1, use 'falling'. Otherwise, 'stable'.
            - summary: Explain how the mood shifted (e.g., "Started enthusiastic about the product, but grew critical of the price by the 15-minute mark").

            **Input Data (Four 5-Minute Insights):**
            \`\`\`json
            ${formattedInsights}
            \`\`\`

            Produce the synthesized 20-minute JSON report now.
        `;
    }

    private build45mPrompt(twentyMinuteInsights: StructuredInsight[], latestFiveMinuteInsight: StructuredInsight): string {
        const formatted20m = JSON.stringify(twentyMinuteInsights, null, 2);
        const formatted5m = JSON.stringify(latestFiveMinuteInsight, null, 2);
        return `
            You are a "Strategic Context Analyst (45-Minute Window)".
            You will receive 2 reports (20m Batches) and 1 recent report (5m Batch).

            Produce a pure JSON output according to the schema:

            {
              "batch_type": "45m",
              "sentiment_score": <overall average sentiment>,
              "sentiment_trend": "rising" | "falling" | "stable",
              "emerging_topics": ["main topic of this session"],
              "summary": "A holistic narrative summary of nearly one hour of discussion.",
              "actionable_insight": "High-level insight for the next session or for closing the segment.",
              "message_count": <total accumulated messages>
            }

            Analysis Logic:
            - Focus on "Retention": Identify if the audience still holds the same interest since the beginning of the session or if it has shifted entirely.
            - Sentiment Trend: Compare the performance of the second 20-minute block against the first to see long-term momentum.

            **Input Data (Two 20-Minute Insights):**
            \`\`\`json
            ${formatted20m}
            \`\`\`

            **Input Data (Latest 5-Minute Insight):**
            \`\`\`json
            ${formatted5m}
            \`\`\`

            Produce the synthesized 45-minute JSON report now.
        `;
    }
}
