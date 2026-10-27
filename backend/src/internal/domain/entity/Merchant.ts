/**
 * Entity: Merchant
 * Merepresentasikan toko/UMKM mitra yang menyelenggarakan siaran live commerce.
 */
export class Merchant {
    private id: number;
    private ownerId: number;
    private storeName: string;
    private tiktokShopId?: string;
    private category: string;
    private city: string;
    private createdAt: Date;
    private updatedAt: Date;

    constructor(
        id: number,
        ownerId: number,
        storeName: string,
        category: string,
        city: string,
        tiktokShopId?: string,
        createdAt: Date = new Date(),
        updatedAt: Date = new Date()
    ) {
        this.id = id;
        this.ownerId = ownerId;
        this.storeName = storeName;
        this.category = category;
        this.city = city;
        this.tiktokShopId = tiktokShopId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public getId(): number { return this.id; }
    public getOwnerId(): number { return this.ownerId; }
    public getStoreName(): string { return this.storeName; }
    public getTiktokShopId(): string | undefined { return this.tiktokShopId; }
    public getCategory(): string { return this.category; }
    public getCity(): string { return this.city; }

    // --- Domain Method Stubs ---
    public linkTikTokShop(shopId: string): boolean {
        // TODO: Validasi dan hubungkan ID TikTok Shop
        throw new Error("Method not implemented.");
    }

    public updateStoreDetails(storeName: string, category: string, city: string): void {
        // TODO: Update metadata toko
        throw new Error("Method not implemented.");
    }
}
