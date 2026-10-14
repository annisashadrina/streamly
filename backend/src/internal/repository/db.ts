import mysql from 'mysql2/promise';
import { config } from '../../configs/config.js';

export class DatabaseRepository {
    private pool: mysql.Pool;

    constructor() {
        console.log(`[DATABASE] Attempting connection to ${config.db.host}:${config.db.port} with user ${config.db.user} on DB ${config.db.database}`);
        this.pool = mysql.createPool({
            ...config.db,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            multipleStatements: true // Diperlukan untuk menjalankan banyak query sekaligus
        });

        this.initializeSchema();
    }

    private async initializeSchema() {
        const schema = `
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
