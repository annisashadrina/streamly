export type SentimentLabel = 'positive' | 'negative' | 'neutral';

/**
 * Entity: Message
 * Merepresentasikan pesan obrolan masuk dari audiens selama live session.
 */
export class Message {
    private id: number;
    private sessionId: number;
    private messageTime: Date;
    private tiktokUserId?: string;
    private displayName?: string;
    private message: string;
    private sentimentLabel?: SentimentLabel;
    private isPotentialBuyer: boolean;
    private createdAt: Date;

    constructor(
        id: number,
        sessionId: number,
        message: string,
        messageTime: Date = new Date(),
        tiktokUserId?: string,
        displayName?: string,
        sentimentLabel?: SentimentLabel,
        isPotentialBuyer: boolean = false,
        createdAt: Date = new Date()
    ) {
        this.id = id;
        this.sessionId = sessionId;
        this.message = message;
        this.messageTime = messageTime;
        this.tiktokUserId = tiktokUserId;
        this.displayName = displayName;
        this.sentimentLabel = sentimentLabel;
        this.isPotentialBuyer = isPotentialBuyer;
        this.createdAt = createdAt;
    }

    public getId(): number { return this.id; }
    public getSessionId(): number { return this.sessionId; }
    public getMessageTime(): Date { return this.messageTime; }
    public getTiktokUserId(): string | undefined { return this.tiktokUserId; }
    public getDisplayName(): string | undefined { return this.displayName; }
    public getMessage(): string { return this.message; }
    public getSentimentLabel(): SentimentLabel | undefined { return this.sentimentLabel; }
    public getIsPotentialBuyer(): boolean { return this.isPotentialBuyer; }

    // --- Domain Method Stubs ---
    public classifySentiment(label: SentimentLabel): void {
        // TODO: Simpan label hasil klasifikasi AI
        throw new Error("Method not implemented.");
    }

    public markAsPotentialBuyer(status: boolean): void {
        // TODO: Tandai komentar berindikasi niat beli (e.g. 'spill diskon', 'checkout')
        throw new Error("Method not implemented.");
    }
}
