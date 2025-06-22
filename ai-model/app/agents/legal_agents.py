"""
Legal Agents - Interactive LegalLink AI Agentic System
Following Technical Flow: Agentic Conversation System (LangGraph)
"""
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass
from datetime import datetime
import logging
import re
import json

from app.models import (
    MessageType, ConversationStage, UrgencyLevel, Specialization,
    UserContext, AdvocateSearchRequest
)
from app.utils import (
    classify_legal_domain, detect_urgency_level, extract_location,
    extract_keywords, get_current_timestamp
)

logger = logging.getLogger(__name__)

@dataclass
class AgentState:
    """Shared state between agents"""
    session_id: str
    user_id: str
    current_message: str
    conversation_history: List[Dict[str, Any]]
    user_context: UserContext
    conversation_stage: ConversationStage
    extracted_entities: Dict[str, Any]
    intent: str
    confidence: float
    urgency_level: UrgencyLevel
    legal_domain: str
    next_action: str
    response_data: Dict[str, Any]
    memory: Dict[str, Any]
    
class BaseAgent(ABC):
    """Base class for all legal agents"""
    
    def __init__(self, name: str):
        self.name = name
        self.logger = logging.getLogger(f"{__name__}.{name}")
    
    @abstractmethod
    async def process(self, state: AgentState) -> AgentState:
        """Process the agent state and return updated state"""
        pass
    
    def log_processing(self, state: AgentState, action: str):
        """Log agent processing"""
        self.logger.info(f"Agent {self.name} - {action} for session {state.session_id}")

class DialogueAgent(BaseAgent):
    """Manages conversation flow and dialogue state"""
    
    def __init__(self):
        super().__init__("DialogueAgent")
        self.conversation_patterns = {
            "greeting": [
                "hello", "hi", "hey", "good morning", "good afternoon", 
                "good evening", "namaste", "namaskar"
            ],
            "legal_help": [
                "legal", "law", "lawyer", "advocate", "court", "case", 
                "legal advice", "help", "problem", "issue"
            ],
            "emergency": [
                "urgent", "emergency", "immediate", "help", "crisis",
                "police", "arrest", "bail", "threat"
            ]
        }
    
    async def process(self, state: AgentState) -> AgentState:
        """Process dialogue management"""
        self.log_processing(state, "Processing dialogue management")
        
        # Determine conversation stage
        state.conversation_stage = self._determine_stage(state)
        
        # Extract dialogue intent
        state.intent = self._extract_intent(state.current_message)
        
        # Set confidence based on pattern matching
        state.confidence = self._calculate_confidence(state.current_message, state.intent)
        
        # Determine next action based on stage and intent
        state.next_action = self._determine_next_action(state)
        
        return state
    
    def _determine_stage(self, state: AgentState) -> ConversationStage:
        """Determine current conversation stage"""
        if not state.conversation_history:
            return ConversationStage.GREETING
        
        # Check if user context has basic information
        if not state.user_context.legal_issue:
            return ConversationStage.INFORMATION_GATHERING
        
        # Check if legal guidance has been provided
        if "legal_guidance_provided" not in state.memory:
            return ConversationStage.LEGAL_GUIDANCE
        
        # Check if advocate search was requested
        if any("advocate" in msg.get("content", "").lower() for msg in state.conversation_history[-3:]):
            return ConversationStage.ADVOCATE_RECOMMENDATION
        
        return ConversationStage.FOLLOW_UP
    
    def _extract_intent(self, message: str) -> str:
        """Extract user intent from message"""
        message_lower = message.lower()
        
        # Check for specific patterns
        for intent, patterns in self.conversation_patterns.items():
            if any(pattern in message_lower for pattern in patterns):
                return intent
        
        # Default intent based on message content
        if any(word in message_lower for word in ["find", "search", "recommend", "suggest"]):
            return "search_request"
        elif "?" in message:
            return "question"
        else:
            return "statement"
    
    def _calculate_confidence(self, message: str, intent: str) -> float:
        """Calculate confidence score for intent classification"""
        if intent in self.conversation_patterns:
            patterns = self.conversation_patterns[intent]
            matches = sum(1 for pattern in patterns if pattern in message.lower())
            return min(matches / len(patterns) * 2, 1.0)  # Cap at 1.0
        return 0.5  # Default confidence
    
    def _determine_next_action(self, state: AgentState) -> str:
        """Determine next action based on state"""
        if state.conversation_stage == ConversationStage.GREETING:
            return "provide_greeting"
        elif state.conversation_stage == ConversationStage.INFORMATION_GATHERING:
            return "gather_information"
        elif state.conversation_stage == ConversationStage.LEGAL_GUIDANCE:
            return "provide_legal_guidance"
        elif state.conversation_stage == ConversationStage.ADVOCATE_RECOMMENDATION:
            return "recommend_advocates"
        else:
            return "continue_conversation"

