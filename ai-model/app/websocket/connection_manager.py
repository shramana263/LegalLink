from fastapi import WebSocket
from typing import Dict, List
import json
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages WebSocket connections for chat"""
    
    def __init__(self):
        # Store active connections: user_id -> list of websockets
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Store connection metadata
        self.connection_info: Dict[str, Dict] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        
        self.active_connections[user_id].append(websocket)
        
        # Store connection info
        self.connection_info[user_id] = {
            "connected_at": None,
            "last_activity": None,
            "message_count": 0
        }
        
        logger.info(f"User {user_id} connected. Total connections: {len(self.active_connections[user_id])}")
        
        # Send welcome message
        await self.send_personal_message({
            "type": "system",
            "content": "Welcome to LegalLink AI Chat! How can I help you with your legal queries today?",
            "timestamp": self._get_timestamp(),
            "session_id": user_id,
            "quick_actions": [
                {
                    "id": "civil_law",
                    "title": "Civil Law Query",
                    "description": "Ask about civil law matters"
                },
                {
                    "id": "criminal_law", 
                    "title": "Criminal Law Query",
                    "description": "Ask about criminal law matters"
                },
                {
                    "id": "property_dispute",
                    "title": "Property Dispute",
                    "description": "Get help with property-related issues"
                },
                {
                    "id": "family_law",
                    "title": "Family Law",
                    "description": "Ask about family law matters"
                }
            ]
        }, user_id)
    
    def disconnect(self, user_id: str, websocket: WebSocket = None):
        """Remove a WebSocket connection"""
        if user_id in self.active_connections:
            if websocket:
                # Remove specific websocket
                if websocket in self.active_connections[user_id]:
                    self.active_connections[user_id].remove(websocket)
            else:
                # Remove all connections for user
                self.active_connections[user_id] = []
            
            # Clean up if no connections left
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                if user_id in self.connection_info:
                    del self.connection_info[user_id]
        
        logger.info(f"User {user_id} disconnected")
    
    async def send_personal_message(self, message: dict, user_id: str):
        """Send a message to a specific user"""
        if user_id in self.active_connections:
            # Send to all active connections for this user
            disconnected_sockets = []
            
            for websocket in self.active_connections[user_id]:
                try:
                    await websocket.send_json(message)
                    
                    # Update activity info
                    if user_id in self.connection_info:
                        self.connection_info[user_id]["last_activity"] = self._get_timestamp()
                        self.connection_info[user_id]["message_count"] += 1
                        
                except Exception as e:
                    logger.error(f"Error sending message to {user_id}: {str(e)}")
                    disconnected_sockets.append(websocket)
            
            # Clean up disconnected sockets
            for socket in disconnected_sockets:
                self.disconnect(user_id, socket)
    
    async def broadcast_message(self, message: dict):
        """Broadcast a message to all connected users"""
        for user_id in list(self.active_connections.keys()):
            await self.send_personal_message(message, user_id)
    
    def get_active_users(self) -> List[str]:
        """Get list of currently active user IDs"""
        return list(self.active_connections.keys())
    
    def get_connection_count(self, user_id: str = None) -> int:
        """Get total connection count or for specific user"""
        if user_id:
            return len(self.active_connections.get(user_id, []))
        
        return sum(len(connections) for connections in self.active_connections.values())
    
    def get_user_info(self, user_id: str) -> Dict:
        """Get connection info for a specific user"""
        return self.connection_info.get(user_id, {})
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().isoformat()
