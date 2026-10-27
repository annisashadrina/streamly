export type SessionStatus = 'starting' | 'active' | 'ended' | 'failed';

/**
 * Entity: LiveSession
 * Merepresentasikan sesi siaran langsung TikTok Live yang dipantau sistem.
 */
export class LiveSession {
    private id: number;
    private merchantId: number;
    private hostUserId: number;
    private title: string;
    private tiktokUsername: string;
    private roomId?: string;
    private status: SessionStatus;
    private startedAt: Date;
    private endedAt?: Date;
    private totalViews: number;
    private createdAt: Date;
    private updatedAt: Date;

    constructor(
        id: number,
        merchantId: number,
        hostUserId: number,
        title: string,
        tiktokUsername: string,
        status: SessionStatus = 'starting',
        roomId?: string,
        startedAt: Date = new Date(),
        endedAt?: Date,
        totalViews: number = 0,
        createdAt: Date = new Date(),
        updatedAt: Date = new Date()
    ) {
        this.id = id;
        this.merchantId = merchantId;
        this.hostUserId = hostUserId;
        this.title = title;
        this.tiktokUsername = tiktokUsername;
        this.status = status;
        this.roomId = roomId;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
        this.totalViews = totalViews;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public getId(): number { return this.id; }
    public getMerchantId(): number { return this.merchantId; }
    public getHostUserId(): number { return this.hostUserId; }
    public getTitle(): string { return this.title; }
    public getTiktokUsername(): string { return this.tiktokUsername; }
    public getRoomId(): string | undefined { return this.roomId; }
    public getStatus(): SessionStatus { return this.status; }
    public getStartedAt(): Date { return this.startedAt; }
    public getEndedAt(): Date | undefined { return this.endedAt; }
    public getTotalViews(): number { return this.totalViews; }

    // --- Domain Method Stubs ---
    public activateSession(roomId: string): void {
        // TODO: Ubah status menjadi 'active' saat tersambung ke TikTok Room
        throw new Error("Method not implemented.");
    }

    public endSession(): void {
        // TODO: Selesaikan sesi live, catat endedAt
        throw new Error("Method not implemented.");
    }

    public incrementViews(viewCount: number): void {
        // TODO: Akumulasi statistik penonton
        throw new Error("Method not implemented.");
    }
}
