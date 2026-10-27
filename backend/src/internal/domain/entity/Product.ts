/**
 * Entity: Product
 * Merepresentasikan katalog barang/produk yang dipromosikan selama live stream.
 */
export class Product {
    private id: number;
    private merchantId: number;
    private sku: string;
    private name: string;
    private description?: string;
    private price: number;
    private stock: number;
    private category: string;
    private createdAt: Date;
    private updatedAt: Date;

    constructor(
        id: number,
        merchantId: number,
        sku: string,
        name: string,
        price: number,
        stock: number,
        category: string,
        description?: string,
        createdAt: Date = new Date(),
        updatedAt: Date = new Date()
    ) {
        this.id = id;
        this.merchantId = merchantId;
        this.sku = sku;
        this.name = name;
        this.price = price;
        this.stock = stock;
        this.category = category;
        this.description = description;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public getId(): number { return this.id; }
    public getMerchantId(): number { return this.merchantId; }
    public getSku(): string { return this.sku; }
    public getName(): string { return this.name; }
    public getPrice(): number { return this.price; }
    public getStock(): number { return this.stock; }
    public getCategory(): string { return this.category; }

    // --- Domain Method Stubs ---
    public reduceStock(quantity: number): boolean {
        // TODO: Kurangi stok saat checkout order kasir
        throw new Error("Method not implemented.");
    }

    public addStock(quantity: number): void {
        // TODO: Tambah stok produk
        throw new Error("Method not implemented.");
    }

    public applyDiscountPrice(discountPercent: number): number {
        // TODO: Hitung harga promo khusus live session
        throw new Error("Method not implemented.");
    }
}
