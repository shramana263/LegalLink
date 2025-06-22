from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import logging

from app.models import (
    AdvocateSearchRequest, AdvocateSearchResponse, APIResponse,
    LegalQuery, LegalKnowledgeResponse, UserContext
)
from app.services import ExpressClient, IndianKanoonClient
from app.websocket.chat_handler import ChatHandler
from app.agents.conversation_orchestrator import ConversationOrchestrator

# Additional models for chat
class ChatMessage(BaseModel):
    message: str
    userId: Optional[str] = None
    sessionId: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    response: str
    type: str = "assistant"
    timestamp: str
    sessionId: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    quickActions: Optional[List[Dict[str, str]]] = None
    advocateRecommendations: Optional[List[Dict[str, Any]]] = None

logger = logging.getLogger(__name__)

# Create router
api_router = APIRouter()

# Dependency injection for services
async def get_express_client() -> ExpressClient:
    client = ExpressClient()
    await client.initialize()
    return client

async def get_indian_kanoon_client() -> IndianKanoonClient:
    client = IndianKanoonClient()
    await client.initialize()
    return client

@api_router.post("/advocates/search", response_model=AdvocateSearchResponse)
async def search_advocates(
    search_request: AdvocateSearchRequest,
    express_client: ExpressClient = Depends(get_express_client)
):
    """
    Search for advocates based on criteria
    """
    try:
        result = await express_client.search_advocates(search_request)
        
        if result.get("success"):
            return AdvocateSearchResponse(
                success=True,
                total_matches=result.get("total_matches", 0),
                advocates=result.get("advocates", []),
                search_metadata=result.get("search_metadata", {})
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Failed to search advocates")
            )
            
    except Exception as e:
        logger.error(f"Error in advocate search: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/advocates/{advocate_id}")
async def get_advocate_details(
    advocate_id: str,
    express_client: ExpressClient = Depends(get_express_client)
):
    """
    Get detailed information about a specific advocate
    """
    try:
        result = await express_client.get_advocate_details(advocate_id)
        
        if result.get("success"):
            return APIResponse(
                success=True,
                data=result.get("advocate"),
                message="Advocate details retrieved successfully"
            )
        else:
            raise HTTPException(
                status_code=404,
                detail="Advocate not found"
            )
            
    except Exception as e:
        logger.error(f"Error getting advocate details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/advocates/{advocate_id}/availability")
async def get_advocate_availability(
    advocate_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    express_client: ExpressClient = Depends(get_express_client)
):
    """
    Get advocate availability for scheduling
    """
    try:
        date_range = {}
        if start_date:
            date_range["start_date"] = start_date
        if end_date:
            date_range["end_date"] = end_date
            
        result = await express_client.get_advocate_availability(advocate_id, date_range)
        
        if result.get("success"):
            return APIResponse(
                success=True,
                data=result.get("availability"),
                message="Availability retrieved successfully"
            )
        else:
            raise HTTPException(
                status_code=404,
                detail="Availability not found"
            )
            
    except Exception as e:
        logger.error(f"Error getting advocate availability: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/appointments/book")
async def book_appointment(
    booking_data: Dict[str, Any],
    express_client: ExpressClient = Depends(get_express_client)
):
    """
    Book an appointment with an advocate
    """
    try:
        result = await express_client.book_appointment(booking_data)
        
        if result.get("success"):
            return APIResponse(
                success=True,
                data=result.get("appointment"),
                message="Appointment booked successfully"
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Failed to book appointment")
            )
            
    except Exception as e:
        logger.error(f"Error booking appointment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/appointments/user/{user_id}")
async def get_user_appointments(
    user_id: str,
    express_client: ExpressClient = Depends(get_express_client)
):
    """
    Get appointments for a specific user
    """
    try:
        result = await express_client.get_user_appointments(user_id)
        
        if result.get("success"):
            return APIResponse(
                success=True,
                data=result.get("appointments"),
                message="Appointments retrieved successfully"
            )
        else:
            raise HTTPException(
                status_code=404,
                detail="No appointments found"
            )
            
    except Exception as e:
        logger.error(f"Error getting user appointments: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/legal/search", response_model=LegalKnowledgeResponse)
