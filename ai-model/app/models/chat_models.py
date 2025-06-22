from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum

class MessageType(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    ERROR = "error"

class ConversationStage(str, Enum):
    GREETING = "greeting"
    INFORMATION_GATHERING = "information_gathering"
    LEGAL_GUIDANCE = "legal_guidance"
    ADVOCATE_RECOMMENDATION = "advocate_recommendation"
    APPOINTMENT_BOOKING = "appointment_booking"
    FOLLOW_UP = "follow_up"
    CLOSURE = "closure"

class UrgencyLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class Specialization(str, Enum):
    CRIMINAL = "CRIMINAL"
    CIVIL = "CIVIL"
    CORPORATE = "CORPORATE"
    FAMILY = "FAMILY"
    CYBER = "CYBER"
    INTELLECTUAL_PROPERTY = "INTELLECTUAL_PROPERTY"
    TAXATION = "TAXATION"
    LABOR = "LABOR"
    ENVIRONMENT = "ENVIRONMENT"
    HUMAN_RIGHTS = "HUMAN_RIGHTS"
    OTHER = "OTHER"

# Chat Models
class ChatMessage(BaseModel):
    id: str
    type: MessageType
    content: str
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None

class IncomingMessage(BaseModel):
    message: str
    user_id: str
    session_id: Optional[str] = None
    message_type: MessageType = MessageType.USER
    metadata: Optional[Dict[str, Any]] = None

class OutgoingMessage(BaseModel):
    type: MessageType
    content: str
    timestamp: datetime
    session_id: str
    metadata: Optional[Dict[str, Any]] = None
    quick_actions: Optional[List[Dict[str, Any]]] = None
    advocate_recommendations: Optional[List[Dict[str, Any]]] = None

# User Context Models
class UserLocation(BaseModel):
    city: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    coordinates: Optional[Dict[str, float]] = None

class UserContext(BaseModel):
    user_id: str
    session_id: str
    conversation_stage: ConversationStage = ConversationStage.GREETING
    legal_issue_type: Optional[str] = None
    specialization_needed: Optional[Specialization] = None
    urgency_level: UrgencyLevel = UrgencyLevel.MEDIUM
    location: Optional[UserLocation] = None
    language_preference: str = "english"
    budget_range: Optional[Dict[str, int]] = None
    case_description: Optional[str] = None
    previous_legal_experience: bool = False
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

# Advocate Search Models
class AdvocateSearchRequest(BaseModel):
    specialization: Optional[Specialization] = None
    location: Optional[UserLocation] = None
    urgency_level: UrgencyLevel = UrgencyLevel.MEDIUM
    budget_range: Optional[Dict[str, int]] = None
    language_preferences: List[str] = ["english"]
    availability_required: bool = True
    case_description: Optional[str] = None
    limit: int = 10

class AdvocateBasicInfo(BaseModel):
    advocate_id: str
    name: str
    image: Optional[str] = None
    registration_number: str
    experience_years: str
    location_city: Optional[str] = None
    jurisdiction_states: List[str] = []
    language_preferences: List[str] = []

class AdvocateRating(BaseModel):
    average_rating: float
    total_reviews: int
    recent_rating: Optional[float] = None
    rating_distribution: Dict[str, int] = {}

class AdvocateAvailability(BaseModel):
    immediate_consultation: bool = False
    next_available_slot: Optional[datetime] = None
    working_hours: List[int] = [10, 17]
    working_days: List[str] = ["MON", "TUE", "WED", "THU", "FRI"]
    response_time_avg: Optional[str] = None

class AdvocateFeeStructure(BaseModel):
    consultation: Optional[int] = None
    case_handling: Optional[int] = None
    court_appearance: Optional[int] = None
    document_review: Optional[int] = None

class AdvocateRecommendation(BaseModel):
    basic_info: AdvocateBasicInfo
    specializations: List[Dict[str, Any]] = []
    ratings_summary: AdvocateRating
    availability: AdvocateAvailability
    fee_structure: AdvocateFeeStructure
    ai_match_score: float = 0.0
    match_reasons: List[str] = []

# API Response Models
class APIResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)

class AdvocateSearchResponse(BaseModel):
    success: bool
    total_matches: int
    advocates: List[AdvocateRecommendation]
    search_metadata: Dict[str, Any] = {}
    timestamp: datetime = Field(default_factory=datetime.now)

# Indian Kanoon Models
class LegalQuery(BaseModel):
    query: str
    jurisdiction: Optional[str] = None
    case_type: Optional[str] = None
    date_range: Optional[Dict[str, str]] = None

class LegalDocument(BaseModel):
    title: str
    url: str
    summary: str
    relevance_score: float
    court: Optional[str] = None
    date: Optional[str] = None

class LegalKnowledgeResponse(BaseModel):
    query: str
    documents: List[LegalDocument]
    total_results: int
    search_time_ms: int
    timestamp: datetime = Field(default_factory=datetime.now)

# Session Models
class ChatSession(BaseModel):
    session_id: str
    user_id: str
    created_at: datetime
    last_activity: datetime
    message_count: int = 0
    user_context: UserContext
    conversation_history: List[ChatMessage] = []
    is_active: bool = True
