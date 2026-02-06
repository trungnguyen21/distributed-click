import asyncio
import json
import redis.asyncio as redis
import asyncpg
from aiokafka import AIOKafkaConsumer

# --- CONFIGURATION ---
KAFKA_BOOTSTRAP = "localhost:9092"
REDIS_URL = "redis://localhost:6379"
POSTGRES_URI = "postgresql://user:password@localhost:5432/clicker_db"


async def hydrate_redis(redis_client):
    """Fetches the last known count from Postgres and warms up Redis."""
    print("--- Initializing System (Hydration) ---")
    try:
        conn = await asyncpg.connect(POSTGRES_URI)
        row = await conn.fetchrow("SELECT stat_value FROM global_stats WHERE stat_name = 'total_clicks'")
        await conn.close()

        if row:
            db_count = row['stat_value']
            # We use SETNX (Set if Not Exists) or simply SET 
            # to ensure Redis starts with the Source of Truth
            await redis_client.set("total_clicks", db_count)
            print(f"Redis hydrated with {db_count} clicks from Postgres.")
        else:
            print("No existing data in Postgres. Starting from 0.")
    except Exception as e:
        print(f"Hydration failed (Postgres might be empty or down): {e}")


async def postgres_flusher(redis_client):
    """Periodically saves the Redis total to Postgres."""
    conn = None
    recorded_press = 0
    time_retry = 1
    retries = 0

    print("--- Flusher Started ---")
    try:
        while True:
            try:
                if conn is None or conn.is_closed():
                    print("Reconnecting to Postgres...")
                    conn = await asyncpg.connect(POSTGRES_URI)
                    
                total_clicks = await redis_client.get("total_clicks")
                
                if total_clicks and int(total_clicks) != recorded_press:
                    print("Number of clicks changed, syncing...")
                    count = int(total_clicks)
                    recorded_press = count
                    await conn.execute('''
                        INSERT INTO global_stats (stat_name, stat_value, last_updated)
                        VALUES ('total_clicks', $1, NOW())
                        ON CONFLICT (stat_name) 
                        DO UPDATE SET stat_value = $1, last_updated = NOW();
                    ''', count)
                    print(f"Checkpoint: {count} clicks synced to Postgres.")
                else:
                    print("Nothing to sync")

                # reset the time retry and no of retries
                time_retry = 1
                retries = 0
                await asyncio.sleep(60)
            except Exception as e:
                if retries <= 10:
                    time_retry *= 2
                    retries += 1
                    print(f"Postgres is down... Retrying in {time_retry} secs")
                    await asyncio.sleep(time_retry)
                else:
                    raise e

    except Exception as e:
        print(f"Flusher Error: {e}")
    finally:
        await conn.close()


async def kafka_consumer(redis_client):
    """Reads clicks from Kafka and updates Redis instantly."""
    consumer = AIOKafkaConsumer(
        "user-clicks",
        bootstrap_servers=KAFKA_BOOTSTRAP,
        group_id="click-processors",
        auto_offset_reset='latest'
    )
    await consumer.start()
    try:
        async for msg in consumer:
            data = json.loads(msg.value.decode("utf-8"))
            # Atomically increment in Redis
            await redis_client.incrby("total_clicks", data.get("increment", 1))
    finally:
        await consumer.stop()

async def main():
    # Share a single Redis connection pool
    redis_client = redis.from_url(REDIS_URL)
    
    # Run both tasks concurrently
    await asyncio.gather(
        kafka_consumer(redis_client),
        postgres_flusher(redis_client)
    )

if __name__ == "__main__":
    asyncio.run(main())