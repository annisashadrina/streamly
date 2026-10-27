import { IUserRepository } from '../domain/interfaces/IUserRepository.js';
import { User, UserRole } from '../domain/entity/User.js';
import { DatabaseRepository } from './db.js';

export class UserRepository implements IUserRepository {
    private dbRepo: DatabaseRepository;

    constructor(dbRepo: DatabaseRepository) {
        this.dbRepo = dbRepo;
    }

    private mapRowToUser(row: any): User {
        return new User(
            row.id,
            row.username,
            row.email,
            row.password_hash,
            row.full_name,
            row.role as UserRole,
            row.phone_number,
            new Date(row.created_at),
            new Date(row.updated_at)
        );
    }

    async findById(id: number): Promise<User | null> {
        const query = 'SELECT * FROM users WHERE id = ? LIMIT 1';
        try {
            const [rows]: any = await (this.dbRepo as any).pool.execute(query, [id]);
            if (!rows || rows.length === 0) return null;
            return this.mapRowToUser(rows[0]);
        } catch (error) {
            console.error(`[USER_REPO] Error finding user by id ${id}:`, error);
            return null;
        }
    }

    async findByUsername(username: string): Promise<User | null> {
        const query = 'SELECT * FROM users WHERE username = ? LIMIT 1';
        try {
            const [rows]: any = await (this.dbRepo as any).pool.execute(query, [username]);
            if (!rows || rows.length === 0) return null;
            return this.mapRowToUser(rows[0]);
        } catch (error) {
            console.error(`[USER_REPO] Error finding user by username ${username}:`, error);
            return null;
        }
    }

    async findByEmail(email: string): Promise<User | null> {
        const query = 'SELECT * FROM users WHERE email = ? LIMIT 1';
        try {
            const [rows]: any = await (this.dbRepo as any).pool.execute(query, [email]);
            if (!rows || rows.length === 0) return null;
            return this.mapRowToUser(rows[0]);
        } catch (error) {
            console.error(`[USER_REPO] Error finding user by email ${email}:`, error);
            return null;
        }
    }

    async findByUsernameOrEmail(identifier: string): Promise<{ user: User; passwordHash: string } | null> {
        const query = 'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1';
        try {
            const [rows]: any = await (this.dbRepo as any).pool.execute(query, [identifier, identifier]);
            if (!rows || rows.length === 0) return null;
            const row = rows[0];
            return {
                user: this.mapRowToUser(row),
                passwordHash: row.password_hash
            };
        } catch (error) {
            console.error(`[USER_REPO] Error finding user by identifier ${identifier}:`, error);
            return null;
        }
    }

    async getAllUsers(): Promise<User[]> {
        const query = 'SELECT * FROM users ORDER BY id ASC';
        try {
            const [rows]: any = await (this.dbRepo as any).pool.execute(query);
            if (!rows || rows.length === 0) return [];
            return rows.map((r: any) => this.mapRowToUser(r));
        } catch (error) {
            console.error('[USER_REPO] Error fetching all users:', error);
            return [];
        }
    }

    async create(user: User): Promise<User> {
        const query = `
            INSERT INTO users (username, email, password_hash, full_name, role, phone_number)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const params = [
            user.getUsername(),
            user.getEmail(),
            (user as any).passwordHash || '',
            user.getFullName(),
            user.getRole(),
            user.getPhoneNumber() || null
        ];
        const [result]: any = await (this.dbRepo as any).pool.execute(query, params);
        return new User(
            result.insertId,
            user.getUsername(),
            user.getEmail(),
            '',
            user.getFullName(),
            user.getRole(),
            user.getPhoneNumber()
        );
    }

    async update(user: User): Promise<boolean> {
        const query = `
            UPDATE users SET full_name = ?, phone_number = ?, role = ? WHERE id = ?
        `;
        const params = [user.getFullName(), user.getPhoneNumber() || null, user.getRole(), user.getId()];
        const [result]: any = await (this.dbRepo as any).pool.execute(query, params);
        return result.affectedRows > 0;
    }
}
