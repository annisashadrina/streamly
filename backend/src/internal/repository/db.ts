import mysql from 'mysql2/promise';
import { config } from '../../configs/config.js';

export class DatabaseRepository {
    public pool: mysql.Pool;

    constructor() {
        console.log(`[DATABASE] Attempting connection to ${config.db.host}:${config.db.port} with user ${config.db.user} on DB ${config.db.database}`);
        this.pool = mysql.createPool({
            ...config.db,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            multipleStatements: true
        });

        this.initializeSchema();
    }

    private async initializeSchema() {
        const schema = `
            CREATE TABLE IF NOT EXISTS users (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                email VARCHAR(100) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(100) NOT NULL,
                role ENUM('streamer', 'store_admin', 'analyst') NOT NULL DEFAULT 'streamer',
                phone_number VARCHAR(20) NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                timestamp DATETIME NOT NULL,
                username VARCHAR(100) NOT NULL,
                message TEXT NOT NULL,
                batch_type VARCHAR(20) DEFAULT '45m',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS insights (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) NOT NULL,
                batch_type VARCHAR(20) NOT NULL,
                content TEXT NOT NULL,
                message_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        try {
            await this.pool.query(schema);
            console.log('[DATABASE] Schema initialized/verified successfully.');

            // Seed default users if empty
            const [rows]: any = await this.pool.query('SELECT COUNT(*) as count FROM users');
            if (rows && rows[0] && rows[0].count === 0) {
                const seedHash = '$2b$10$t2jSm/v1MN6GVTmwm8KygO2je5oq1p2zCgh3CtLcBKXkOHCxT3GGG'; // password123
                await this.pool.query(`
                    INSERT INTO users (id, username, email, password_hash, full_name, role, phone_number) VALUES
                    (1, 'aryo_streamer', 'aryo@streamly.id', '${seedHash}', 'Aryo Abdillah A.', 'streamer', '081234567891'),
                    (2, 'annisa_admin', 'annisa@glowupbeauty.com', '${seedHash}', 'Annisa Nur Shadrina', 'store_admin', '081234567892'),
                    (3, 'fadia_host', 'fadia@urbanstreet.co.id', '${seedHash}', 'Fadia Nabila Shifa', 'streamer', '081234567893'),
                    (4, 'refito_analyst', 'refito@agencygrowth.com', '${seedHash}', 'Refito Rahmat F.', 'analyst', '081234567894'),
                    (5, 'revaldi_host', 'revaldi@gadgetkita.com', '${seedHash}', 'Revaldi Ramadhan N.', 'streamer', '081234567895');
                `);
                console.log('[DATABASE] Seeded 5 initial Streamly users.');
            }
        } catch (error) {
            console.error('[DATABASE] Failed to initialize schema:', error);
        }
    }

    async saveBatch(messages: any[]) {
        if (messages.length === 0) return;

        const query = 'INSERT INTO messages (timestamp, username, message, batch_type) VALUES ?';
        const values = messages.map(m => [
            m.timestamp,
            m.username,
            m.message,
            m.batchType || '45m'
        ]);

        try {
            await this.pool.query(query, [values]);
            console.log(`Saved ${messages.length} messages to MySQL Database.`);
        } catch (error) {
            console.error('Failed to save batch to MySQL Database:', error);
            throw error;
        }
    }

    async saveInsight(insight: { username: string, batchType: string, content: string, messageCount: number }) {
        const query = 'INSERT INTO insights (username, batch_type, content, message_count) VALUES (?, ?, ?, ?)';
        try {
            await this.pool.execute(query, [insight.username, insight.batchType, insight.content, insight.messageCount]);
            console.log(`Saved ${insight.batchType} insight for ${insight.username} to MySQL Database.`);
        } catch (error) {
            console.error(`Failed to save ${insight.batchType} insight for ${insight.username}:`, error);
            throw error;
        }
    }

    async getLatestInsight(batchType: string, username?: string) {
        let query = 'SELECT * FROM insights WHERE batch_type = ?';
        const params: any[] = [batchType];

        if (username) {
            query += ' AND username = ?';
            params.push(username);
        }

        query += ' ORDER BY created_at DESC LIMIT 1';

        try {
            const [rows]: any = await this.pool.execute(query, params);
            return rows[0] || null;
        } catch (error) {
            console.error(`Failed to get latest ${batchType} insight:`, error);
            throw error;
        }
    }


    async close() {
        await this.pool.end();
    }
}
