# MyButton - Distributed Real-Time Click Counter

Inspired by Instagram architecture to handle millions of likes per seconds, I built this project as an experiment to handle thousands of concurrent users with sub-second latency.

![Architecture Diagram](structure_diagram.png)

**Load testing result**

![Load testing](load_testing.png)

## 🏗️ Architecture Overview

This project demonstrates a production-grade distributed system using:

- **Frontend**: React + TypeScript + Vite with Framer Motion animations
- **Backend**: FastAPI (Python) with WebSocket support
- **Message Broker**: Apache Kafka for event streaming
- **Cache Layer**: Redis for ultra-fast read operations
- **Database**: PostgreSQL for persistent storage
- **Orchestration**: Docker Compose for local development

**Key Features:**
- **Sub-millisecond latency** for button clicks
- **Real-time updates** via WebSocket (100ms polling)
- **Event sourcing** pattern with Kafka
- **Horizontally scalable** architecture
- **Automatic persistence** (Redis → PostgreSQL every 60s)

## 📁 Project Structure

```
MyButton/
├── client/                    # React frontend
│   ├── components/
│   │   ├── PressButton.tsx   
│   │   └── CounterLabel.tsx  
│   ├── App.tsx
│   ├── constant.ts
│   └── package.json
│
├── server/                    # FastAPI backend
│   ├── main.py               # WebSocket server & REST API
│   ├── worker/
│   │   └── worker.py         # Kafka consumer & persistence worker
│   ├── locustfile.py         # Load testing configuration
│   ├── pyproject.toml
│   └── requirements.txt
│
├── init-db/                   # PostgreSQL initialization
│   ├── init_db.sql           # Schema definition
│   └── insert_data.sql       # Seed data
│
└── docker-compose.yml         # Infrastructure orchestration
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for frontend)
- Python 3.10+ (for backend)

### 1. Start Infrastructure

```bash
# Start Kafka, Zookeeper, Redis, and PostgreSQL
docker-compose up -d
```

Wait for all services to be healthy (~30 seconds).

### 2. Run Backend

```bash
cd server

# Install dependencies (using uv or pip)
pip install -r requirements.txt

# Start FastAPI server
uvicorn main:app --reload --port 8000

# In another terminal, start the worker
python worker/worker.py
```

### 3. Run Frontend

```bash
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser and start clicking!

## 🔧 Configuration

### Environment Variables

**Backend (server/main.py)**
```python
KAFKA_INSTANCE = "localhost:9092"  # Use 'broker:29092' in Docker
TOPIC = "user-clicks"
REDIS_URL = "redis://localhost:6379"
```

**Worker (server/worker/worker.py)**
```python
KAFKA_BOOTSTRAP = "localhost:9092"
REDIS_URL = "redis://localhost:6379"
POSTGRES_URI = "postgresql://user:password@localhost:5432/clicker_db"
```

**Frontend (client/constant.ts)**
```typescript
export const API_URL = "http://localhost:8000"
export const WS_URL = "ws://localhost:8000/ws"
```

## 📊 Data Flow

### Write Path (Button Click)
1. User clicks button in React app
2. Frontend sends `POST /press` to FastAPI
3. FastAPI publishes event to Kafka topic `user-clicks`
4. Returns immediately (`fire-and-forget` for low latency)
5. Worker consumes event from Kafka
6. Worker increments counter in Redis (`INCRBY`)
7. Every 60 seconds, worker persists to PostgreSQL

### Read Path (Real-time Updates)
1. Frontend maintains WebSocket connection to `/ws`
2. FastAPI reads count from Redis every 100ms
3. Sends updated count to all connected clients
4. Frontend displays updated count with smooth animations

## 🧪 Load Testing

The project includes Locust for performance testing:

```bash
cd server

# Start load test
locust -f locustfile.py --host=http://localhost:8000

# Open http://localhost:8089 to configure test parameters
```

**Typical Performance:**
- ✅ Handles 1000+ requests/second
- ✅ P95 latency < 50ms
- ✅ WebSocket updates in real-time across all clients

## 🛠️ Development

### Backend API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/press` | Record a button click |
| WS | `/ws` | WebSocket for real-time count updates |

### Database Schema

**global_stats** table:
```sql
CREATE TABLE global_stats (
    stat_name VARCHAR(50) PRIMARY KEY,
    stat_value BIGINT NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Message Format

**Kafka Event (user-clicks topic):**
```json
{
  "timestamp": 1234567890.123,
  "increment": 1
}
```

## 🐳 Docker Services

| Service | Port | Purpose |
|---------|------|---------|
| Kafka Broker | 9092, 29092 | Message queue |
| Zookeeper | 2181 | Kafka coordination |
| Redis | 6379 | Hot cache layer |
| PostgreSQL | 5432 | Persistent storage |

## 📈 Scalability Considerations

**Horizontal Scaling:**
- Multiple FastAPI instances (behind load balancer)
- Multiple Worker instances (Kafka consumer group)
- Redis Cluster for higher throughput
- PostgreSQL read replicas

**Optimizations:**
- Kafka partitioning for parallel processing
- Redis pipelining for batch operations
- Connection pooling (asyncpg, redis)
- Async I/O throughout the stack

## 🧹 Troubleshooting

**Worker not consuming messages:**
```bash
# Check Kafka topic exists
docker exec -it <kafka-container> kafka-topics --list --bootstrap-server localhost:9092

# Check consumer lag
docker exec -it <kafka-container> kafka-consumer-groups --describe --group click-processors --bootstrap-server localhost:9092
```

**Redis connection issues:**
```bash
# Test Redis connection
redis-cli -h localhost -p 6379 ping
# Should return: PONG

# Check current count
redis-cli GET total_clicks
```

**PostgreSQL connection issues:**
```bash
# Connect to database
docker exec -it <postgres-container> psql -U user -d clicker_db

# Check table contents
SELECT * FROM global_stats;
```

## 📚 Technology Stack

### Backend
- **FastAPI** - Modern async web framework
- **aiokafka** - Async Kafka client
- **asyncpg** - Fast PostgreSQL driver
- **redis-py** - Redis client with async support
- **uvicorn** - ASGI server

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Framer Motion** - Animations

### Infrastructure
- **Apache Kafka** - Event streaming platform
- **Redis** - In-memory cache
- **PostgreSQL** - Relational database
- **Docker Compose** - Container orchestration

## 📄 License

This project is licensed under the MIT License.

## 🎯 Future Enhancements

- [ ] Add analytics dashboard
- [ ] Deploy to production (Kubernetes)
- [ ] Add CI/CD pipeline
- [ ] Implement rate limiting
- [ ] Add distributed tracing (OpenTelemetry)
- [ ] Metrics export (Prometheus)

---

