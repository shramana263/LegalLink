"""
Conversation Orchestrator - Interactive LegalLink AI
Following Technical Flow: Conversation Flow Control & Response Assembly
"""
import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime

from .agent_graph import AgentGraph
from .session_manager import SessionManager, UserSession
from .enhanced_legal_agent import EnhancedLegalAgent, LegalQuery
from app.models import (
    IncomingMessage, OutgoingMessage, MessageType, ConversationStage,
    UserContext, UrgencyLevel
)
from app.services import ExpressClient, IndianKanoonClient
from app.utils import get_current_timestamp

logger = logging.getLogger(__name__)

class ConversationOrchestrator:
    """
    Main orchestrator for conversational AI following the enhanced technical flow:
    1. Session & Context Management
    2. Input Processing  
    3. Enhanced Legal Agent Processing (RAG + Ollama Gemma3 with Training Data)
    4. Agentic Processing (LangGraph) - Enhanced with RAG results
    5. Response Assembly
    6. Context Update & Persistence
    7. Delivery & Feedback
    
    The enhanced flow prioritizes local training data through RAG processing 
    before falling back to or enhancing with the agentic system.
    """
    
    def __init__(self):
        self.session_manager = SessionManager()
        self.agent_graph = AgentGraph()
        self.enhanced_legal_agent = EnhancedLegalAgent()
        self.express_client: Optional[ExpressClient] = None
        self.indian_kanoon_client: Optional[IndianKanoonClient] = None
        
        # Response templates following data flow
        self.response_templates = {
            ConversationStage.GREETING: {
                "welcome": "Welcome to LegalLink AI! I'm here to help with your legal questions and connect you with qualified advocates. How can I assist you today?",
                "returning": "Welcome back! How can I help you with your legal matter today?"
            },
            ConversationStage.INFORMATION_GATHERING: {
                "location_needed": "To provide the most relevant guidance, could you please share your location (city/state)?",
                "details_needed": "Could you provide more details about your legal issue?",
                "urgency_check": "How urgent is this matter? Do you need immediate assistance?"
            },
            ConversationStage.LEGAL_GUIDANCE: {
                "analysis_complete": "Based on your situation, here's my analysis:",
                "laws_applicable": "The following laws may be relevant to your case:",
                "next_steps": "I recommend the following next steps:"
            },
            ConversationStage.ADVOCATE_RECOMMENDATION: {
                "search_initiated": "Let me help you find qualified advocates in your area.",
                "recommendations_ready": "I found several advocates who specialize in your type of case:",
                "booking_offer": "Would you like me to help you schedule a consultation?"
            },
            ConversationStage.CLOSURE: {
                "summary": "Here's a summary of our conversation:",
                "follow_up": "Feel free to reach out if you have more questions!",
                "satisfaction": "Was this consultation helpful?"
            }
        }
    
    async def initialize(self, express_client: ExpressClient, indian_kanoon_client: IndianKanoonClient):
        """Initialize the orchestrator with service clients"""
        await self.session_manager.initialize()
        
        # Initialize the enhanced legal agent
        await self.enhanced_legal_agent.initialize()
        
        self.express_client = express_client
        self.indian_kanoon_client = indian_kanoon_client
        logger.info("Conversation orchestrator initialized with Enhanced Legal Agent")
    
    async def process_user_message(
        self,
        user_id: str,
        message: str,
        websocket = None,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Main entry point for processing user messages
        Following Technical Flow: Input → Processing → Response Assembly → Delivery
        """
        try:
            # 1. SESSION & CONTEXT MANAGEMENT
            session = await self._get_or_create_session(user_id, session_id, websocket)
              # 2. INPUT PROCESSING & VALIDATION
            processed_input = await self._process_input(message, session)
            
            # 3. ENHANCED LEGAL AGENT PROCESSING (RAG + Ollama Gemma3) - PRIMARY
            enhanced_rag_response = await self.process_with_enhanced_legal_agent_before_agentic(processed_input, session)
            
            # 4. AGENTIC PROCESSING (LangGraph) - Enhanced with RAG results or Fallback
            agent_response = await self._process_through_agents(processed_input, session, enhanced_rag_response)
            
            # 5. RESPONSE ASSEMBLY
            assembled_response = await self._assemble_response(agent_response, session)
            
            # 6. CONTEXT UPDATE & PERSISTENCE
            await self._update_session_context(session, message, assembled_response)
            
            # 7. DELIVERY PREPARATION
            delivery_response = await self._prepare_delivery(assembled_response, session)
            
            return delivery_response
            
        except Exception as e:
            logger.error(f"Error processing message for user {user_id}: {e}")
            return await self._create_error_response(user_id, session_id, str(e))
    
    async def _get_or_create_session(
        self, 
        user_id: str, 
        session_id: Optional[str], 
        websocket = None
    ) -> UserSession:
        """Get existing session or create new one"""
        
        if session_id:
            session = await self.session_manager.get_session(session_id)
            if session:
                return session
        
        # Create new session
        if websocket:
            session = await self.session_manager.create_session(user_id, websocket)
        else:
            # For API calls without WebSocket
            from fastapi import WebSocket
            mock_websocket = None  # Handle non-WebSocket interactions
            session = await self.session_manager.create_session(user_id, mock_websocket)
        
        return session
    
    async def _process_input(self, message: str, session: UserSession) -> Dict[str, Any]:
        """
        Enhanced Input Processing Pipeline
        Following Technical Flow: Input Processing
        """
        
        # Input validation and sanitization
        sanitized_message = self._sanitize_input(message)
        
        # Input type detection
        input_type = self._detect_input_type(sanitized_message)
          # Intent classification (preliminary)
        preliminary_intent = self._classify_preliminary_intent(sanitized_message)
        
        processed_input = {
            "original_message": message,
            "sanitized_message": sanitized_message,
            "input_type": input_type,
            "preliminary_intent": preliminary_intent,
            "timestamp": get_current_timestamp(),
            "session_context": session.conversation_state
        }
        
        logger.info(f"Input processed - Intent: {preliminary_intent}, Type: {input_type}")
        return processed_input
    
    async def _process_through_agents(
        self, 
        processed_input: Dict[str, Any], 
        session: UserSession,
        rag_response: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process through the agentic system (LangGraph)
        Enhanced with RAG response integration
        Following Technical Flow: Agentic Conversation System
        """
        
        # Prepare agent graph input with RAG enhancement
        agent_input = {
            "session_id": session.session_id,
            "user_id": session.user_id,
            "message": processed_input["sanitized_message"],
            "conversation_history": session.query_history,
            "user_context": session.user_context,
            "memory": session.conversation_state.get("memory", {}),
            "rag_response": rag_response  # Include RAG response for agent enhancement
        }
        
        # Check if RAG response provides sufficient answer
        if rag_response and self._is_rag_response_sufficient(rag_response):
            # Use RAG response as primary, enhance with agents for interactive elements
            enhanced_agent_response = await self._enhance_rag_with_agents(
                rag_response, agent_input
            )
            logger.info("Using RAG response as primary with agent enhancement")
            return enhanced_agent_response
        else:
            # Process through full agent graph with RAG context
            agent_response = await self.agent_graph.process_message(
                session.session_id,
                session.user_id,
                processed_input["sanitized_message"],
                session.query_history,
                session.user_context,
                session.conversation_state.get("memory", {})
            )
            
            # Merge RAG insights into agent response
            if rag_response:
                agent_response = self._merge_rag_into_agent_response(agent_response, rag_response)
            
            logger.info(f"Agent processing complete - Stage: {agent_response.get('metadata', {}).get('conversation_stage')}")
            return agent_response
    
    async def process_with_enhanced_legal_agent_before_agentic(
        self, 
        processed_input: Dict[str, Any], 
        session: UserSession
    ) -> Dict[str, Any]:
        """
        Process query through Enhanced Legal Agent with RAG capabilities BEFORE agentic processing
        This method uses local training data + Ollama Gemma3 as primary response mechanism
        Following Technical Flow: Enhanced Legal Agent → Agentic Processing (if needed)
        """
        
        try:
            logger.info("🔍 Starting Enhanced Legal Agent processing with training data...")
            
            # Create comprehensive LegalQuery object
            legal_query = LegalQuery(
                query=processed_input["sanitized_message"],
                user_id=session.user_id,
                session_id=session.session_id,
                query_type=self._infer_query_type_from_intent(processed_input.get("preliminary_intent")),
                location=session.user_context.get("location", {}).get("city"),
                urgency=session.user_context.get("urgency_level", "medium")
            )
            
            # Process through Enhanced Legal Agent with RAG
            rag_response = await self.enhanced_legal_agent.process_legal_query(legal_query)
            
            # Evaluate RAG response quality and completeness
            response_quality = self._evaluate_rag_response_quality(rag_response)
            
            logger.info(f"✅ Enhanced Legal Agent processing complete - Quality: {response_quality['score']:.2f}, Context Used: {rag_response.get('context_used', False)}")
            
            # Structure the enhanced response with comprehensive metadata
            enhanced_response = {
                "primary_content": rag_response.get("response", ""),
                "confidence_score": response_quality["score"],
                "training_data_sources": rag_response.get("sources", []),
                "legal_analysis": self._extract_legal_analysis_from_rag(rag_response),
                "relevant_context": rag_response.get("relevant_context", ""),
                "suggested_actions": self._extract_suggested_actions_from_rag(rag_response),
                "query_classification": legal_query.query_type,
                "urgency_assessment": self._assess_urgency_from_rag(rag_response, legal_query),
                "needs_agentic_enhancement": response_quality["needs_enhancement"],
                "metadata": {
                    "processing_method": "enhanced_legal_agent_primary",
                    "model_used": "gemma3",
                    "training_data_utilized": rag_response.get("context_used", False),
                    "vector_search_results": len(rag_response.get("sources", [])),
                    "conversation_stage": self._determine_stage_from_rag_response(rag_response),
                    "quality_indicators": response_quality["indicators"],
                    "timestamp": get_current_timestamp(),
                    "requires_agentic_fallback": response_quality["score"] < 0.6
                }
            }
            
            # Add conversation flow hints for agentic system
            if response_quality["needs_enhancement"]:
                enhanced_response["agentic_enhancement_hints"] = {
                    "missing_elements": response_quality["missing_elements"],
                    "enhancement_type": response_quality["enhancement_type"],
                    "priority_areas": response_quality["priority_areas"]
                }
            
            return enhanced_response
            
        except Exception as e:
            logger.error(f"❌ Error in Enhanced Legal Agent processing: {e}")
            # Return structured error response for graceful degradation
            return {
                "primary_content": "",
                "confidence_score": 0.0,
                "training_data_sources": [],
                "needs_agentic_enhancement": True,
                "metadata": {
                    "processing_method": "enhanced_legal_agent_primary",
                    "error": str(e),
                    "fallback_to_agents": True,
                    "error_type": "rag_processing_failure"
                }
            }
    
    def _evaluate_rag_response_quality(self, rag_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate the quality and completeness of RAG response
        Determines if agentic enhancement is needed
        """
        
        response_content = rag_response.get("response", "")
        sources = rag_response.get("sources", [])
        context_used = rag_response.get("context_used", False)
        
        # Quality indicators
        indicators = {
            "has_content": len(response_content.strip()) > 50,
            "has_sources": len(sources) > 0,
            "context_utilized": context_used,
            "response_length": len(response_content),
            "source_diversity": len(set(s.get("type", "") for s in sources)),
            "legal_terminology": self._contains_legal_terminology(response_content),
            "actionable_guidance": self._contains_actionable_guidance(response_content),
            "case_law_references": self._contains_case_law_references(response_content)
        }
        
        # Calculate quality score (0.0 to 1.0)
        score = 0.0
        if indicators["has_content"]:
            score += 0.2
        if indicators["has_sources"]:
            score += 0.2
        if indicators["context_utilized"]:
            score += 0.2
        if indicators["legal_terminology"]:
            score += 0.1
        if indicators["actionable_guidance"]:
            score += 0.15
        if indicators["case_law_references"]:
            score += 0.1
        if indicators["response_length"] > 200:
            score += 0.05
        
        # Determine enhancement needs
        needs_enhancement = score < 0.7
        missing_elements = []
        
        if not indicators["actionable_guidance"]:
            missing_elements.append("actionable_guidance")
        if not indicators["case_law_references"] and score > 0.3:
            missing_elements.append("case_law_references")
        if indicators["source_diversity"] < 2:
            missing_elements.append("diverse_sources")
        
        # Determine enhancement type
        enhancement_type = "none"
        if needs_enhancement:
            if score < 0.3:
                enhancement_type = "full_agentic_processing"
            elif score < 0.6:
                enhancement_type = "agentic_enhancement"
            else:
                enhancement_type = "minor_enhancement"
        
        return {
            "score": score,
            "needs_enhancement": needs_enhancement,
            "indicators": indicators,
            "missing_elements": missing_elements,
            "enhancement_type": enhancement_type,
            "priority_areas": self._identify_priority_enhancement_areas(indicators, missing_elements)
        }
    
    def _extract_legal_analysis_from_rag(self, rag_response: Dict[str, Any]) -> Dict[str, Any]:
        """Extract structured legal analysis from RAG response"""
        content = rag_response.get("response", "")
        sources = rag_response.get("sources", [])
        
        return {
            "applicable_laws": self._extract_applicable_laws(content, sources),
            "legal_principles": self._extract_legal_principles(content),
            "precedents": self._extract_precedents(sources),
            "risk_factors": self._extract_risk_factors(content),
            "compliance_requirements": self._extract_compliance_requirements(content)
        }
    
    def _extract_suggested_actions_from_rag(self, rag_response: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract actionable recommendations from RAG response"""
        content = rag_response.get("response", "")
        
        actions = []
        
        # Look for action-oriented language
        action_patterns = [
            r"should (file|submit|apply|contact|gather|prepare)",
            r"need to (file|submit|apply|contact|gather|prepare)",
            r"must (file|submit|apply|contact|gather|prepare)",
            r"recommended to (file|submit|apply|contact|gather|prepare)"
        ]
        
        # Extract immediate, short-term, and long-term actions
        if "immediate" in content.lower() or "urgent" in content.lower():
            actions.append({
                "type": "immediate",
                "description": "Urgent action required",
                "priority": "high",
                "timeline": "within 24 hours"
            })
        
        if "file" in content.lower() and ("complaint" in content.lower() or "petition" in content.lower()):
            actions.append({
                "type": "filing",
                "description": "File legal complaint or petition",
                "priority": "medium",
                "timeline": "within 1-2 weeks"
            })
        
        if "advocate" in content.lower() or "lawyer" in content.lower():
            actions.append({
                "type": "consultation",
                "description": "Consult with legal professional",
                "priority": "high",
                "timeline": "as soon as possible"
            })
        
        return actions
    
    def _assess_urgency_from_rag(self, rag_response: Dict[str, Any], legal_query: LegalQuery) -> Dict[str, Any]:
        """Assess urgency level based on RAG response and query content"""
        content = rag_response.get("response", "").lower()
        query_content = legal_query.query.lower()
        
        # High urgency indicators
        high_urgency_keywords = [
            "urgent", "immediate", "deadline", "time limit", "expire", "arrest", 
            "detention", "seizure", "eviction", "termination", "emergency"
        ]
        
        # Medium urgency indicators
        medium_urgency_keywords = [
            "court date", "hearing", "notice", "summons", "legal action",
            "complaint", "dispute", "violation"
        ]
        
        urgency_score = 0
        triggered_keywords = []
        
        for keyword in high_urgency_keywords:
            if keyword in content or keyword in query_content:
                urgency_score += 2
                triggered_keywords.append(keyword)
        
        for keyword in medium_urgency_keywords:
            if keyword in content or keyword in query_content:
                urgency_score += 1
                triggered_keywords.append(keyword)
        
        # Determine urgency level
        if urgency_score >= 4:
            level = "critical"
        elif urgency_score >= 2:
            level = "high"
        elif urgency_score >= 1:
            level = "medium"
        else:
            level = "low"
        
        return {
            "level": level,
            "score": urgency_score,
            "indicators": triggered_keywords,
            "assessment_basis": "rag_content_analysis"
        }
    
    def _contains_legal_terminology(self, content: str) -> bool:
        """Check if content contains legal terminology"""
        legal_terms = [
            "section", "act", "law", "court", "petition", "complaint", "jurisdiction",
            "precedent", "statute", "regulation", "legal", "rights", "liability",
            "contract", "agreement", "violation", "offense", "penalty", "damages"
        ]
        content_lower = content.lower()
        return any(term in content_lower for term in legal_terms)
    
    def _contains_actionable_guidance(self, content: str) -> bool:
        """Check if content contains actionable guidance"""
        action_terms = [
            "should", "need to", "must", "recommended", "steps", "process",
            "file", "submit", "apply", "contact", "gather", "prepare", "visit"
        ]
        content_lower = content.lower()
        return any(term in content_lower for term in action_terms)
    
    def _contains_case_law_references(self, content: str) -> bool:
        """Check if content contains case law references"""
        case_patterns = [
            r"\b\d{4}\b.*\b(SC|HC|SCC|AIR|PLD)\b",
            r"\bv\.\s+\w+",
            r"\bcase\s+of\b",
            r"\bjudgment\b",
            r"\bruling\b"
        ]
        import re
        return any(re.search(pattern, content, re.IGNORECASE) for pattern in case_patterns)
    
    def _identify_priority_enhancement_areas(self, indicators: Dict[str, Any], missing_elements: List[str]) -> List[str]:
        """Identify priority areas for agentic enhancement"""
        priority_areas = []
        
        if "actionable_guidance" in missing_elements:
            priority_areas.append("procedural_guidance")
        
        if "case_law_references" in missing_elements and indicators.get("legal_terminology", False):
            priority_areas.append("legal_precedents")
        
        if not indicators.get("has_sources", False):
            priority_areas.append("source_validation")
        
        if indicators.get("response_length", 0) < 100:
            priority_areas.append("content_expansion")
        
        return priority_areas
    
    def _extract_applicable_laws(self, content: str, sources: List[Dict]) -> List[str]:
        """Extract applicable laws from content and sources"""
        laws = []
        
        # Extract from content
        import re
        act_pattern = r'([A-Z][a-z\s]+Act,?\s*\d{4})'
        section_pattern = r'Section\s+(\d+[A-Z]?)'
        
        laws.extend(re.findall(act_pattern, content))
        laws.extend([f"Section {s}" for s in re.findall(section_pattern, content)])
        
        # Extract from sources metadata
        for source in sources:
            if source.get("type") == "case_law":
                relevant_sections = source.get("metadata", {}).get("relevant_sections", [])
                laws.extend(relevant_sections)
        
        return list(set(laws))  # Remove duplicates
    
    def _extract_legal_principles(self, content: str) -> List[str]:
        """Extract legal principles from content"""
        principles = []
        
        # Look for principle-indicating phrases
        principle_patterns = [
            r'principle\s+(?:of\s+)?([^.]+)',
            r'doctrine\s+(?:of\s+)?([^.]+)',
            r'rule\s+(?:of\s+)?([^.]+)'
        ]
        
        import re
        for pattern in principle_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            principles.extend(matches)
        
        return principles
    
    def _extract_precedents(self, sources: List[Dict]) -> List[Dict[str, str]]:
        """Extract precedents from sources"""
        precedents = []
        
        for source in sources:
            if source.get("type") == "case_law":
                metadata = source.get("metadata", {})
                precedents.append({
                    "case_name": metadata.get("case_name", ""),
                    "court": metadata.get("court", ""),
                    "year": metadata.get("year", ""),
                    "principle": metadata.get("legal_principle", "")
                })
        
        return precedents
    
    def _extract_risk_factors(self, content: str) -> List[str]:
        """Extract risk factors from content"""
        risk_keywords = [
            "risk", "penalty", "fine", "imprisonment", "liability", "damages",
            "consequence", "violation", "breach", "default"
        ]
        
        risks = []
        content_lower = content.lower()
        
        for keyword in risk_keywords:
            if keyword in content_lower:
                # Extract sentence containing the risk keyword
                sentences = content.split('.')
                for sentence in sentences:
                    if keyword in sentence.lower():
                        risks.append(sentence.strip())
                        break
        
        return risks
    
    def _extract_compliance_requirements(self, content: str) -> List[str]:
        """Extract compliance requirements from content"""
        compliance_keywords = [
            "must", "required", "mandatory", "obligatory", "compulsory",
            "shall", "need to", "have to"
        ]
        
        requirements = []
        content_lower = content.lower()
        
        for keyword in compliance_keywords:
            if keyword in content_lower:
                sentences = content.split('.')
                for sentence in sentences:
                    if keyword in sentence.lower():
                        requirements.append(sentence.strip())
        
        return list(set(requirements))  # Remove duplicates
    
    def _is_enhanced_rag_response_sufficient(self, enhanced_rag_response: Dict[str, Any]) -> bool:
        """
        Check if enhanced RAG response is sufficient and doesn't need agentic enhancement
        """
        confidence_score = enhanced_rag_response.get("confidence_score", 0.0)
        needs_enhancement = enhanced_rag_response.get("needs_agentic_enhancement", True)
        has_content = len(enhanced_rag_response.get("primary_content", "").strip()) > 50
        
        # Consider response sufficient if:
        # 1. High confidence score (>0.7)
        # 2. Explicitly marked as not needing enhancement
        # 3. Has substantial content
        return confidence_score > 0.7 and not needs_enhancement and has_content
    
    async def _enhance_rag_with_agents(
        self, 
        enhanced_rag_response: Dict[str, Any], 
        agent_input: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Enhance the RAG response with agent-generated interactive elements
        """
        try:
            # Generate interactive elements using a lightweight agent call
            interactive_elements = await self._generate_interactive_elements(
                enhanced_rag_response, agent_input
            )
            
            # Generate advocate recommendations if needed
            advocate_recommendations = await self._generate_advocate_recommendations(
                enhanced_rag_response, agent_input
            )
            
            # Combine RAG response with agent enhancements
            enhanced_response = {
                "conversational_response": enhanced_rag_response.get("primary_content", ""),
                "legal_analysis": enhanced_rag_response.get("legal_analysis", {}),
                "suggested_actions": enhanced_rag_response.get("suggested_actions", []),
                "interactive_elements": interactive_elements,
                "advocate_recommendations": advocate_recommendations,
                "urgency_assessment": enhanced_rag_response.get("urgency_assessment", {}),
                "metadata": {
                    **enhanced_rag_response.get("metadata", {}),
                    "enhancement_type": "rag_with_agent_interactivity",
                    "agent_enhanced": True
                }
            }
            
            return enhanced_response
            
        except Exception as e:
            logger.error(f"Error enhancing RAG with agents: {e}")
            # Return RAG response as-is if enhancement fails
            return {
                "conversational_response": enhanced_rag_response.get("primary_content", ""),
                "metadata": {
                    **enhanced_rag_response.get("metadata", {}),
                    "enhancement_error": str(e)
                }
            }
    
    def _merge_enhanced_rag_into_agent_response(
        self, 
        agent_response: Dict[str, Any], 
        enhanced_rag_response: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Merge enhanced RAG insights into agent response
        """
        try:
            # Merge the responses prioritizing agent response but enriching with RAG data
            merged_response = {
                **agent_response,
                "rag_enhanced": True,
                "training_data_sources": enhanced_rag_response.get("training_data_sources", []),
                "rag_legal_analysis": enhanced_rag_response.get("legal_analysis", {}),
                "rag_urgency_assessment": enhanced_rag_response.get("urgency_assessment", {}),
            }
            
            # Enhance metadata
            if "metadata" in merged_response:
                merged_response["metadata"]["rag_enhanced"] = True
                merged_response["metadata"]["rag_confidence"] = enhanced_rag_response.get("confidence_score", 0.0)
                merged_response["metadata"]["training_data_utilized"] = True
            
            # Merge suggested actions if both exist
            agent_actions = agent_response.get("suggested_actions", [])
            rag_actions = enhanced_rag_response.get("suggested_actions", [])
            if agent_actions and rag_actions:
                merged_response["suggested_actions"] = agent_actions + rag_actions
            elif rag_actions:
                merged_response["suggested_actions"] = rag_actions
            
            return merged_response
            
        except Exception as e:
            logger.error(f"Error merging enhanced RAG into agent response: {e}")
            return agent_response
    
    async def _generate_interactive_elements(
        self, 
        enhanced_rag_response: Dict[str, Any], 
        agent_input: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate interactive elements based on RAG response
        """
        interactive_elements = {
            "quick_actions": [],
            "clarification_options": [],
            "follow_up_suggestions": []
        }
        
        # Generate quick actions based on suggested actions
        suggested_actions = enhanced_rag_response.get("suggested_actions", [])
        for action in suggested_actions:
            if action.get("type") == "filing":
                interactive_elements["quick_actions"].append({
                    "label": "Help with Filing",
                    "action": "guide_filing_process",
                    "description": "Guide me through the filing process"
                })
            elif action.get("type") == "consultation":
                interactive_elements["quick_actions"].append({
                    "label": "Find Advocate",
                    "action": "find_advocate",
                    "description": "Connect me with a qualified advocate"
                })
        
        # Generate clarification options based on legal analysis
        legal_analysis = enhanced_rag_response.get("legal_analysis", {})
        if legal_analysis.get("applicable_laws"):
            interactive_elements["clarification_options"].append({
                "question": "Would you like more details about the applicable laws?",
                "action": "explain_laws"
            })
        
        # Generate follow-up suggestions
        urgency = enhanced_rag_response.get("urgency_assessment", {})
        if urgency.get("level") in ["high", "critical"]:
            interactive_elements["follow_up_suggestions"].append({
                "suggestion": "Given the urgency, would you like immediate advocate assistance?",
                "action": "urgent_advocate_matching"
            })
        
        return interactive_elements
    
    async def _generate_advocate_recommendations(
        self, 
        enhanced_rag_response: Dict[str, Any], 
        agent_input: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Generate advocate recommendations based on RAG response analysis
        """
        recommendations = []
        
        try:
            # Extract legal domain from query classification
            query_type = enhanced_rag_response.get("query_classification")
            urgency = enhanced_rag_response.get("urgency_assessment", {})
            location = agent_input.get("user_context", {}).get("location", {}).get("city")
            
            # Generate recommendation criteria
            if query_type and location:
                recommendation_criteria = {
                    "legal_domain": query_type,
                    "location": location,
                    "urgency": urgency.get("level", "medium"),
                    "specialization_needed": self._determine_specialization_from_rag(enhanced_rag_response)
                }
                
                recommendations.append({
                    "type": "criteria_based",
                    "criteria": recommendation_criteria,
                    "message": f"I recommend finding an advocate specializing in {query_type} law in {location}."
                })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating advocate recommendations: {e}")
            return []
    
    def _determine_specialization_from_rag(self, enhanced_rag_response: Dict[str, Any]) -> List[str]:
        """
        Determine required legal specializations from RAG analysis
        """
        specializations = []
        
        legal_analysis = enhanced_rag_response.get("legal_analysis", {})
        applicable_laws = legal_analysis.get("applicable_laws", [])
        query_type = enhanced_rag_response.get("query_classification", "")
        
        # Map query types to specializations
        specialization_mapping = {
            "procedure": ["procedural_law", "court_practice"],
            "case_law": ["litigation", "legal_research"],
            "rights": ["constitutional_law", "human_rights"],
            "guidance": ["legal_consultation", "advisory_services"]
        }
        
        if query_type in specialization_mapping:
            specializations.extend(specialization_mapping[query_type])
        
        # Add specific law specializations
        for law in applicable_laws:
            if "criminal" in law.lower():
                specializations.append("criminal_law")
            elif "civil" in law.lower():
                specializations.append("civil_law")
            elif "family" in law.lower():
                specializations.append("family_law")
            elif "property" in law.lower():
                specializations.append("property_law")
        
        return list(set(specializations))  # Remove duplicates
