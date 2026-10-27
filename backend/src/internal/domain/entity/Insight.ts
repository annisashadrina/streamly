export type BatchType = '5m' | '20m' | '45m';
export type SentimentTrend = 'rising' | 'falling' | 'stable';

/**
 * Entity: Insight
 * Merepresentasikan hasil analisis dan sintesis kecerdasan buatan Gemini.
 */
export class Insight {
    private id: number;
    private sessionId: number;
    private batchType: BatchType;
    private sentimentScore: number;
    private sentimentTrend: SentimentTrend;
    private emergingTopics: string[];
    private summary: string;
    private actionableInsight: string;
    private messageCount: number;
    private modelName: string;
    private generatedAt: Date;
    private createdAt: Date;

    constructor(
        id: number,
        sessionId: number,
        batchType: BatchType,
        sentimentScore: number,
        sentimentTrend: SentimentTrend,
        emergingTopics: string[],
        summary: string,
        actionableInsight: string,
        messageCount: number = 0,
        modelName: string = 'gemini-1.5-flash',
        generatedAt: Date = new Date(),
        createdAt: Date = new Date()
    ) {
        this.id = id;
        this.sessionId = sessionId;
        this.batchType = batchType;
        this.sentimentScore = sentimentScore;
        this.sentimentTrend = sentimentTrend;
        this.emergingTopics = emergingTopics;
        this.summary = summary;
        this.actionableInsight = actionableInsight;
        this.messageCount = messageCount;
        this.modelName = modelName;
        this.generatedAt = generatedAt;
        this.createdAt = createdAt;
    }

    public getId(): number { return this.id; }
    public getSessionId(): number { return this.sessionId; }
    public getBatchType(): BatchType { return this.batchType; }
    public getSentimentScore(): number { return this.sentimentScore; }
    public getSentimentTrend(): SentimentTrend { return this.sentimentTrend; }
    public getEmergingTopics(): string[] { return this.emergingTopics; }
    public getSummary(): string { return this.summary; }
    public getActionableInsight(): string { return this.actionableInsight; }
    public getMessageCount(): number { return this.messageCount; }
    public getModelName(): string { return this.modelName; }
    public getGeneratedAt(): Date { return this.generatedAt; }

    // --- Domain Method Stubs ---
    public isNegativeAlert(): boolean {
        // TODO: Deteksi apakah skor sentimen berada di bawah ambang batas bahaya (-0.3)
        throw new Error("Method not implemented.");
    }

    public getFormattedScorePercentage(): string {
        // TODO: Format skor (-1.000 s/d 1.000) menjadi persen tampilan UI
        throw new Error("Method not implemented.");
    }
}
