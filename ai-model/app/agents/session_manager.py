"""
Session Management Layer - Interactive LegalLink AI
Following Technical Flow: Session & Context Management
"""
import asyncio
import json
import uuid
import redis
import jwt
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pymongo import MongoClient
from fastapi import WebSocket, HTTPException
from dataclasses import dataclass, asdict
import os
import logging

logger = logging.getLogger(__name__)

@dataclass
class UserSession:
    """User session data structure"""
    session_id: str
    user_id: str
    created_at: datetime
    last_activity: datetime
    conversation_state: Dict[str, Any]
    user_context: Dict[str, Any] 
    interaction_count: int = 0
    current_topic: Optional[str] = None
    query_history: List[Dict[str, Any]] = None
    clarification_needs: List[str] = None
    progress_tracking: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.query_history is None:
            self.query_history = []
        if self.clarification_needs is None:
            self.clarification_needs = []
        if self.progress_tracking is None:
            self.progress_tracking = {}

class SessionManager:
    """Manages WebSocket sessions with Redis/MongoDB persistence"""
    
    def __init__(self):
        self.redis_client = None
        self.mongo_client = None
        self.mongo_db = None
        self.sessions: Dict[str, UserSession] = {}
        self.websocket_connections: Dict[str, List[WebSocket]] = {}
        
        # Configuration
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        self.mongo_db_name = os.getenv("MONGO_DB_NAME", "legallink")
        self.session_timeout = int(os.getenv("SESSION_TIMEOUT", "3600"))  # 1 hour
        
    async def initialize(self):
        """Initialize Redis and MongoDB connections"""
        try:
            # Initialize Redis
            import redis.asyncio as aioredis
            self.redis_client = aioredis.from_url(self.redis_url)
            await self.redis_client.ping()
            logger.info("Redis connection established")
            
            # Initialize MongoDB
            self.mongo_client = MongoClient(self.mongo_url)
            self.mongo_db = self.mongo_client[self.mongo_db_name]
            logger.info("MongoDB connection established")
            
        except Exception as e:
            logger.warning(f"Persistence layer initialization failed: {e}")
            logger.info("Running in memory-only mode")
    
    async def create_session(self, user_id: str, websocket: WebSocket) -> UserSession:
        """Create a new user session"""
        session_id = str(uuid.uuid4())
        now = datetime.now()
        
        session = UserSession(
            session_id=session_id,
            user_id=user_id,
            created_at=now,
            last_activity=now,
            conversation_state={
                "stage": "greeting",
                "context": {},
                "flags": {}
            },
            user_context={
                "preferences": {},
                "location": {},
                "case_details": {}
            }
        )
        
        # Store in memory
        self.sessions[session_id] = session
        
        # Store WebSocket connection
        if user_id not in self.websocket_connections:
            self.websocket_connections[user_id] = []
        self.websocket_connections[user_id].append(websocket)
        
        # Persist to Redis/MongoDB
        await self._persist_session(session)
        
        logger.info(f"Created session {session_id} for user {user_id}")
        return session
    
    async def get_session(self, session_id: str) -> Optional[UserSession]:
        """Retrieve session by ID"""
        # Try memory first
        if session_id in self.sessions:
            return self.sessions[session_id]
        
        # Try Redis
        if self.redis_client:
            try:
                session_data = await self.redis_client.get(f"session:{session_id}")
                if session_data:
                    data = json.loads(session_data)
                    session = UserSession(**data)
                    self.sessions[session_id] = session
                    return session
            except Exception as e:
                logger.error(f"Redis session retrieval failed: {e}")
        
        # Try MongoDB
        if self.mongo_db:
            try:
                doc = self.mongo_db.sessions.find_one({"session_id": session_id})
                if doc:
                    doc.pop('_id', None)
                    session = UserSession(**doc)
                    self.sessions[session_id] = session
                    return session
            except Exception as e:
                logger.error(f"MongoDB session retrieval failed: {e}")
        
        return None
    
    async def update_session(self, session: UserSession):
        """Update session data"""
        session.last_activity = datetime.now()
        session.interaction_count += 1
        
        # Update memory
        self.sessions[session.session_id] = session
        
        # Persist changes
        await self._persist_session(session)
    
    async def delete_session(self, session_id: str):
        """Delete session"""
        # Remove from memory
        self.sessions.pop(session_id, None)
        
        # Remove from Redis
        if self.redis_client:
            try:
                await self.redis_client.delete(f"session:{session_id}")
            except Exception as e:
                logger.error(f"Redis session deletion failed: {e}")
        
        # Remove from MongoDB
        if self.mongo_db:
            try:
                self.mongo_db.sessions.delete_one({"session_id": session_id})
            except Exception as e:
                logger.error(f"MongoDB session deletion failed: {e}")
    
    async def add_websocket(self, user_id: str, websocket: WebSocket):
        """Add WebSocket connection for user"""
        if user_id not in self.websocket_connections:
            self.websocket_connections[user_id] = []
        self.websocket_connections[user_id].append(websocket)
    
    async def remove_websocket(self, user_id: str, websocket: WebSocket):
        """Remove WebSocket connection for user"""
        if user_id in self.websocket_connections:
            if websocket in self.websocket_connections[user_id]:
                self.websocket_connections[user_id].remove(websocket)
            if not self.websocket_connections[user_id]:
                del self.websocket_connections[user_id]
    
    async def send_to_user(self, user_id: str, message: Dict[str, Any]):
        """Send message to all user's WebSocket connections"""
        if user_id in self.websocket_connections:
            disconnected = []
            for websocket in self.websocket_connections[user_id]:
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Failed to send message to {user_id}: {e}")
                    disconnected.append(websocket)
            
            # Remove disconnected WebSockets
            for ws in disconnected:
                await self.remove_websocket(user_id, ws)
    
    async def cleanup_expired_sessions(self):
        """Clean up expired sessions"""
        now = datetime.now()
        expired_sessions = []
        
        for session_id, session in self.sessions.items():
            if (now - session.last_activity).seconds > self.session_timeout:
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            await self.delete_session(session_id)
            logger.info(f"Cleaned up expired session: {session_id}")
    
    async def _persist_session(self, session: UserSession):
        """Persist session to Redis and MongoDB"""
        session_data = asdict(session)
        
        # Convert datetime objects to ISO strings for JSON serialization
        session_data['created_at'] = session.created_at.isoformat()
        session_data['last_activity'] = session.last_activity.isoformat()
        
        # Store in Redis with TTL
        if self.redis_client:
            try:
                await self.redis_client.setex(
                    f"session:{session.session_id}",
                    self.session_timeout,
                    json.dumps(session_data)
                )
            except Exception as e:
                logger.error(f"Redis session persistence failed: {e}")
        
        # Store in MongoDB
        if self.mongo_db:
            try:
                self.mongo_db.sessions.replace_one(
                    {"session_id": session.session_id},
                    session_data,
                    upsert=True
                )
            except Exception as e:
                logger.error(f"MongoDB session persistence failed: {e}")

class AuthenticationService:
    """JWT-based authentication service"""
    
    def __init__(self):
        self.secret_key = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
        self.algorithm = "HS256"
        self.access_token_expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    def create_access_token(self, data: Dict[str, Any]) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        to_encode.update({"exp": expire})
        
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.PyJWTError:
            raise HTTPException(status_code=401, detail="Invalid token")
    
    def generate_user_id(self) -> str:
        """Generate auto user ID for public access"""
        return f"user_{uuid.uuid4().hex[:12]}"
