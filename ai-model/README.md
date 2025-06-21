# LegalLink AI ChatBot 🏛️⚖️

Interactive AI-powered ChatBot for legal assistance, advocate matching, and legal query resolution. Built with FastAPI, WebSocket support, and seamless integration with Express.js backend.

## 🌟 Features

- **🤖 Interactive AI ChatBot**: Real-time conversational AI for legal assistance
- **⚖️ Advocate Matching**: Smart matching with verified advocates based on user requirements
- **🔍 Legal Research**: Integration with Indian Kanoon for legal case research
- **📱 Real-time Communication**: WebSocket-based chat with instant responses
- **🌐 Multi-language Support**: Hindi, English, and Bengali language support
- **📊 Smart Recommendations**: AI-powered advocate recommendations with performance metrics
- **🔐 Secure Sessions**: Session management and user context tracking
- **📈 Analytics**: Conversation analytics and user interaction tracking

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Frontend (Next.js)                  │
│              WebSocket Connection                   │
├─────────────────────────────────────────────────────┤
│               FastAPI AI ChatBot                   │
│          ┌─────────────┬─────────────────┐          │
│          │   WebSocket │   REST API      │          │
│          │   Handler   │   Routes        │          │
│          └─────────────┴─────────────────┘          │
├─────────────────────────────────────────────────────┤
│              Express.js Backend                     │
│          ┌─────────────┬─────────────────┐          │
│          │  Advocate   │   PostgreSQL    │          │
│          │  Database   │   (Prisma)      │          │
│          └─────────────┴─────────────────┘          │
├─────────────────────────────────────────────────────┤
│              External Services                      │
│          ┌─────────────┬─────────────────┐          │
│          │ Indian      │   AI Models     │          │
│          │ Kanoon API  │   (Future)      │          │
│          └─────────────┴─────────────────┘          │
└─────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** (Required)
- **Node.js 16+** (For Express backend)
- **PostgreSQL** (For advocate database)
- **Git** (For version control)

### 1. Automated Setup (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd LegalLink/ai-model

# Run automated setup
python start.py --setup

# Start the server
python start.py --run
```

### 2. Manual Setup

#### Step 1: Environment Setup

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Step 2: Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit configuration (see Configuration section below)
nano .env
```

#### Step 3: Start Services

```bash
# Start Express backend (in separate terminal)
cd ../backend
npm install
npm run dev

# Start AI ChatBot server
cd ../ai-model
python main.py
```

## ⚙️ Configuration

### Environment Variables (.env)

```env
# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
DEBUG=true

# Backend Integration
EXPRESS_BACKEND_URL=http://localhost:3000
EXPRESS_API_PREFIX=/api

# Indian Kanoon API Configuration
INDIAN_KANOON_API_URL=https://api.indiankanoon.org
INDIAN_KANOON_API_KEY=your_api_key_here

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# WebSocket Configuration
WS_MAX_CONNECTIONS=100

# Logging Configuration
LOG_LEVEL=INFO
LOG_FILE=logs/app.log

# AI Model Configuration (Future)
AI_MODEL_NAME=llama3
AI_MODEL_ENDPOINT=http://localhost:11434

# Session Configuration
SESSION_TIMEOUT_MINUTES=30
MAX_MESSAGE_HISTORY=100
```

## 📡 API Endpoints

### REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Root endpoint with service info |
| `GET` | `/health` | Health check endpoint |
| `POST` | `/api/v1/advocates/search` | Search for advocates |
| `GET` | `/api/v1/advocates/{id}` | Get advocate details |
| `POST` | `/api/v1/chat/context` | Save chat context |
| `GET` | `/api/v1/chat/history/{user_id}` | Get chat history |

### WebSocket

| Endpoint | Description |
|----------|-------------|
| `ws://localhost:8000/ws/chat/{user_id}` | Real-time chat connection |

#### WebSocket Message Format

**Client to Server:**
```json
{
  "type": "message",
  "content": "I need help with a property dispute",
  "timestamp": 1703123456789,
  "user_context": {
    "location": "Mumbai",
    "language": "english"
  }
}
```

**Server to Client:**
```json
{
  "type": "response",
  "content": "I understand you're facing a property dispute. Let me help you find the right legal assistance.",
  "timestamp": 1703123456789,
  "message_id": "msg_123",
  "suggestions": ["Search for advocates", "Learn about property laws"],
  "advocates": [...],
  "actions": [...]
}
```

