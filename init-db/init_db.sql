CREATE TABLE global_stats (
    stat_name VARCHAR(50) PRIMARY KEY,
    stat_value BIGINT NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);