async def search_legal_documents(
    legal_query: LegalQuery,
    indian_kanoon_client: IndianKanoonClient = Depends(get_indian_kanoon_client)
):
    """
    Search for legal documents and case laws
    """
    try:
        result = await indian_kanoon_client.search_legal_documents(
            query=legal_query.query,
            jurisdiction=legal_query.jurisdiction,
            case_type=legal_query.case_type
        )
        
        if result.get("success"):
            return LegalKnowledgeResponse(
                query=result.get("query", ""),
                documents=result.get("documents", []),
                total_results=result.get("total_results", 0),
                search_time_ms=result.get("search_time_ms", 0)
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Failed to search legal documents")
            )
            
    except Exception as e:
        logger.error(f"Error searching legal documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/legal/case/{case_id}")
async def get_case_details(
    case_id: str,
    indian_kanoon_client: IndianKanoonClient = Depends(get_indian_kanoon_client)
):
    """
    Get detailed information about a specific legal case
    """
    try:
        result = await indian_kanoon_client.get_case_details(case_id)
        
        if result.get("success"):
            return APIResponse(
                success=True,
                data=result.get("case"),
                message="Case details retrieved successfully"
            )
        else:
            raise HTTPException(
                status_code=404,
                detail="Case not found"
            )
            
    except Exception as e:
        logger.error(f"Error getting case details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/legal/provisions/{act_name}")
async def get_legal_provisions(
    act_name: str,
    section: Optional[str] = None,
    indian_kanoon_client: IndianKanoonClient = Depends(get_indian_kanoon_client)
):
    """
    Get legal provisions from specific acts
    """
    try:
        result = await indian_kanoon_client.get_legal_provisions(act_name, section)
        
        if result.get("success"):
            return APIResponse(
                success=True,
                data={
                    "act_name": result.get("act_name"),
                    "section": result.get("section"),
                    "provisions": result.get("provisions", [])
                },
                message="Legal provisions retrieved successfully"
            )
        else:
            raise HTTPException(
                status_code=404,
                detail="Legal provisions not found"
            )
            
    except Exception as e:
        logger.error(f"Error getting legal provisions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/health/express")
async def check_express_health(
    express_client: ExpressClient = Depends(get_express_client)
):
    """
    Check Express backend health
    """
    try:
        result = await express_client.health_check()
        return APIResponse(
            success=result.get("success", False),
            data={"status": result.get("status", "unknown")},
            message="Express backend health check completed"
        )
    except Exception as e:
        logger.error(f"Error checking Express health: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/health/indian-kanoon")
async def check_indian_kanoon_health(
    indian_kanoon_client: IndianKanoonClient = Depends(get_indian_kanoon_client)
):
    """
    Check Indian Kanoon service health
    """
    try:
        result = await indian_kanoon_client.health_check()
        return APIResponse(
            success=result.get("success", False),
            data={"status": result.get("status", "unknown")},
            message="Indian Kanoon service health check completed"
        )
    except Exception as e:
        logger.error(f"Error checking Indian Kanoon health: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    chat_message: ChatMessage,
    express_client: ExpressClient = Depends(get_express_client),
    indian_kanoon_client: IndianKanoonClient = Depends(get_indian_kanoon_client)
):
    """
    Process chat message through AI handler
    """
    try:
        chat_handler = ChatHandler()
        user_id = chat_message.userId or f"api_user_{hash(chat_message.message) % 10000}"
        
        # Create message data format expected by chat handler
        message_data = {
            "message": chat_message.message,
            "type": "user",
            "context": chat_message.context
        }
        
        # Process message
        response = await chat_handler.process_message(
            user_id=user_id,
            message_data=message_data,
            express_client=express_client,
            indian_kanoon_client=indian_kanoon_client
        )
        
        return ChatResponse(
            response=response.get("content", "Sorry, I couldn't process your request."),
            type=response.get("type", "assistant"),
            timestamp=response.get("timestamp", chat_handler.get_timestamp()),
            context=response.get("context")
        )
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process chat message: {str(e)}"
        )

