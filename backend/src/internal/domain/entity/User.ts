export type UserRole = 'streamer' | 'store_admin' | 'analyst';

/**
 * Entity: User
 * Merepresentasikan akun pengguna sistem Streamly (Streamer, Admin Toko, Analis).
 */
export class User {
    private id: number;
    private username: string;
    private email: string;
    private passwordHash: string;
    private fullName: string;
    private role: UserRole;
    private phoneNumber?: string;
    private createdAt: Date;
    private updatedAt: Date;

    constructor(
        id: number,
        username: string,
        email: string,
        passwordHash: string,
        fullName: string,
        role: UserRole = 'streamer',
        phoneNumber?: string,
        createdAt: Date = new Date(),
        updatedAt: Date = new Date()
    ) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.fullName = fullName;
        this.role = role;
        this.phoneNumber = phoneNumber;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // --- Accessor Methods (Getters) ---
    public getId(): number {
        return this.id;
    }

    public getUsername(): string {
        return this.username;
    }

    public getEmail(): string {
        return this.email;
    }

    public getFullName(): string {
        return this.fullName;
    }

    public getRole(): UserRole {
        return this.role;
    }

    public getPhoneNumber(): string | undefined {
        return this.phoneNumber;
    }

    public getCreatedAt(): Date {
        return this.createdAt;
    }

    public getUpdatedAt(): Date {
        return this.updatedAt;
    }

    // --- Domain Methods (Method Stubs) ---
    public validatePassword(plainPassword: string): boolean {
        // TODO: Implementasi verifikasi password menggunakan hash
        throw new Error("Method not implemented.");
    }

    public updateProfile(fullName: string, phoneNumber?: string): void {
        // TODO: Implementasi update profil pengguna
        throw new Error("Method not implemented.");
    }

    public changePassword(oldPasswordHash: string, newPasswordHash: string): boolean {
        // TODO: Implementasi penggantian password
        throw new Error("Method not implemented.");
    }

    public toJSON(): Record<string, any> {
        return {
            id: this.id,
            username: this.username,
            email: this.email,
            fullName: this.fullName,
            role: this.role,
            phoneNumber: this.phoneNumber,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}
