import express from 'express';
import cors from 'cors';
import { TikTokScraper } from '../../internal/scraper/scraper.js';
import { RedisRepository } from '../../internal/repository/redis.js';
import { AnalysisOrchestrator } from '../../internal/service/orchestrator.js';
import { AuthService } from '../../internal/service/auth.js';

// This map tracks running scraper instances to prevent duplicates.
const activeScrapers = new Map<string, TikTokScraper>();

/**
 * Creates and configures the Express application.
 * @param orchestrator The singleton instance of the AnalysisOrchestrator.
 * @param redisRepo The singleton instance of the RedisRepository.
 * @param authService The instance of the AuthService.
 * @returns The configured Express app.
 */
export const createApp = (
    orchestrator: AnalysisOrchestrator,
    redisRepo: RedisRepository,
    authService: AuthService
) => {
    const app = express();

    app.use(cors());
    app.use(express.json());

    // --- Authentication & User Endpoints ---

    /**
     * POST /api/auth/login
     * Otentikasi pengguna berbasis database MySQL (tabel users)
     */
    app.post('/api/auth/login', async (req, res) => {
        const { usernameOrEmail, password, tiktokUsername } = req.body;

        if (!usernameOrEmail) {
            return res.status(400).json({ status: 'error', message: 'Username atau Email wajib diisi.' });
        }

        try {
            console.log(`[API] Auth login request for: ${usernameOrEmail}`);
            const authResult = await authService.authenticate(usernameOrEmail, password);

            const targetTikTok = (tiktokUsername || authResult.user.username || 'streamer').trim().replace(/^@/, '');
            let streamActive = false;

            // Optional: Start TikTok scraper if possible
            if (targetTikTok && !activeScrapers.has(targetTikTok)) {
                try {
                    const scraper = new TikTokScraper(targetTikTok, redisRepo);
                    await scraper.start();
                    activeScrapers.set(targetTikTok, scraper);
                    orchestrator.start(targetTikTok);
                    streamActive = true;
                    console.log(`[API] Live stream connected for @${targetTikTok}`);
                } catch (scrapeErr) {
                    console.warn(`[API] TikTok stream offline for @${targetTikTok}. User logged in successfully.`);
                }
            } else if (activeScrapers.has(targetTikTok)) {
                streamActive = true;
            }

            return res.status(200).json({
                status: 'success',
                message: 'Login berhasil.',
                user: authResult.user,
                token: authResult.token,
                streamActive,
                tiktokUsername: targetTikTok
            });

        } catch (error: any) {
            console.warn(`[API] Login error for ${usernameOrEmail}:`, error.message);
            return res.status(401).json({ status: 'error', message: error.message || 'Login gagal.' });
        }
    });

    /**
     * GET /api/auth/users
     * Mengambil daftar pengguna terdaftar di MySQL (memudahkan pengujian cepat/demo)
     */
    app.get('/api/auth/users', async (req, res) => {
        try {
            const users = await authService.getAvailableUsers();
            res.status(200).json({ status: 'success', data: users });
        } catch (error: any) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    });

    /**
     * Backward-compatible POST /api/login endpoint
     */
    app.post('/api/login', async (req, res) => {
        const { username, password } = req.body;
        const target = (username || '').trim().replace(/^@/, '');

        if (!target) {
            return res.status(400).json({ status: 'error', message: 'Username is required' });
        }

        try {
            // First try database authentication
            let userObj: any = null;
            try {
                const authRes = await authService.authenticate(target, password);
                userObj = authRes.user;
            } catch (authErr) {
                // If not in DB, fallback to virtual streamer profile
                userObj = {
                    id: 99,
                    username: target,
                    email: `${target}@streamly.id`,
                    fullName: target,
                    role: 'streamer'
                };
            }

            if (activeScrapers.has(target)) {
                return res.json({
                    status: 'success',
                    message: 'Scraper already running for this user.',
                    username: target,
                    user: userObj
                });
            }

            console.log(`[API] Received login request for @${target}.`);

            let streamConnected = false;
            try {
                // 1. Start physical scraper
                const scraper = new TikTokScraper(target, redisRepo);
                await scraper.start();
                activeScrapers.set(target, scraper);

                // 2. Start analysis orchestrator
                orchestrator.start(target);
                streamConnected = true;
            } catch (streamErr) {
                console.warn(`[API] TikTok stream offline for @${target}. Permitting login session.`);
            }

            res.status(200).json({
                status: 'success',
                message: streamConnected ? 'Scraper and analysis started.' : 'Logged in (stream offline/demo mode ready).',
                username: target,
                user: userObj,
                streamConnected
            });

        } catch (error) {
            console.error(`[API] Failed to process login for @${target}:`, error);
            res.status(500).json({ status: 'error', message: 'Terjadi kesalahan sistem internal.' });
        }
    });

    // --- Insights API Endpoints ---
    app.get('/api/insights', async (req, res) => {
        const { username, type } = req.query as { username?: string, type?: '5m' | '20m' | '45m' };
        
        if (!username) {
            return res.status(400).json({ status: 'error', message: 'Username query parameter is required.' });
        }

        try {
            // Case 1: A specific insight type is requested
            if (type && ['5m', '20m', '45m'].includes(type)) {
                const results = await redisRepo.getLatestInsights(username, type, 1);
                return res.json({ status: 'success', data: results[0] || null });
            }

            // Case 2: All insights are requested
            const [insight5m, insight20m, insight45m] = await Promise.all([
                redisRepo.getLatestInsights(username, '5m', 1),
                redisRepo.getLatestInsights(username, '20m', 1),
                redisRepo.getLatestInsights(username, '45m', 1),
            ]);

            res.json({
                status: 'success',
                data: {
                    '5m': insight5m[0] || null,
                    '20m': insight20m[0] || null,
                    '45m': insight45m[0] || null,
                }
            });
        } catch (error) {
            console.error(`[API] Failed to fetch insights for @${username}:`, error);
            res.status(500).json({ status: 'error', message: 'An internal error occurred while fetching insights.' });
        }
    });

    // --- Live Chat Feed & Stream Connection Endpoints ---

    /**
     * GET /api/live/messages
     * Mengambil daftar pesan chat live terkini dari Redis untuk akun live target
     */
    app.get('/api/live/messages', async (req, res) => {
        const username = ((req.query.username as string) || '').trim().replace(/^@/, '');
        if (!username) {
            return res.status(400).json({ status: 'error', message: 'Parameter username akun live wajib diisi.' });
        }

        try {
            const messages = await redisRepo.getRecentMessages(username, 40);
            const isScraping = activeScrapers.has(username);
            return res.status(200).json({
                status: 'success',
                channel: username,
                isLive: isScraping,
                count: messages.length,
                data: messages
            });
        } catch (error: any) {
            console.error(`[API] Failed to get live messages for @${username}:`, error);
            return res.status(500).json({ status: 'error', message: error.message });
        }
    });

    /**
     * POST /api/insights/trigger
     * Memicu eksekusi analisis batch 5m secara langsung (tanpa harus menunggu 5 menit)
     */
    app.post('/api/insights/trigger', async (req, res) => {
        const username = ((req.body.username as string) || '').trim().replace(/^@/, '');
        if (!username) {
            return res.status(400).json({ status: 'error', message: 'Username target wajib diisi.' });
        }

        try {
            const insight = await orchestrator.triggerImmediateAnalysis(username);
            if (!insight) {
                return res.status(400).json({
                    status: 'error',
                    message: `Belum ada pesan chat live terkumpul dari @${username} untuk dianalisis.`
                });
            }

            return res.status(200).json({
                status: 'success',
                message: 'Analisis batch berhasil dieksekusi.',
                data: insight
            });
        } catch (error: any) {
            console.error(`[API] Failed to trigger immediate insight for @${username}:`, error);
            return res.status(500).json({ status: 'error', message: error.message });
        }
    });

    /**
     * POST /api/live/connect
     * Menghubungkan scraper ke channel TikTok Live baru secara dinamis
     */
    app.post('/api/live/connect', async (req, res) => {
        const targetTikTok = ((req.body.channel || req.body.username || '') as string).trim().replace(/^@/, '');
        if (!targetTikTok) {
            return res.status(400).json({ status: 'error', message: 'Channel TikTok live wajib diisi.' });
        }

        try {
            if (activeScrapers.has(targetTikTok)) {
                return res.json({
                    status: 'success',
                    message: `Scraper sudah aktif terhubung ke @${targetTikTok}.`,
                    channel: targetTikTok,
                    isLive: true
                });
            }

            const scraper = new TikTokScraper(targetTikTok, redisRepo);
            await scraper.start();
            activeScrapers.set(targetTikTok, scraper);
            orchestrator.start(targetTikTok);

            console.log(`[API] Dynamically connected live scraper for @${targetTikTok}`);
            return res.json({
                status: 'success',
                message: `Berhasil terhubung ke live stream @${targetTikTok}.`,
                channel: targetTikTok,
                isLive: true
            });
        } catch (error: any) {
            console.warn(`[API] Could not connect to @${targetTikTok}:`, error.message);
            return res.status(400).json({
                status: 'error',
                message: `Gagal terhubung ke @${targetTikTok}: ${error.message}`
            });
        }
    });

    return app;
};