@api_router.post("/agentic-chat", response_model=ChatResponse)
async def agentic_chat_endpoint(
    chat_message: ChatMessage,
    express_client: ExpressClient = Depends(get_express_client),
    indian_kanoon_client: IndianKanoonClient = Depends(get_indian_kanoon_client)
):
    """
    Process agentic chat message through orchestrator
    """
    try:
        global conversation_orchestrator
        
        # Ensure session ID is present
        if not chat_message.sessionId:
            raise HTTPException(status_code=400, detail="Session ID is required")
        
        # Process message through orchestrator
        response = await conversation_orchestrator.handle_message(
            session_id=chat_message.sessionId,
            user_id=chat_message.userId,
            message=chat_message.message,
            context=chat_message.context,
            express_client=express_client,
            indian_kanoon_client=indian_kanoon_client
        )
        
        return ChatResponse(
            response=response.get("content", "Sorry, I couldn't process your request."),
            type=response.get("type", "assistant"),
            timestamp=response.get("timestamp", conversation_orchestrator.get_timestamp()),
            sessionId=chat_message.sessionId,
            metadata=response.get("metadata"),
            quickActions=response.get("quick_actions"),
            advocateRecommendations=response.get("advocate_recommendations")
        )
        
    except Exception as e:
        logger.error(f"Error in agentic chat endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process agentic chat message: {str(e)}"
        )

@api_router.post("/chat/agentic", response_model=ChatResponse)
async def agentic_chat(
    chat_message: ChatMessage,
    express_client: ExpressClient = Depends(get_express_client),
    indian_kanoon_client: IndianKanoonClient = Depends(get_indian_kanoon_client)
):
    """
    Agentic chat endpoint following the technical implementation
    Uses the conversation orchestrator with agent graph
    """
    try:
        # Initialize orchestrator with services if not already done
        if not conversation_orchestrator.express_client:
            await conversation_orchestrator.initialize(express_client, indian_kanoon_client)
        
        # Process message through agentic system
        response = await conversation_orchestrator.process_user_message(
            user_id=chat_message.userId or "api_user",
            message=chat_message.message,
            session_id=chat_message.sessionId
        )
        
        # Transform response to match API schema
        return ChatResponse(
            response=response.get("content", ""),
            type=response.get("type", "assistant"),
            timestamp=response.get("timestamp", ""),
            sessionId=response.get("session_id"),
            metadata=response.get("metadata"),
            quickActions=response.get("quick_actions"),
            advocateRecommendations=response.get("advocate_recommendations")
        )
        
    except Exception as e:
        logger.error(f"Error in agentic chat: {e}")
        from app.utils import get_current_timestamp
        return ChatResponse(
            response="I apologize, but I encountered an error processing your request. Please try again.",
            type="error",
            timestamp=get_current_timestamp(),
            sessionId=chat_message.sessionId
        )

@api_router.post("/chat/feedback")
async def submit_chat_feedback(
    session_id: str,
    feedback_type: str,
    feedback_data: Dict[str, Any]
):
    """Submit feedback for chat conversation"""
    try:
        result = await conversation_orchestrator.handle_user_feedback(
            session_id=session_id,
            feedback_type=feedback_type,
            feedback_data=feedback_data
        )
        return result
    except Exception as e:
        logger.error(f"Error submitting feedback: {e}")
        return {"error": "Failed to submit feedback"}

@api_router.get("/chat/session/{session_id}")
async def get_chat_session(session_id: str):
    """Get chat session information"""
    try:
        session = await conversation_orchestrator.session_manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {
            "session_id": session.session_id,
            "user_id": session.user_id,
            "created_at": session.created_at.isoformat(),
            "last_activity": session.last_activity.isoformat(),
            "interaction_count": session.interaction_count,
            "conversation_stage": session.conversation_state.get("current_stage"),
            "progress": session.conversation_state.get("progress", {})
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting session: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.get("/services")
async def get_services():
    """
    Get available AI services
    """
    return {
        "services": [
            {
                "name": "Legal Chat Assistant",
                "description": "Interactive AI assistant for legal queries",
                "endpoint": "/chat",
                "websocket": "/ws/chat/{user_id}"
            },
            {
                "name": "Advocate Search",
                "description": "Search for qualified advocates",
                "endpoint": "/advocates/search"
            },
            {
                "name": "Legal Knowledge Base",
                "description": "Access to legal case database",
                "endpoint": "/legal/query"
            }
        ],
        "version": "1.0.0",
        "status": "active"
    }
