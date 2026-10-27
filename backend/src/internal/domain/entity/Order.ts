export type PaymentMethod = 'cash_on_delivery' | 'qris' | 'bank_transfer' | 'e_wallet';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'cancelled';

/**
 * Entity: Order
 * Merepresentasikan transaksi kasir penjualan selama live stream berlangsung.
 */
export class Order {
    private id: number;
    private sessionId: number;
    private merchantId: number;
    private orderNumber: string;
    private buyerName: string;
    private buyerPhone: string;
    private paymentMethod: PaymentMethod;
    private paymentStatus: PaymentStatus;
    private totalAmount: number;
    private orderTime: Date;
    private createdAt: Date;

    constructor(
        id: number,
        sessionId: number,
        merchantId: number,
        orderNumber: string,
        buyerName: string,
        buyerPhone: string,
        paymentMethod: PaymentMethod,
        totalAmount: number,
        paymentStatus: PaymentStatus = 'paid',
        orderTime: Date = new Date(),
        createdAt: Date = new Date()
    ) {
        this.id = id;
        this.sessionId = sessionId;
        this.merchantId = merchantId;
        this.orderNumber = orderNumber;
        this.buyerName = buyerName;
        this.buyerPhone = buyerPhone;
        this.paymentMethod = paymentMethod;
        this.totalAmount = totalAmount;
        this.paymentStatus = paymentStatus;
        this.orderTime = orderTime;
        this.createdAt = createdAt;
    }

    public getId(): number { return this.id; }
    public getSessionId(): number { return this.sessionId; }
    public getMerchantId(): number { return this.merchantId; }
    public getOrderNumber(): string { return this.orderNumber; }
    public getBuyerName(): string { return this.buyerName; }
    public getBuyerPhone(): string { return this.buyerPhone; }
    public getPaymentMethod(): PaymentMethod { return this.paymentMethod; }
    public getPaymentStatus(): PaymentStatus { return this.paymentStatus; }
    public getTotalAmount(): number { return this.totalAmount; }

    // --- Domain Method Stubs ---
    public confirmPayment(): void {
        // TODO: Konfirmasi status pembayaran berhasil
        throw new Error("Method not implemented.");
    }

    public cancelOrder(reason: string): void {
        // TODO: Batalkan order dan kembalikan stok
        throw new Error("Method not implemented.");
    }
}

/**
 * Entity: OrderItem
 * Merepresentasikan item spesifik produk di dalam sebuah order kasir live stream.
 */
export class OrderItem {
    private id: number;
    private orderId: number;
    private productId: number;
    private quantity: number;
    private unitPrice: number;
    private subtotal: number;
    private createdAt: Date;

    constructor(
        id: number,
        orderId: number,
        productId: number,
        quantity: number,
        unitPrice: number,
        subtotal: number,
        createdAt: Date = new Date()
    ) {
        this.id = id;
        this.orderId = orderId;
        this.productId = productId;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.subtotal = subtotal;
        this.createdAt = createdAt;
    }

    public getId(): number { return this.id; }
    public getOrderId(): number { return this.orderId; }
    public getProductId(): number { return this.productId; }
    public getQuantity(): number { return this.quantity; }
    public getUnitPrice(): number { return this.unitPrice; }
    public getSubtotal(): number { return this.subtotal; }

    // --- Domain Method Stubs ---
    public calculateSubtotal(): number {
        // TODO: Hitung subtotal = quantity * unitPrice
        throw new Error("Method not implemented.");
    }
}
