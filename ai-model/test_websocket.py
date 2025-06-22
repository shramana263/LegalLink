import asyncio
import websockets
import json
from datetime import datetime

async def test_websocket_chat():
    """Test WebSocket chat functionality"""
    
    uri = "ws://localhost:8000/ws/chat/test_user_123"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connected to LegalLink AI ChatBot")
            
            # Listen for welcome message
            welcome_msg = await websocket.recv()
            print(f"📨 Received: {welcome_msg}")
            
            # Test messages
            test_messages = [
                {
                    "message": "Hello, I need legal help",
                    "type": "user"
                },
                {
                    "message": "I have a property dispute with my neighbor",
                    "type": "user"
                },
                {
                    "message": "I'm in Mumbai",
                    "type": "user" 
                },
                {
                    "message": "Find me advocates who can help",
                    "type": "user"
                }
            ]
            
            for msg in test_messages:
                print(f"\n📤 Sending: {msg['message']}")
                await websocket.send(json.dumps(msg))
                
                # Wait for response
                response = await websocket.recv()
                response_data = json.loads(response)
                print(f"📨 AI Response: {response_data.get('content', 'No content')[:100]}...")
                
                # Wait a bit before next message
                await asyncio.sleep(2)
                
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    print("🧪 Testing LegalLink AI ChatBot WebSocket...")
    asyncio.run(test_websocket_chat())