## 🔧 Development

### Project Structure

```
ai-model/
├── app/
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py           # REST API routes
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py          # Pydantic models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── express_client.py   # Express backend client
│   │   └── indian_kanoon_client.py # Legal research client
│   ├── websocket/
│   │   ├── __init__.py
│   │   ├── connection_manager.py # WebSocket manager
│   │   └── chat_handler.py     # Chat logic
│   └── __init__.py
├── Database/
│   ├── indian_kanoon/          # Indian Kanoon integration
│   └── training_data/          # AI training data
├── logs/                       # Application logs
├── .env                        # Environment configuration
├── .env.example               # Environment template
├── .gitignore
├── main.py                     # FastAPI application
├── requirements.txt           # Python dependencies
├── start.py                   # Startup script
└── README.md                  # This file
```

### Adding New Features

1. **New API Endpoint:**
   ```python
   # app/api/routes.py
   @router.post("/new-endpoint")
   async def new_endpoint():
       return {"message": "New feature"}
   ```

2. **New WebSocket Handler:**
   ```python
   # app/websocket/chat_handler.py
   async def handle_new_message_type(self, data):
       # Process new message type
       return response
   ```

3. **New Service Integration:**
   ```python
   # app/services/new_service.py
   class NewService:
       async def process_request(self, data):
           # Service logic
           return result
   ```

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html
```

### Code Quality

```bash
# Format code
black app/ --line-length 88

# Lint code
flake8 app/ --max-line-length 88

# Type checking
mypy app/
```

## 🚀 Deployment

### Docker Deployment

```dockerfile
# Dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# Build and run
docker build -t legallink-ai .
docker run -p 8000:8000 --env-file .env legallink-ai
```

### Production Deployment

```bash
# Install production dependencies
pip install gunicorn

# Run with Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## 🔗 Integration

### Frontend Integration (Next.js)

```typescript
// WebSocket connection
const ws = new WebSocket('ws://localhost:8000/ws/chat/user123');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle AI response
  updateChatUI(data);
};

// Send message
const sendMessage = (message: string) => {
  ws.send(JSON.stringify({
    type: 'message',
    content: message,
    timestamp: Date.now()
  }));
};
```

### Express Backend Integration

The AI service automatically connects to your Express backend for:
- Advocate search and matching
- User authentication
- Appointment booking
- Profile management

Ensure your Express backend is running on `http://localhost:3000` or update the `EXPRESS_BACKEND_URL` in `.env`.

## 📊 Monitoring

### Health Checks

```bash
# Check service health
curl http://localhost:8000/health

# Check WebSocket connection
wscat -c ws://localhost:8000/ws/chat/test-user
```

### Logs

```bash
# View logs
tail -f logs/app.log

# Search logs
grep "ERROR" logs/app.log
```

### Metrics

The application provides basic metrics at `/api/v1/metrics`:
- Active WebSocket connections
- Message processing times
- API response times
- Error rates

## 🛠️ Troubleshooting

### Common Issues

1. **Port Already in Use:**
   ```bash
   # Kill process on port 8000
   lsof -ti:8000 | xargs kill -9
   ```

2. **Virtual Environment Issues:**
   ```bash
   # Recreate virtual environment
   rm -rf venv
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```

3. **WebSocket Connection Failed:**
   - Check if CORS origins are properly configured
   - Verify the WebSocket URL format
   - Check firewall settings

4. **Express Backend Not Accessible:**
   - Ensure Express server is running on correct port
   - Update `EXPRESS_BACKEND_URL` in `.env`
   - Check network connectivity

### Debug Mode

```bash
# Run in debug mode
DEBUG=true python main.py

# Enable verbose logging
LOG_LEVEL=DEBUG python main.py
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 style guidelines
- Add type hints to all functions
- Write comprehensive docstrings
- Add tests for new features
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **FastAPI** - Modern web framework for building APIs
- **Indian Kanoon** - Legal database and research platform
- **OpenAI/Ollama** - AI model integration (future)
- **Next.js** - Frontend framework integration

## 📞 Support

For support and questions:

- Create an issue on GitHub
- Contact the development team
- Check the [documentation](/docs)

---

**Made with ❤️ for legal accessibility in India**
