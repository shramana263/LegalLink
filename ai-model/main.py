from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import os
from dotenv import load_dotenv

from app.api.routes import api_router
from app.websocket.connection_manager import ConnectionManager
from app.websocket.chat_handler import ChatHandler
from app.services.express_client import ExpressClient
from app.services.indian_kanoon_client import IndianKanoonClient
from app.agents.conversation_orchestrator import ConversationOrchestrator
from app.utils import get_current_timestamp

# Load environment variables
load_dotenv()

# Global instances
connection_manager = ConnectionManager()
chat_handler = ChatHandler()
express_client = ExpressClient()
indian_kanoon_client = IndianKanoonClient()
conversation_orchestrator = ConversationOrchestrator()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    print("🚀 LegalLink AI ChatBot starting...")
    
    # Initialize services
    await express_client.initialize()
    await indian_kanoon_client.initialize()
    
    # Initialize conversation orchestrator with services
    await conversation_orchestrator.initialize(express_client, indian_kanoon_client)
    
    print("✅ LegalLink AI ChatBot is ready!")
    yield
    
    # Cleanup
    await express_client.close()
    await indian_kanoon_client.close()
    print("🛑 LegalLink AI ChatBot shutting down...")

# Create FastAPI app
app = FastAPI(
    title="LegalLink AI ChatBot",
    description="Interactive AI ChatBot for Legal Assistance",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")

# WebSocket endpoint for chat
@app.websocket("/ws/chat/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """Main WebSocket endpoint for chat communication using agentic system"""
    await connection_manager.connect(websocket, user_id)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            
            # Process through conversation orchestrator
            response = await conversation_orchestrator.process_user_message(
                user_id=user_id,
                message=data.get("message", ""),
                websocket=websocket,
                session_id=data.get("session_id")
            )
            
            # Send response back to client
            await connection_manager.send_personal_message(response, user_id)
            
    except WebSocketDisconnect:
        connection_manager.disconnect(user_id)
        print(f"User {user_id} disconnected from chat")
    except Exception as e:
        print(f"Error in WebSocket connection for user {user_id}: {str(e)}")
        await connection_manager.send_personal_message({
            "type": "error",
            "message": "An error occurred. Please try again.",
            "timestamp": get_current_timestamp()
        }, user_id)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "LegalLink AI ChatBot",
        "version": "1.0.0",
        "timestamp": chat_handler.get_timestamp()
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to LegalLink AI ChatBot API",
        "docs": "/docs",
        "health": "/health",
        "websocket": "/ws/chat/{user_id}"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=os.getenv("SERVER_HOST", "0.0.0.0"),
        port=int(os.getenv("SERVER_PORT", 8000)),
        reload=os.getenv("DEBUG", "true").lower() == "true",
        log_level="info"
    )