class ClassificationAgent(BaseAgent):
    """Classifies legal queries and extracts entities"""
    
    def __init__(self):
        super().__init__("ClassificationAgent")
    
    async def process(self, state: AgentState) -> AgentState:
        """Process legal classification"""
        self.log_processing(state, "Processing legal classification")
        
        # Classify legal domain
        state.legal_domain = classify_legal_domain(state.current_message)
        
        # Detect urgency level
        state.urgency_level = UrgencyLevel(detect_urgency_level(state.current_message))
        
        # Extract entities
        state.extracted_entities = self._extract_entities(state.current_message)
        
        # Update user context with extracted information
        self._update_user_context(state)
        
        return state
    
    def _extract_entities(self, message: str) -> Dict[str, Any]:
        """Extract legal entities from message"""
        entities = {}
        
        # Extract location
        location = extract_location(message)
        if location:
            entities["location"] = location
        
        # Extract legal terms
        legal_terms = self._extract_legal_terms(message)
        if legal_terms:
            entities["legal_terms"] = legal_terms
        
        # Extract amounts/damages
        amounts = self._extract_amounts(message)
        if amounts:
            entities["amounts"] = amounts
        
        # Extract dates
        dates = self._extract_dates(message)
        if dates:
            entities["dates"] = dates
        
        return entities
    
    def _extract_legal_terms(self, text: str) -> List[str]:
        """Extract legal terms from text"""
        legal_terms = [
            "contract", "agreement", "breach", "damages", "compensation",
            "lawsuit", "litigation", "settlement", "court", "judge",
            "property", "tenant", "landlord", "rent", "lease",
            "divorce", "custody", "alimony", "marriage", "separation",
            "criminal", "theft", "assault", "bail", "arrest"
        ]
        
        found_terms = []
        text_lower = text.lower()
        for term in legal_terms:
            if term in text_lower:
                found_terms.append(term)
        
        return found_terms
    
    def _extract_amounts(self, text: str) -> List[Dict[str, Any]]:
        """Extract monetary amounts from text"""
        # Pattern for Indian currency (₹, Rs, INR)
        pattern = r'(?:₹|Rs\.?|INR)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)|(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:₹|Rs\.?|INR|rupees?)'
        
        amounts = []
        matches = re.finditer(pattern, text, re.IGNORECASE)
        
        for match in matches:
            amount_str = match.group(1) or match.group(2)
            if amount_str:
                # Clean amount string
                clean_amount = amount_str.replace(',', '')
                try:
                    amount_value = float(clean_amount)
                    amounts.append({
                        "value": amount_value,
                        "currency": "INR",
                        "text": match.group(0)
                    })
                except ValueError:
                    continue
        
        return amounts
    
    def _extract_dates(self, text: str) -> List[str]:
        """Extract dates from text"""
        # Simple date pattern matching
        date_patterns = [
            r'\d{1,2}[/-]\d{1,2}[/-]\d{4}',
            r'\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}',
            r'(last|next|this)\s+(week|month|year)',
            r'(yesterday|today|tomorrow)'
        ]
        
        dates = []
        for pattern in date_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            dates.extend(matches)
        
        return [str(date) for date in dates if date]
    
    def _update_user_context(self, state: AgentState):
        """Update user context with extracted entities"""
        entities = state.extracted_entities
        
        if "location" in entities:
            if not state.user_context.location:
                state.user_context.location = {}
            state.user_context.location.update(entities["location"])
        
        if "legal_terms" in entities:
            if not state.user_context.legal_issue:
                state.user_context.legal_issue = " ".join(entities["legal_terms"])
        
        if "amounts" in entities:
            state.user_context.budget_range = {
                "min": 0,
                "max": max(amt["value"] for amt in entities["amounts"]) if entities["amounts"] else 50000
            }

