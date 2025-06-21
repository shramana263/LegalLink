import json
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
import logging

from app.models import (
    IncomingMessage, OutgoingMessage, MessageType, ConversationStage,
    UserContext, UrgencyLevel, Specialization, AdvocateSearchRequest
)

logger = logging.getLogger(__name__)

class ChatHandler:
    """Handles chat message processing and response generation"""
    
    def __init__(self):
        # Store user sessions: user_id -> UserContext
        self.user_sessions: Dict[str, UserContext] = {}
        # Store conversation history: user_id -> List[messages]
        self.conversation_history: Dict[str, List[Dict]] = {}
        
    async def process_message(
        self, 
        user_id: str, 
        message_data: Dict[str, Any],
        express_client,
        indian_kanoon_client
    ) -> Dict[str, Any]:
        """Process incoming message and generate response"""
        
        try:
            # Parse incoming message
            message = message_data.get("message", "").strip()
            message_type = message_data.get("type", "user")
            
            if not message:
                return self._create_error_response("Please provide a message")
            
            # Get or create user context
            user_context = self._get_or_create_user_context(user_id)
            
            # Add user message to history
            self._add_to_history(user_id, {
                "type": "user",
                "content": message,
                "timestamp": self.get_timestamp()
            })
            
            # Process based on conversation stage and message content
            response = await self._generate_response(
                user_id, message, user_context, express_client, indian_kanoon_client
            )
            
            # Add assistant response to history
            self._add_to_history(user_id, {
                "type": "assistant", 
                "content": response["content"],
                "timestamp": response["timestamp"]
            })
            
            # Update user context
            self._update_user_context(user_id, message, response)
            
            return response
            
        except Exception as e:
            logger.error(f"Error processing message for user {user_id}: {str(e)}")
            return self._create_error_response("Sorry, I encountered an error. Please try again.")
    
    def _get_or_create_user_context(self, user_id: str) -> UserContext:
        """Get existing user context or create new one"""
        if user_id not in self.user_sessions:
            self.user_sessions[user_id] = UserContext(
                user_id=user_id,
                session_id=str(uuid.uuid4()),
                conversation_stage=ConversationStage.GREETING
            )
            self.conversation_history[user_id] = []
        
        return self.user_sessions[user_id]
    
    async def _generate_response(
        self,
        user_id: str,
        message: str,
        user_context: UserContext,
        express_client,
        indian_kanoon_client
    ) -> Dict[str, Any]:
        """Generate appropriate response based on context and message"""
        
        message_lower = message.lower()
        
        # Determine intent and generate response
        if user_context.conversation_stage == ConversationStage.GREETING:
            return await self._handle_greeting_stage(message, user_context)
        
        elif self._is_advocate_search_request(message_lower):
            return await self._handle_advocate_search(message, user_context, express_client)
        
        elif self._is_legal_query(message_lower):
            return await self._handle_legal_query(message, user_context, indian_kanoon_client)
        
        elif self._is_general_chat(message_lower):
            return await self._handle_general_chat(message, user_context)
        
        else:
            return await self._handle_information_gathering(message, user_context)
    
    async def _handle_greeting_stage(self, message: str, user_context: UserContext) -> Dict[str, Any]:
        """Handle initial greeting and setup"""
        
        greetings = ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"]
        message_lower = message.lower()
        
        if any(greeting in message_lower for greeting in greetings):
            response_content = """Hello! Welcome to LegalLink AI. I'm here to help you with your legal queries and connect you with qualified advocates.

I can assist you with:
• Legal advice and information
• Finding the right advocate for your case
• Understanding legal procedures
• Document guidance
• Court information

What legal matter can I help you with today?"""
        else:
            # Extract potential legal issue from first message
            user_context.case_description = message
            response_content = f"""Thank you for reaching out to LegalLink AI. I understand you have a legal concern.

Based on your message, I'd like to help you get the right assistance. Let me ask a few questions to better understand your situation:

1. What type of legal issue are you facing? (e.g., property dispute, family matter, criminal case, etc.)
2. How urgent is this matter?
3. What's your location? (This helps me find local advocates)

Please share more details so I can provide the best guidance."""
        
        # Update conversation stage
        user_context.conversation_stage = ConversationStage.INFORMATION_GATHERING
        
        return {
            "type": MessageType.ASSISTANT,
            "content": response_content,
            "timestamp": self.get_timestamp(),
            "session_id": user_context.session_id,
            "quick_actions": [
                {"id": "property_dispute", "title": "Property Dispute", "description": "Property-related legal issues"},
                {"id": "family_law", "title": "Family Law", "description": "Marriage, divorce, custody matters"},
                {"id": "criminal_law", "title": "Criminal Law", "description": "Criminal charges or defense"},
                {"id": "civil_law", "title": "Civil Law", "description": "Civil disputes and lawsuits"},
                {"id": "consumer_rights", "title": "Consumer Rights", "description": "Consumer protection issues"}
            ]
        }
    
    async def _handle_advocate_search(
        self, 
        message: str, 
        user_context: UserContext, 
        express_client
    ) -> Dict[str, Any]:
        """Handle advocate search requests"""
        
        # Extract search parameters from message and context
        search_request = self._extract_search_parameters(message, user_context)
        
        # Get advocates from Express backend
        advocates = await express_client.search_advocates(search_request)
        
        if advocates and advocates.get("success"):
            advocate_list = advocates.get("advocates", [])
            
            if advocate_list:
                response_content = f"""Great! I found {len(advocate_list)} qualified advocates who can help with your case.

Here are some top recommendations based on your requirements:"""
                
                # Format advocate recommendations
                for i, advocate in enumerate(advocate_list[:3], 1):
                    basic_info = advocate.get("basic_info", {})
                    ratings = advocate.get("ratings_summary", {})
                    
                    response_content += f"""

**{i}. {basic_info.get('name', 'N/A')}**
• Experience: {basic_info.get('experience_years', 'N/A')} years
• Location: {basic_info.get('location_city', 'N/A')}
• Rating: {ratings.get('average_rating', 'N/A')}/5 ({ratings.get('total_reviews', 0)} reviews)
• Specialization: {', '.join([spec.get('specialization', '') for spec in advocate.get('specializations', [])])}"""
                
                response_content += "\n\nWould you like me to help you schedule a consultation with any of these advocates?"
                
                user_context.conversation_stage = ConversationStage.ADVOCATE_RECOMMENDATION
                
                return {
                    "type": MessageType.ASSISTANT,
                    "content": response_content,
                    "timestamp": self.get_timestamp(),
                    "session_id": user_context.session_id,
                    "advocate_recommendations": advocate_list[:5],
                    "quick_actions": [
                        {"id": "schedule_consultation", "title": "Schedule Consultation", "description": "Book a meeting with an advocate"},
                        {"id": "more_advocates", "title": "Show More Advocates", "description": "See additional recommendations"},
                        {"id": "refine_search", "title": "Refine Search", "description": "Adjust search criteria"}
                    ]
                }
            else:
                return {
                    "type": MessageType.ASSISTANT,
                    "content": "I couldn't find advocates matching your exact criteria. Let me help you refine your search. Could you provide more details about your location or adjust your requirements?",
                    "timestamp": self.get_timestamp(),
                    "session_id": user_context.session_id
                }
        else:
            return {
                "type": MessageType.ASSISTANT,
                "content": "I'm having trouble accessing our advocate database right now. Please try again in a moment, or let me help you with legal information in the meantime.",
                "timestamp": self.get_timestamp(),
                "session_id": user_context.session_id
            }
    
    async def _handle_legal_query(
        self, 
        message: str, 
        user_context: UserContext, 
        indian_kanoon_client
    ) -> Dict[str, Any]:
        """Handle legal information queries"""
        
        # Get legal information from Indian Kanoon
        legal_info = await indian_kanoon_client.search_legal_documents(
            query=message,
            jurisdiction=user_context.location.state if user_context.location else None
        )
        
        if legal_info and legal_info.get("documents"):
            documents = legal_info.get("documents", [])[:3]  # Top 3 results
            
            response_content = f"""Based on your query, I found relevant legal information:

**Legal Guidance:**"""
            
            for i, doc in enumerate(documents, 1):
                response_content += f"""

**{i}. {doc.get('title', 'Legal Document')}**
{doc.get('summary', 'Summary not available')}
Court: {doc.get('court', 'N/A')}
Relevance: {doc.get('relevance_score', 0)}/100"""
            
            response_content += f"""

**Important Note:** This information is for educational purposes. For specific legal advice, I recommend consulting with a qualified advocate.

Would you like me to help you find advocates who specialize in this area?"""
            
            return {
                "type": MessageType.ASSISTANT,
                "content": response_content,
                "timestamp": self.get_timestamp(),
                "session_id": user_context.session_id,
                "quick_actions": [
                    {"id": "find_advocate", "title": "Find Advocate", "description": "Get specialist legal help"},
                    {"id": "more_info", "title": "More Information", "description": "Get additional legal details"},
                    {"id": "related_cases", "title": "Similar Cases", "description": "See related case studies"}
                ]
            }
        else:
            return {
                "type": MessageType.ASSISTANT,
                "content": """I understand you're looking for legal information. While I'm working on getting specific details for your query, I can help you in other ways:

• Connect you with qualified advocates who specialize in your area of concern
• Provide general guidance on legal procedures
• Help you understand your rights and options

What would be most helpful for you right now?""",
                "timestamp": self.get_timestamp(),
                "session_id": user_context.session_id
            }
    
    async def _handle_information_gathering(self, message: str, user_context: UserContext) -> Dict[str, Any]:
        """Handle information gathering stage"""
        
        # Extract information from message
        self._extract_user_information(message, user_context)
        
        # Determine what information is still needed
        missing_info = self._get_missing_information(user_context)
        
        if missing_info:
            response_content = f"""Thank you for the information. To help you better, I need a few more details:

{missing_info}

This will help me provide more accurate guidance and connect you with the right advocate."""
            
            return {
                "type": MessageType.ASSISTANT,
                "content": response_content,
                "timestamp": self.get_timestamp(),
                "session_id": user_context.session_id
            }
        else:
            # All information gathered, move to guidance
            user_context.conversation_stage = ConversationStage.LEGAL_GUIDANCE
            
            return {
                "type": MessageType.ASSISTANT,
                "content": f"""Perfect! I now have a good understanding of your situation:

• **Legal Issue:** {user_context.legal_issue_type or 'General legal matter'}
• **Urgency:** {user_context.urgency_level.value}
• **Location:** {user_context.location.city if user_context.location else 'Not specified'}

Now I can help you in two ways:
1. **Find Qualified Advocates** - I can search for specialists in your area
2. **Provide Legal Information** - I can research relevant laws and procedures

What would you prefer to do first?""",
                "timestamp": self.get_timestamp(),
                "session_id": user_context.session_id,
                "quick_actions": [
                    {"id": "find_advocates", "title": "Find Advocates", "description": "Search for legal professionals"},
                    {"id": "legal_info", "title": "Legal Information", "description": "Get relevant legal guidance"},
                    {"id": "both", "title": "Both", "description": "Get information and advocate recommendations"}
                ]
            }
    
    async def _handle_general_chat(self, message: str, user_context: UserContext) -> Dict[str, Any]:
        """Handle general chat and small talk"""
        
        responses = {
            "thank": "You're welcome! I'm here to help with your legal needs.",
            "help": "I can help you with legal queries, finding advocates, and understanding legal procedures. What specific legal matter do you need assistance with?",
            "how are you": "I'm doing well and ready to help with your legal questions! How can I assist you today?",
            "what can you do": """I can help you with:
• Finding qualified advocates in your area
• Providing legal information and guidance  
• Explaining legal procedures and rights
• Helping with document requirements
• Connecting you with legal professionals

What legal matter would you like help with?"""
        }
        
        message_lower = message.lower()
        
        for key, response in responses.items():
            if key in message_lower:
                return {
                    "type": MessageType.ASSISTANT,
                    "content": response,
                    "timestamp": self.get_timestamp(),
                    "session_id": user_context.session_id
                }
        
        # Default response for unrecognized general chat
        return {
            "type": MessageType.ASSISTANT,
            "content": "I'm here to help with your legal needs. Could you tell me about any legal matter or question you have?",
            "timestamp": self.get_timestamp(),
            "session_id": user_context.session_id
        }
    
    def _is_advocate_search_request(self, message: str) -> bool:
        """Check if message is requesting advocate search"""
        search_keywords = [
            "find advocate", "find lawyer", "need advocate", "need lawyer",
            "search advocate", "recommend advocate", "looking for advocate",
            "advocate near me", "lawyer near me", "legal help"
        ]
        return any(keyword in message for keyword in search_keywords)
    
    def _is_legal_query(self, message: str) -> bool:
        """Check if message is asking for legal information"""
        legal_keywords = [
            "what is", "explain", "legal procedure", "my rights",
            "law about", "legal", "court", "case", "section",
            "act", "rule", "regulation", "procedure"
        ]
        return any(keyword in message for keyword in legal_keywords)
    
    def _is_general_chat(self, message: str) -> bool:
        """Check if message is general chat/small talk"""
        chat_keywords = [
            "thank", "thanks", "help", "how are you", "hello", "hi",
            "what can you do", "what do you do", "who are you"
        ]
        return any(keyword in message for keyword in chat_keywords)
    
    def _extract_search_parameters(self, message: str, user_context: UserContext) -> AdvocateSearchRequest:
        """Extract search parameters from message and context"""
        
        # This is a simplified extraction - in a real implementation,
        # you'd use NLP to extract entities and parameters
        
        return AdvocateSearchRequest(
            specialization=user_context.specialization_needed,
            location=user_context.location,
            urgency_level=user_context.urgency_level,
            budget_range=user_context.budget_range,
            case_description=user_context.case_description
        )
    
    def _extract_user_information(self, message: str, user_context: UserContext):
        """Extract user information from message"""
        
        message_lower = message.lower()
        
        # Extract legal issue type
        if "property" in message_lower:
            user_context.legal_issue_type = "property_dispute"
            user_context.specialization_needed = Specialization.CIVIL
        elif "family" in message_lower or "divorce" in message_lower:
            user_context.legal_issue_type = "family_law" 
            user_context.specialization_needed = Specialization.FAMILY
        elif "criminal" in message_lower or "police" in message_lower:
            user_context.legal_issue_type = "criminal_law"
            user_context.specialization_needed = Specialization.CRIMINAL
        elif "consumer" in message_lower:
            user_context.legal_issue_type = "consumer_rights"
            user_context.specialization_needed = Specialization.OTHER
        
        # Extract urgency
        if "urgent" in message_lower or "emergency" in message_lower:
            user_context.urgency_level = UrgencyLevel.HIGH
        elif "soon" in message_lower:
            user_context.urgency_level = UrgencyLevel.MEDIUM
        
        # Extract location (simplified)
        cities = ["mumbai", "delhi", "bangalore", "chennai", "kolkata", "hyderabad"]
        for city in cities:
            if city in message_lower:
                if not user_context.location:
                    from app.models.chat_models import UserLocation
                    user_context.location = UserLocation()
                user_context.location.city = city.title()
                break
    
    def _get_missing_information(self, user_context: UserContext) -> str:
        """Get list of missing required information"""
        
        missing = []
        
        if not user_context.legal_issue_type:
            missing.append("• What type of legal issue are you facing?")
        
        if not user_context.location or not user_context.location.city:
            missing.append("• What city/location are you in?")
        
        if user_context.urgency_level == UrgencyLevel.MEDIUM:
            missing.append("• How urgent is this matter? (Immediate, within a week, no rush)")
        
        return "\n".join(missing) if missing else ""
    
    def _add_to_history(self, user_id: str, message: Dict):
        """Add message to conversation history"""
        if user_id not in self.conversation_history:
            self.conversation_history[user_id] = []
        
        self.conversation_history[user_id].append(message)
        
        # Keep only last 50 messages to manage memory
        if len(self.conversation_history[user_id]) > 50:
            self.conversation_history[user_id] = self.conversation_history[user_id][-50:]
    
    def _update_user_context(self, user_id: str, user_message: str, response: Dict):
        """Update user context after processing message"""
        if user_id in self.user_sessions:
            self.user_sessions[user_id].updated_at = datetime.now()
    
    def _create_error_response(self, error_message: str) -> Dict[str, Any]:
        """Create error response"""
        return {
            "type": MessageType.ERROR,
            "content": error_message,
            "timestamp": self.get_timestamp(),
            "session_id": "error"
        }
    
    def get_timestamp(self) -> str:
        """Get current timestamp"""
        return datetime.now().isoformat()
    
    def get_user_context(self, user_id: str) -> Optional[UserContext]:
        """Get user context"""
        return self.user_sessions.get(user_id)
    
    def get_conversation_history(self, user_id: str) -> List[Dict]:
        """Get conversation history for user"""
        return self.conversation_history.get(user_id, [])
