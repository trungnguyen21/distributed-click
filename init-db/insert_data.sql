INSERT INTO global_stats (stat_name, stat_value, last_updated)
VALUES ('total_clicks', $1, NOW())
ON CONFLICT (stat_name) 
DO UPDATE SET stat_value = $1, last_updated = NOW();