class ClarificationAgent(BaseAgent):
    """Handles clarification requests and missing information"""
    
    def __init__(self):
        super().__init__("ClarificationAgent")
        self.required_fields = {
            "location": "I need to know your location to provide relevant legal guidance and find local advocates.",
            "legal_issue": "Could you please describe your legal issue in more detail?",
            "urgency": "How urgent is this matter? Is this an emergency situation?",
            "budget": "Do you have a budget range in mind for legal consultation?"
        }
    
    async def process(self, state: AgentState) -> AgentState:
        """Process clarification needs"""
        self.log_processing(state, "Processing clarification needs")
        
        # Identify missing information
        missing_info = self._identify_missing_info(state.user_context)
        
        # Generate clarification questions
        if missing_info:
            clarification_questions = self._generate_clarification_questions(missing_info)
            state.response_data["clarification_needed"] = True
            state.response_data["questions"] = clarification_questions
            state.next_action = "request_clarification"
        else:
            state.response_data["clarification_needed"] = False
            state.next_action = "proceed_with_guidance"
        
        return state
    
    def _identify_missing_info(self, user_context: UserContext) -> List[str]:
        """Identify missing required information"""
        missing = []
        
        if not user_context.location or not any(user_context.location.values()):
            missing.append("location")
        
        if not user_context.legal_issue:
            missing.append("legal_issue")
        
        if user_context.urgency_level == UrgencyLevel.LOW and "urgent" not in str(user_context.legal_issue).lower():
            missing.append("urgency")
        
        return missing
    
    def _generate_clarification_questions(self, missing_info: List[str]) -> List[Dict[str, str]]:
        """Generate clarification questions for missing information"""
        questions = []
        
        for field in missing_info:
            if field in self.required_fields:
                questions.append({
                    "field": field,
                    "question": self.required_fields[field],
                    "type": "text"
                })
        
        return questions

class LegalReasoningAgent(BaseAgent):
    """Provides legal reasoning and guidance"""
    
    def __init__(self):
        super().__init__("LegalReasoningAgent")
        self.legal_knowledge_base = {
            "PROPERTY": {
                "rent_disputes": "Under the Rent Control Act, tenants have specific rights regarding rent increases and eviction.",
                "property_purchase": "Property transactions require due diligence including title verification and registration.",
                "neighbor_disputes": "Property boundary disputes can be resolved through civil court or mediation."
            },
            "FAMILY": {
                "divorce": "Divorce proceedings can be filed under Hindu Marriage Act, Special Marriage Act, or personal laws.",
                "child_custody": "Child custody decisions are made based on the best interests of the child.",
                "domestic_violence": "Domestic Violence Act provides protection and relief to women and children."
            },
            "CONSUMER": {
                "product_defects": "Consumer Protection Act provides remedies for defective goods and services.",
                "service_complaints": "Consumer courts have jurisdiction over service-related complaints.",
                "refund_issues": "Consumers have right to refund for defective products or unsatisfactory services."
            }
        }
    
    async def process(self, state: AgentState) -> AgentState:
        """Process legal reasoning and guidance"""
        self.log_processing(state, "Processing legal reasoning")
        
        # Generate legal guidance
        guidance = self._generate_legal_guidance(state)
        state.response_data["legal_guidance"] = guidance
        
        # Identify relevant laws
        relevant_laws = self._identify_relevant_laws(state.legal_domain, state.current_message)
        state.response_data["relevant_laws"] = relevant_laws
        
        # Generate next steps
        next_steps = self._generate_next_steps(state)
        state.response_data["next_steps"] = next_steps
        
        # Mark legal guidance as provided
        state.memory["legal_guidance_provided"] = True
        
        return state
    
    def _generate_legal_guidance(self, state: AgentState) -> str:
        """Generate legal guidance based on user query"""
        domain = state.legal_domain.upper()
        
        if domain in self.legal_knowledge_base:
            # Try to find specific guidance
            knowledge = self.legal_knowledge_base[domain]
            
            # Match user issue with knowledge base
            user_issue = state.current_message.lower()
            for issue_type, guidance in knowledge.items():
                if any(keyword in user_issue for keyword in issue_type.split('_')):
                    return guidance
            
            # Return general guidance for the domain
            return f"For {domain.lower()} matters, it's important to understand your rights and legal options."
        
        return "I recommend consulting with a qualified advocate who can provide specific guidance for your situation."
    
    def _identify_relevant_laws(self, legal_domain: str, query: str) -> List[str]:
        """Identify relevant laws and acts"""
        law_mapping = {
            "PROPERTY": ["Transfer of Property Act", "Rent Control Act", "Indian Registration Act"],
            "FAMILY": ["Hindu Marriage Act", "Special Marriage Act", "Domestic Violence Act"],
            "CONSUMER": ["Consumer Protection Act", "Indian Contract Act"],
            "CRIMINAL": ["Indian Penal Code", "Code of Criminal Procedure"],
            "CIVIL": ["Civil Procedure Code", "Indian Contract Act"],
            "LABOR": ["Industrial Disputes Act", "Payment of Wages Act"]
        }
        
        domain = legal_domain.upper()
        return law_mapping.get(domain, ["Indian Constitution", "Relevant State and Central Acts"])
    
    def _generate_next_steps(self, state: AgentState) -> List[str]:
        """Generate recommended next steps"""
        steps = []
        
        if state.urgency_level in [UrgencyLevel.HIGH, UrgencyLevel.CRITICAL]:
            steps.append("Seek immediate legal consultation")
            steps.append("Document all relevant evidence")
        else:
            steps.append("Gather all relevant documents")
            steps.append("Consult with a qualified advocate")
        
        steps.append("Consider alternative dispute resolution if applicable")
        steps.append("Keep detailed records of all communications")
        
        return steps

