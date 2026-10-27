import bcrypt from 'bcryptjs';
import { IUserRepository } from '../domain/interfaces/IUserRepository.js';
import { UserResponseDTO } from '../domain/dto/AuthDTO.js';

export class AuthService {
    private userRepo: IUserRepository;

    constructor(userRepo: IUserRepository) {
        this.userRepo = userRepo;
    }

    /**
     * Authenticates a user using username/email and password.
     * Supports flexible testing: if no password provided (quick demo), or valid bcrypt match.
     */
    async authenticate(identifier: string, plainPassword?: string): Promise<{ user: UserResponseDTO; token: string }> {
        if (!identifier || identifier.trim() === '') {
            throw new Error('Username atau Email wajib diisi.');
        }

        const cleanIdentifier = identifier.trim().replace(/^@/, '');
        const record = await (this.userRepo as any).findByUsernameOrEmail(cleanIdentifier);

        if (!record) {
            throw new Error(`Pengguna dengan identitas '${cleanIdentifier}' tidak ditemukan di database.`);
        }

        const { user, passwordHash } = record;

        // If password is provided, verify it
        if (plainPassword !== undefined && plainPassword !== '') {
            let isValid = false;
            try {
                // Check bcrypt hash
                if (passwordHash && (passwordHash.startsWith('$2a$') || passwordHash.startsWith('$2b$') || passwordHash.startsWith('$2y$'))) {
                    isValid = bcrypt.compareSync(plainPassword, passwordHash);
                }
            } catch (err) {
                isValid = false;
            }

            // Fallback for default testing password 'password123' or direct match
            if (!isValid && (plainPassword === 'password123' || plainPassword === passwordHash)) {
                isValid = true;
            }

            if (!isValid) {
                throw new Error('Password yang Anda masukkan salah.');
            }
        }

        const userDTO: UserResponseDTO = {
            id: user.getId(),
            username: user.getUsername(),
            email: user.getEmail(),
            fullName: user.getFullName(),
            role: user.getRole(),
            phoneNumber: user.getPhoneNumber()
        };

        // Generate simple bearer token
        const token = `streamly-auth-${user.getId()}-${Buffer.from(user.getUsername()).toString('base64')}-${Date.now()}`;

        return {
            user: userDTO,
            token
        };
    }

    async getAvailableUsers(): Promise<UserResponseDTO[]> {
        const users = await this.userRepo.getAllUsers();
        return users.map(u => ({
            id: u.getId(),
            username: u.getUsername(),
            email: u.getEmail(),
            fullName: u.getFullName(),
            role: u.getRole(),
            phoneNumber: u.getPhoneNumber()
        }));
    }
}
