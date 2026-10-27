import { UserRole } from '../entity/User.js';

export interface LoginRequestDTO {
    usernameOrEmail: string;
    password?: string;
    tiktokUsername?: string;
}

export interface UserResponseDTO {
    id: number;
    username: string;
    email: string;
    fullName: string;
    role: UserRole;
    phoneNumber?: string;
}

export interface LoginResponseDTO {
    status: 'success' | 'error';
    message: string;
    user?: UserResponseDTO;
    token?: string;
    streamActive?: boolean;
    tiktokUsername?: string;
}