class RiskAssessmentAgent(BaseAgent):
    """Assesses legal risks and urgency"""
    
    def __init__(self):
        super().__init__("RiskAssessmentAgent")
        self.risk_indicators = {
            "HIGH": ["lawsuit", "court notice", "arrest", "bail", "eviction", "seizure"],
            "MEDIUM": ["dispute", "contract breach", "warning", "notice"],
            "LOW": ["advice", "clarification", "general query"]
        }
    
    async def process(self, state: AgentState) -> AgentState:
        """Process risk assessment"""
        self.log_processing(state, "Processing risk assessment")
        
        # Assess legal risks
        risk_level = self._assess_risk_level(state.current_message, state.urgency_level)
        state.response_data["risk_assessment"] = {
            "level": risk_level,
            "factors": self._identify_risk_factors(state.current_message),
            "recommendations": self._generate_risk_recommendations(risk_level)
        }
        
        return state
    
    def _assess_risk_level(self, message: str, urgency: UrgencyLevel) -> str:
        """Assess risk level based on message content and urgency"""
        message_lower = message.lower()
        
        # Check for high-risk indicators
        for indicator in self.risk_indicators["HIGH"]:
            if indicator in message_lower:
                return "HIGH"
        
        # Check urgency level
        if urgency in [UrgencyLevel.HIGH, UrgencyLevel.CRITICAL]:
            return "HIGH"
        elif urgency == UrgencyLevel.MEDIUM:
            return "MEDIUM"
        
        # Check for medium-risk indicators
        for indicator in self.risk_indicators["MEDIUM"]:
            if indicator in message_lower:
                return "MEDIUM"
        
        return "LOW"
    
    def _identify_risk_factors(self, message: str) -> List[str]:
        """Identify specific risk factors"""
        factors = []
        message_lower = message.lower()
        
        risk_keywords = {
            "time_sensitive": ["deadline", "court date", "hearing", "urgent", "immediate"],
            "financial": ["money", "damages", "compensation", "payment", "fine"],
            "legal_proceedings": ["case", "lawsuit", "court", "judge", "hearing"],
            "criminal": ["police", "arrest", "charges", "bail", "crime"]
        }
        
        for category, keywords in risk_keywords.items():
            if any(keyword in message_lower for keyword in keywords):
                factors.append(category)
        
        return factors
    
    def _generate_risk_recommendations(self, risk_level: str) -> List[str]:
        """Generate recommendations based on risk level"""
        if risk_level == "HIGH":
            return [
                "Seek immediate legal consultation",
                "Do not delay in taking action",
                "Document everything immediately",
                "Consider emergency legal remedies"
            ]
        elif risk_level == "MEDIUM":
            return [
                "Consult with an advocate soon",
                "Gather all relevant documents",
                "Avoid making any commitments without legal advice"
            ]
        else:
            return [
                "Consider legal consultation for guidance",
                "Research your rights and options",
                "Keep records of all relevant information"
            ]

