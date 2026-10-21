# Integration steps for the current Streamly backend

## 1. Apply the schema

Run `schema.sql` against MySQL 8.0+. Back up any existing `streamly_db` first. This is a proposed schema, not a migration that preserves old rows automatically; existing `messages` and `insights` have no session foreign key, so migrate/backfill them separately if they contain useful data.

## 2. Add session methods to `DatabaseRepository`

Add methods conceptually equivalent to:

```ts
async createSession(username: string, roomId?: string): Promise<number> {
  const [result] = await this.pool.execute<mysql.ResultSetHeader>(
    `INSERT INTO live_sessions (username, room_id, status) VALUES (?, ?, 'active')`,
    [username, roomId ?? null]
  );
  return result.insertId;
}

async endSession(sessionId: number, status: 'ended' | 'failed' = 'ended') {
  await this.pool.execute(
    `UPDATE live_sessions SET status = ?, ended_at = CURRENT_TIMESTAMP(3) WHERE id = ?`,
    [status, sessionId]
  );
}
```

Note: `mysql2/promise` result typing may need a type import adjustment based on the project's TypeScript settings.

## 3. Persist messages with session ID

Replace the existing `saveBatch(messages)` shape with an explicit type and session id. Avoid `any` and avoid relying on `username` inside each chat item—the current scraper's message shape contains `timestamp`, `user`, and `message`, while the current MySQL repository expects `timestamp`, `username`, `message`, and `batchType`.

```ts
type ChatMessage = {
  timestamp: string; // ISO string from the scraper
  user?: string;
  message: string;
};

async saveMessageBatch(sessionId: number, messages: ChatMessage[]) {
  if (messages.length === 0) return;
  const values = messages.map(m => [
    sessionId,
    new Date(m.timestamp),
    null,             // tiktok_user_id, if connector exposes it
    m.user ?? null,   // display_name
    m.message,
  ]);
  await this.pool.query(
    `INSERT INTO messages (session_id, message_time, tiktok_user_id, display_name, message) VALUES ?`,
    [values]
  );
}
```

This is a starting example: adapt the date handling to the connector's timestamp contract, and ensure MySQL writes are batched/backpressured so a slow database does not block the TikTok event handler. For production, use a durable retry queue or outbox pattern to avoid losing messages if Redis succeeds but MySQL fails.

## 4. Persist structured insights

Change `DatabaseRepository.saveInsight` to accept `sessionId` and the actual `StructuredInsight` fields. Store `sentiment_score`, `sentiment_trend`, `JSON.stringify(emerging_topics)`, `summary`, `actionable_insight`, `message_count`, `batch_type`, and `created_at`. Do not store the entire object in a single `content` column if the dashboard needs filtering, sorting, or charting by sentiment.

After insert, read `insertId` and use it to insert source mappings into `insight_messages` or `insight_dependencies`. The orchestrator currently receives message objects from Redis but no MySQL message IDs; add IDs to the message payload or maintain a mapping when messages are persisted before adding source links.

## 5. Wire dependencies in `src/cmd/api/main.ts`

The current composition root creates `RedisRepository`, `GeminiAnalyzer`, and `AnalysisOrchestrator`, but not `DatabaseRepository`. Instantiate `DatabaseRepository`, inject it into the scraper/orchestrator (or a dedicated persistence service), and close the pool during graceful shutdown. Do not leave schema creation as an unawaited constructor side effect; expose an awaited `initialize()` method so startup can fail clearly if MySQL is required but unavailable.

## 6. API behavior

Keep `GET /api/insights` on Redis for fast latest insight reads initially, but add a historical endpoint backed by MySQL, such as `GET /api/sessions/:sessionId/insights?type=5m`, with input validation and pagination. The current `/api/login` endpoint starts monitoring; it should create a session row and associate its ID with scraper/orchestrator. It is not user authentication despite its route name.

## 7. Tests to add

- Session create/end status lifecycle.
- Batch message insert, including empty batch.
- Insight insert with JSON topics and valid score range.
- Foreign-key behavior when a session is deleted.
- API history query filtered by session and batch type.
- Failure scenario where Redis succeeds but MySQL insert fails.
- Confirm the API build does not import a missing Qdrant repository if that code is not part of the active architecture.
