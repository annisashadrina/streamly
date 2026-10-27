import { User } from '../entity/User.js';

export interface IUserRepository {
    findById(id: number): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByUsernameOrEmail(identifier: string): Promise<User | null>;
    getAllUsers(): Promise<User[]>;
    create(user: User): Promise<User>;
    update(user: User): Promise<boolean>;
}