class RecommendationAgent(BaseAgent):
    """Provides advocate recommendations and next steps"""
    
    def __init__(self):
        super().__init__("RecommendationAgent")
    
    async def process(self, state: AgentState) -> AgentState:
        """Process advocate recommendations"""
        self.log_processing(state, "Processing advocate recommendations")
        
        # Generate advocate search criteria
        search_criteria = self._generate_search_criteria(state)
        state.response_data["advocate_search"] = search_criteria
        
        # Generate general recommendations
        recommendations = self._generate_recommendations(state)
        state.response_data["recommendations"] = recommendations
        
        return state
    
    def _generate_search_criteria(self, state: AgentState) -> Dict[str, Any]:
        """Generate advocate search criteria"""
        criteria = {
            "specialization": self._map_domain_to_specialization(state.legal_domain),
            "location": state.user_context.location,
            "urgency": state.urgency_level.value,
            "budget_range": getattr(state.user_context, 'budget_range', None)
        }
        
        return criteria
    
    def _map_domain_to_specialization(self, legal_domain: str) -> Specialization:
        """Map legal domain to advocate specialization"""
        domain_mapping = {
            "PROPERTY": Specialization.CIVIL,
            "FAMILY": Specialization.FAMILY,
            "CONSUMER": Specialization.CIVIL,
            "CRIMINAL": Specialization.CRIMINAL,
            "CIVIL": Specialization.CIVIL,
            "CORPORATE": Specialization.CORPORATE,
            "CYBER": Specialization.CYBER,
            "TAXATION": Specialization.TAXATION,
            "LABOR": Specialization.LABOR
        }
        
        return domain_mapping.get(legal_domain.upper(), Specialization.OTHER)
    
    def _generate_recommendations(self, state: AgentState) -> List[str]:
        """Generate general recommendations"""
        recommendations = []
        
        # Based on urgency
        if state.urgency_level == UrgencyLevel.CRITICAL:
            recommendations.append("Contact an advocate immediately or visit the nearest legal aid center")
        elif state.urgency_level == UrgencyLevel.HIGH:
            recommendations.append("Schedule a consultation with an advocate within 24-48 hours")
        else:
            recommendations.append("Consider scheduling a consultation with an advocate")
        
        # Based on legal domain
        domain_recommendations = {
            "PROPERTY": "Ensure all property documents are in order before consultation",
            "FAMILY": "Gather marriage certificate and relevant family documents",
            "CONSUMER": "Keep all purchase receipts and communication records",
            "CRIMINAL": "Do not speak to authorities without legal representation"
        }
        
        domain_rec = domain_recommendations.get(state.legal_domain.upper())
        if domain_rec:
            recommendations.append(domain_rec)
        
        return recommendations

class ContextAgent(BaseAgent):
    """Manages conversation context and memory"""
    
    def __init__(self):
        super().__init__("ContextAgent")
    
    async def process(self, state: AgentState) -> AgentState:
        """Process context management"""
        self.log_processing(state, "Processing context management")
        
        # Update conversation context
        self._update_conversation_context(state)
        
        # Maintain conversation memory
        self._update_memory(state)
        
        return state
    
    def _update_conversation_context(self, state: AgentState):
        """Update conversation context"""
        # Add current message to history
        state.conversation_history.append({
            "timestamp": get_current_timestamp(),
            "type": MessageType.USER,
            "content": state.current_message,
            "intent": state.intent,
            "entities": state.extracted_entities
        })
        
        # Update user context with new information
        if state.extracted_entities:
            if "location" in state.extracted_entities:
                if not state.user_context.location:
                    state.user_context.location = {}
                state.user_context.location.update(state.extracted_entities["location"])
    
    def _update_memory(self, state: AgentState):
        """Update conversation memory"""
        # Store important context in memory
        if "conversation_topics" not in state.memory:
            state.memory["conversation_topics"] = []
        
        # Add current topic if not already present
        if state.legal_domain not in state.memory["conversation_topics"]:
            state.memory["conversation_topics"].append(state.legal_domain)
        
        # Store key entities
        if "key_entities" not in state.memory:
            state.memory["key_entities"] = {}
        
        state.memory["key_entities"].update(state.extracted_entities)

