from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from aiokafka import AIOKafkaProducer
import redis.asyncio as redis
import json
import asyncio

KAFKA_INSTANCE = "localhost:9092" # Use 'broker:29092' if running inside Docker
TOPIC = "user-clicks"

# Configuration
producer = None

# Redis instance
redis_client = redis.from_url("redis://localhost:6379")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your frontend URL
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Periodically send the latest count from Redis
            count = await redis_client.get("total_clicks")
            await websocket.send_text(str(count.decode() if count else 0))
            await asyncio.sleep(0.1) # 100ms updates
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.on_event("startup")
async def startup_event():
    global producer
    producer = AIOKafkaProducer(bootstrap_servers=KAFKA_INSTANCE)
    await producer.start()

@app.on_event("shutdown")
async def shutdown_event():
    await producer.stop()

@app.post("/press")
async def press_button():
    # 1. Create a simple payload
    payload = {"timestamp": asyncio.get_event_loop().time(), "increment": 1}
    
    # 2. Fire and Forget to Kafka
    # We don't 'await' the full network roundtrip here to keep it fast
    await producer.send_and_wait(TOPIC, json.dumps(payload).encode("utf-8"))
    
    return {"status": "accepted"}