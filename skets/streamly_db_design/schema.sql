-- Streamly persistent relational schema (MySQL 8.0+)
-- Redis remains responsible for real-time queues/cache; MySQL stores durable history.

CREATE DATABASE IF NOT EXISTS streamly_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE streamly_db;

CREATE TABLE IF NOT EXISTS live_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL COMMENT 'TikTok creator username being monitored',
  room_id VARCHAR(100) NULL COMMENT 'TikTok room ID when provided by connector',
  status ENUM('starting','active','ended','failed') NOT NULL DEFAULT 'starting',
  started_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ended_at DATETIME(3) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sessions_username_started (username, started_at),
  KEY idx_sessions_status (status),
  CONSTRAINT chk_session_times CHECK (ended_at IS NULL OR ended_at >= started_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  session_id BIGINT UNSIGNED NOT NULL,
  message_time DATETIME(3) NOT NULL,
  tiktok_user_id VARCHAR(100) NULL COMMENT 'TikTok commenter unique ID if available',
  display_name VARCHAR(100) NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_messages_session_time (session_id, message_time),
  CONSTRAINT fk_messages_session FOREIGN KEY (session_id)
    REFERENCES live_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS insights (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  session_id BIGINT UNSIGNED NOT NULL,
  batch_type ENUM('5m','20m','45m') NOT NULL,
  sentiment_score DECIMAL(5,4) NULL COMMENT 'Expected range -1.0000 to 1.0000',
  sentiment_trend ENUM('rising','falling','stable') NULL,
  emerging_topics JSON NULL,
  summary TEXT NOT NULL,
  actionable_insight TEXT NOT NULL,
  message_count INT UNSIGNED NOT NULL DEFAULT 0,
  model_name VARCHAR(100) NULL,
  generated_at DATETIME(3) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_insights_session_type_time (session_id, batch_type, generated_at),
  CONSTRAINT fk_insights_session FOREIGN KEY (session_id)
    REFERENCES live_sessions(id) ON DELETE CASCADE,
  CONSTRAINT chk_sentiment_score CHECK (sentiment_score IS NULL OR (sentiment_score >= -1 AND sentiment_score <= 1))
) ENGINE=InnoDB;

-- Provenance: which raw messages were included in a 5-minute insight.
-- Populate this when the batch is persisted; it is optional if retaining only aggregate reports.
CREATE TABLE IF NOT EXISTS insight_messages (
  insight_id BIGINT UNSIGNED NOT NULL,
  message_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (insight_id, message_id),
  KEY idx_insight_messages_message (message_id),
  CONSTRAINT fk_im_insight FOREIGN KEY (insight_id)
    REFERENCES insights(id) ON DELETE CASCADE,
  CONSTRAINT fk_im_message FOREIGN KEY (message_id)
    REFERENCES messages(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Provenance: which earlier insight(s) were used to synthesize a later insight (20m/45m).
CREATE TABLE IF NOT EXISTS insight_dependencies (
  insight_id BIGINT UNSIGNED NOT NULL,
  source_insight_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (insight_id, source_insight_id),
  KEY idx_insight_dependencies_source (source_insight_id),
  CONSTRAINT fk_id_insight FOREIGN KEY (insight_id)
    REFERENCES insights(id) ON DELETE CASCADE,
  CONSTRAINT fk_id_source_insight FOREIGN KEY (source_insight_id)
    REFERENCES insights(id) ON DELETE CASCADE,
  CONSTRAINT chk_insight_not_self CHECK (insight_id <> source_insight_id)
) ENGINE=InnoDB;