class ProgressAgent(BaseAgent):
    """Tracks conversation progress and goals"""
    
    def __init__(self):
        super().__init__("ProgressAgent")
    
    async def process(self, state: AgentState) -> AgentState:
        """Process progress tracking"""
        self.log_processing(state, "Processing progress tracking")
        
        # Update progress metrics
        progress = self._calculate_progress(state)
        state.response_data["progress"] = progress
        
        # Determine completion status
        completion_status = self._assess_completion(state)
        state.response_data["completion_status"] = completion_status
        
        return state
    
    def _calculate_progress(self, state: AgentState) -> Dict[str, Any]:
        """Calculate conversation progress"""
        total_steps = 5  # greeting, info_gathering, legal_guidance, recommendations, closure
        completed_steps = 0
        
        if state.conversation_history:
            completed_steps += 1  # greeting
        
        if state.user_context.legal_issue:
            completed_steps += 1  # info_gathering
        
        if "legal_guidance_provided" in state.memory:
            completed_steps += 1  # legal_guidance
        
        if "advocate_search" in state.response_data:
            completed_steps += 1  # recommendations
        
        progress_percentage = (completed_steps / total_steps) * 100
        
        return {
            "percentage": progress_percentage,
            "completed_steps": completed_steps,
            "total_steps": total_steps,
            "current_stage": state.conversation_stage.value
        }
    
    def _assess_completion(self, state: AgentState) -> Dict[str, Any]:
        """Assess if conversation goals are met"""
        requirements_met = {
            "legal_issue_identified": bool(state.user_context.legal_issue),
            "location_provided": bool(state.user_context.location and any(state.user_context.location.values())),
            "legal_guidance_provided": "legal_guidance_provided" in state.memory,
            "recommendations_given": "recommendations" in state.response_data
        }
        
        completion_score = sum(requirements_met.values()) / len(requirements_met)
        
        return {
            "requirements_met": requirements_met,
            "completion_score": completion_score,
            "ready_for_closure": completion_score >= 0.75
        }

class MemoryAgent(BaseAgent):
    """Manages long-term and short-term memory"""
    
    def __init__(self):
        super().__init__("MemoryAgent")
    
    async def process(self, state: AgentState) -> AgentState:
        """Process memory management"""
        self.log_processing(state, "Processing memory management")
        
        # Update short-term memory
        self._update_short_term_memory(state)
        
        # Update long-term memory
        self._update_long_term_memory(state)
        
        # Retrieve relevant memories
        relevant_memories = self._retrieve_relevant_memories(state)
        state.response_data["context_from_memory"] = relevant_memories
        
        return state
    
    def _update_short_term_memory(self, state: AgentState):
        """Update short-term conversation memory"""
        if "short_term" not in state.memory:
            state.memory["short_term"] = {
                "recent_messages": [],
                "current_focus": None,
                "pending_actions": []
            }
        
        # Keep last 5 messages in short-term memory
        state.memory["short_term"]["recent_messages"].append(state.current_message)
        if len(state.memory["short_term"]["recent_messages"]) > 5:
            state.memory["short_term"]["recent_messages"].pop(0)
        
        # Update current focus
        state.memory["short_term"]["current_focus"] = state.legal_domain
    
    def _update_long_term_memory(self, state: AgentState):
        """Update long-term memory with important information"""
        if "long_term" not in state.memory:
            state.memory["long_term"] = {
                "user_profile": {},
                "case_history": [],
                "preferences": {}
            }
        
        # Update user profile
        if state.user_context.location:
            state.memory["long_term"]["user_profile"]["location"] = state.user_context.location
        
        if state.legal_domain:
            if "legal_interests" not in state.memory["long_term"]["user_profile"]:
                state.memory["long_term"]["user_profile"]["legal_interests"] = []
            
            if state.legal_domain not in state.memory["long_term"]["user_profile"]["legal_interests"]:
                state.memory["long_term"]["user_profile"]["legal_interests"].append(state.legal_domain)
    
    def _retrieve_relevant_memories(self, state: AgentState) -> Dict[str, Any]:
        """Retrieve memories relevant to current context"""
        relevant = {}
        
        if "long_term" in state.memory:
            # Get user profile information
            if "user_profile" in state.memory["long_term"]:
                relevant["user_profile"] = state.memory["long_term"]["user_profile"]
        
        if "short_term" in state.memory:
            # Get recent context
            relevant["recent_context"] = state.memory["short_term"]["current_focus"]
        
        return relevant
