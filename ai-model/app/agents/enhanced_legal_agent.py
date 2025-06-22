"""
Enhanced Legal AI Agent with RAG capabilities
Combines local training data with Ollama Gemma3 model
"""

import os
import logging
from typing import Dict, Any, Optional, List
from dataclasses import dataclass

from ..services.ollama_service import OllamaService, OllamaConfig
from ..services.vector_db_service import VectorDBService
from ..services.indian_kanoon_client import IndianKanoonClient

logger = logging.getLogger(__name__)

@dataclass
class LegalQuery:
    """Represents a legal query with context"""
    query: str
    user_id: str
    session_id: str
    query_type: Optional[str] = None  # e.g., "procedure", "case_law", "rights", etc.
    location: Optional[str] = None
    urgency: Optional[str] = None  # "low", "medium", "high"

class EnhancedLegalAgent:
    """AI agent that combines local training data with multiple Ollama models and Indian Kanoon API"""
    
    def __init__(self):
        self.legal_ollama_service = None  # For legal intelligence (llama3.2:3b)
        self.language_ollama_service = None  # For multilingual support (gemma3)
        self.vector_db_service = None
        self.indian_kanoon_client = None
        self.initialized = False
        
        # Load configuration from environment for different models
        # Legal Intelligence Model (llama3.2:3b)
        self.legal_ollama_config = OllamaConfig(
            base_url=os.getenv("AI_LEGAL_MODEL_ENDPOINT", "http://localhost:11434"),
            model_name=os.getenv("AI_LEGAL_MODEL_NAME", "llama3.2:3b"),
            temperature=float(os.getenv("AI_TEMPERATURE", "0.7")),
            max_tokens=int(os.getenv("AI_MAX_TOKENS", "2048"))
        )
        
        # Language/Multilingual Model (gemma3)
        self.language_ollama_config = OllamaConfig(
            base_url=os.getenv("AI_LANGUAGE_MODEL_ENDPOINT", "http://localhost:11434"),
            model_name=os.getenv("AI_LANGUAGE_MODEL_NAME", "gemma3"),
            temperature=float(os.getenv("AI_TEMPERATURE", "0.7")),
            max_tokens=int(os.getenv("AI_MAX_TOKENS", "1024"))
        )
        
        self.vector_config = {
            "db_path": os.getenv("VECTOR_DB_PATH", "./Database/vector_store"),
            "training_data_path": os.getenv("TRAINING_DATA_PATH", "./Database/training_data"),
            "embedding_model": os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2"),
            "chunk_size": int(os.getenv("RAG_CHUNK_SIZE", "1000")),
            "chunk_overlap": int(os.getenv("RAG_CHUNK_OVERLAP", "200")),            "top_k": int(os.getenv("RAG_TOP_K", "5"))
        }
    
    async def initialize(self):
        """Initialize the enhanced legal agent with multiple models and services"""
        try:
            logger.info("Initializing Enhanced Legal Agent with multi-model setup...")
            
            # Initialize Legal Intelligence Ollama service (llama3.2:3b)
            logger.info("Initializing Legal Intelligence Model (llama3.2:3b)...")
            self.legal_ollama_service = OllamaService(self.legal_ollama_config)
            await self.legal_ollama_service.initialize()
            
            # Initialize Language/Multilingual Ollama service (gemma3)
            logger.info("Initializing Language Model (gemma3)...")
            self.language_ollama_service = OllamaService(self.language_ollama_config)
            await self.language_ollama_service.initialize()
            
            # Initialize Indian Kanoon client for case law
            logger.info("Initializing Indian Kanoon API client...")
            from ..services.indian_kanoon_client import IndianKanoonClient
            self.indian_kanoon_client = IndianKanoonClient()
            await self.indian_kanoon_client.initialize()
            
            # Initialize Vector DB service for training data
            logger.info("Initializing Vector Database with training data...")
            self.vector_db_service = VectorDBService(
                db_path=self.vector_config["db_path"],
                training_data_path=self.vector_config["training_data_path"],
                embedding_model=self.vector_config["embedding_model"],
                chunk_size=self.vector_config["chunk_size"],
                chunk_overlap=self.vector_config["chunk_overlap"]
            )
            await self.vector_db_service.initialize()
            
            self.initialized = True
            logger.info("✅ Enhanced Legal Agent initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Enhanced Legal Agent: {e}")
            raise
    
    async def process_legal_query(self, legal_query: LegalQuery) -> Dict[str, Any]:
        """
        Process a legal query using the correct multi-model approach:
        1. Training data (local vector DB) for local legal knowledge
        2. Indian Kanoon API for past case law & legal precedents
        3. llama3.2:3b for legal intelligence & complex reasoning
        4. gemma3 for sentence simplification & multilingual support
        """
        if not self.initialized:
            raise Exception("Agent not initialized")
        
        try:
            logger.info(f"🔍 Processing legal query: {legal_query.query[:100]}...")
            
            # Step 1: Get relevant context from training data (local knowledge)
            logger.info("� Retrieving context from local training data...")
            training_context = await self._get_relevant_context(legal_query)
            
            # Step 2: Get case law from Indian Kanoon API (past legal precedents)
            logger.info("📚 Retrieving case law from Indian Kanoon API...")
            case_law_context = await self._get_case_law_context(legal_query)
            
            # Step 3: Combine all contexts for comprehensive legal knowledge
            combined_context = self._combine_contexts(training_context, case_law_context)
            
            # Step 4: Generate enhanced system prompt for legal reasoning
            system_prompt = self._generate_system_prompt(legal_query)
            
            # Step 5: Use Legal Intelligence Model (llama3.2:3b) for complex legal reasoning
            logger.info("🧠 Processing with Legal Intelligence Model (llama3.2:3b) for complex reasoning...")
            legal_response = await self.legal_ollama_service.generate_response(
                prompt=legal_query.query,
                context=combined_context,
                system_prompt=system_prompt
            )
            
            # Step 6: Use Language Model (gemma3) for simplification & multilingual support
            logger.info("🔤 Processing with Language Model (gemma3) for simplification...")
            simplified_response = await self._simplify_response_if_needed(
                legal_response, legal_query
            )
            
            # Step 7: Post-process and format final response
            formatted_response = await self._format_response(
                simplified_response, legal_query, combined_context
            )
            
            return {
                "response": formatted_response,
                "context_used": len(combined_context) > 0,
                "query_type": legal_query.query_type,
                "sources": await self._get_sources_from_context(combined_context),
                "model_info": {
                    "legal_intelligence_model": self.legal_ollama_config.model_name,  # llama3.2:3b
                    "language_simplification_model": self.language_ollama_config.model_name,  # gemma3
                    "case_law_source": "indian_kanoon_api",
                    "training_data_source": "local_vector_db"
                },
                "processing_details": {
                    "training_data_used": len(training_context) > 0,
                    "case_law_used": len(case_law_context) > 0,
                    "response_simplified": simplified_response != legal_response,
                    "models_used": ["llama3.2:3b", "gemma3", "indian_kanoon_api"]
                }
            }
            
        except Exception as e:
            logger.error(f"Error processing legal query: {e}")
            return {
                "response": "I apologize, but I encountered an error while processing your query. Please try again or contact support if the issue persists.",
                "error": str(e),
                "context_used": False
            }
    
    async def _get_relevant_context(self, legal_query: LegalQuery) -> str:
        """Retrieve relevant context from training data"""
        try:
            # Enhance query with context clues
            enhanced_query = self._enhance_query_for_search(legal_query)
            
            # Get relevant documents
            context = await self.vector_db_service.get_relevant_context(
                enhanced_query,
                max_tokens=1500  # Leave room for query and response
            )
            
            return context
            
        except Exception as e:
            logger.error(f"Error getting relevant context: {e}")
            return ""
    
    def _enhance_query_for_search(self, legal_query: LegalQuery) -> str:
        """Enhance query with additional context for better search"""
        enhanced_parts = [legal_query.query]
        
        if legal_query.query_type:
            enhanced_parts.append(legal_query.query_type)
        
        if legal_query.location:
            enhanced_parts.append(f"jurisdiction {legal_query.location}")
        
        # Add legal keywords if query seems to be about specific areas
        query_lower = legal_query.query.lower()
        if any(word in query_lower for word in ["fir", "police", "crime", "criminal"]):
            enhanced_parts.append("criminal law procedure")
        elif any(word in query_lower for word in ["property", "land", "title", "ownership"]):
            enhanced_parts.append("property law real estate")
        elif any(word in query_lower for word in ["marriage", "divorce", "family"]):
            enhanced_parts.append("family law")
        elif any(word in query_lower for word in ["contract", "agreement", "business"]):
            enhanced_parts.append("contract law civil")
        
        return " ".join(enhanced_parts)
    
    def _generate_system_prompt(self, legal_query: LegalQuery) -> str:
        """Generate system prompt based on query type and context"""
        base_prompt = """You are LegalLink AI, an expert legal assistant specializing in Indian law. 
You have access to comprehensive legal training data including case law, procedures, and legal principles.

Your responsibilities:
1. Provide accurate legal guidance based on Indian legal system
2. Cite relevant sections, acts, cases, and legal precedents when applicable
3. Explain legal procedures step-by-step when asked
4. Clarify legal concepts in simple, understandable language
5. Always emphasize the importance of consulting qualified legal professionals for specific cases

Guidelines:
- Be precise and factual in your responses
- Use the provided context to enhance your answers
- If uncertain about any legal point, clearly state your limitations
- Provide practical, actionable advice while maintaining legal accuracy
- Structure your responses clearly with headings and bullet points when appropriate"""
        
        # Add specific guidance based on query type
        if legal_query.query_type == "procedure":
            base_prompt += "\n\nFocus on: Providing step-by-step procedural guidance with timeline and required documents."
        elif legal_query.query_type == "case_law":
            base_prompt += "\n\nFocus on: Relevant case precedents, legal principles, and judicial interpretations."
        elif legal_query.query_type == "rights":
            base_prompt += "\n\nFocus on: Legal rights, protections available, and remedies under Indian law."
        elif legal_query.urgency == "high":
            base_prompt += "\n\nNote: This appears to be an urgent legal matter. Prioritize immediate actionable steps and emergency procedures."
        
        return base_prompt
    
    async def _format_response(self, response: str, legal_query: LegalQuery, context: str) -> str:
        """Format the response for better readability"""
        try:
            # Add disclaimers and formatting
            formatted_response = response.strip()
            
            # Add disclaimer if not already present
            if "legal professional" not in formatted_response.lower():
                formatted_response += "\n\n⚠️ **Important Disclaimer**: This is general legal information based on Indian law. For specific legal advice tailored to your situation, please consult with a qualified legal professional."
            
            # Add urgency note if applicable
            if legal_query.urgency == "high":
                formatted_response = "🚨 **Urgent Legal Matter Detected**\n\n" + formatted_response
            
            return formatted_response
            
        except Exception as e:
            logger.error(f"Error formatting response: {e}")
            return response
    
    async def _get_sources_from_context(self, context: str) -> List[str]:
        """Extract source information from context"""
        sources = []
        
        # This is a simplified extraction - in a real implementation,
        # you'd want to track sources more systematically
        if "Case:" in context:
            sources.append("Case Law Database")
        if "Court:" in context:
            sources.append("Court Hierarchy Information")
        if "Section" in context:
            sources.append("Legal Acts and Sections")
        if "Procedure" in context or "procedure" in context:
            sources.append("Legal Procedures")
        
        return sources
    
    async def get_chat_response(self, messages: List[Dict[str, str]], user_id: str) -> str:
        """Handle chat-based conversations"""
        if not self.initialized:
            raise Exception("Agent not initialized")
        
        try:
            # Extract the latest user message
            latest_message = messages[-1] if messages else {"content": ""}
            
            # Create a legal query from the latest message
            legal_query = LegalQuery(
                query=latest_message.get("content", ""),
                user_id=user_id,
                session_id=f"chat_{user_id}",
                query_type=self._infer_query_type(latest_message.get("content", ""))
            )
            
            # Get relevant context
            context = await self._get_relevant_context(legal_query)
            
            # Add context to the conversation if available
            if context:
                context_message = {
                    "role": "system",
                    "content": f"Relevant legal context:\n{context}\n\nUse this context to provide accurate legal guidance."
                }
                enhanced_messages = [context_message] + messages
            else:
                enhanced_messages = messages
            
            # Generate response
            response = await self.ollama_service.chat_completion(enhanced_messages)
            
            return response
            
        except Exception as e:
            logger.error(f"Error in chat response: {e}")
            return "I apologize, but I encountered an error while processing your message. Please try again."
    
    def _infer_query_type(self, query: str) -> Optional[str]:
        """Infer the type of legal query"""
        query_lower = query.lower()
        
        if any(word in query_lower for word in ["how to", "procedure", "process", "steps"]):
            return "procedure"
        elif any(word in query_lower for word in ["case", "judgment", "precedent", "court"]):
            return "case_law"
        elif any(word in query_lower for word in ["right", "rights", "entitled", "protection"]):
            return "rights"
        elif any(word in query_lower for word in ["urgent", "emergency", "immediate", "asap"]):
            return "urgent"
        else:
            return None
    
    async def close(self):
        """Close the enhanced legal agent"""
        if self.ollama_service:
            await self.ollama_service.close()
        if self.vector_db_service:
            await self.vector_db_service.close()
        
        logger.info("Enhanced Legal Agent closed")
    
    async def _get_case_law_context(self, legal_query: LegalQuery) -> str:
        """Get case law context from Indian Kanoon API"""
        try:
            if not self.indian_kanoon_client:
                logger.warning("Indian Kanoon client not initialized, skipping case law retrieval")
                return ""
            
            # Search for relevant legal documents
            search_results = await self.indian_kanoon_client.search_legal_documents(
                query=legal_query.query,
                jurisdiction=legal_query.location,
                limit=5
            )
            
            if not search_results.get("success", False):
                logger.warning("Failed to retrieve case law from Indian Kanoon")
                return ""
              # Format case law context
            case_law_parts = []
            for doc in search_results.get("documents", []):
                case_law_parts.append(f"""
Case Law: {doc.get('title', '')}
Court: {doc.get('court', '')}
Date: {doc.get('date', '')}
Summary: {doc.get('summary', '')}
Relevance: {doc.get('relevance_score', 0)}%
""")
            
            return "\n---\n".join(case_law_parts)
            
        except Exception as e:
            logger.error(f"Error retrieving case law context: {e}")
            return ""
    
    def _combine_contexts(self, training_context: str, case_law_context: str) -> str:
        """Combine training data context with case law context"""
        contexts = []
        
        if training_context:
            contexts.append(f"=== TRAINING DATA CONTEXT ===\n{training_context}")
        
        if case_law_context:
            contexts.append(f"=== CASE LAW CONTEXT (Indian Kanoon) ===\n{case_law_context}")
        
        return "\n\n".join(contexts)
    
    async def _simplify_response_if_needed(self, legal_response: str, legal_query: LegalQuery) -> str:
        """
        Use gemma3 model to simplify response for better understanding
        Especially useful for multilingual support and complex legal language
        """
        try:
            # Check if simplification is needed
            if self._needs_simplification(legal_response, legal_query):
                logger.info("🔧 Simplifying response with Language Model (gemma3)...")
                
                simplification_prompt = f"""
Please simplify the following legal response to make it more understandable for a general audience while maintaining accuracy:

Original Response:
{legal_response}

Requirements:
- Use simpler language
- Maintain all legal accuracy
- Keep all important information
- Make it more accessible to non-lawyers
- If the query was in Hindi or other regional language, provide translation support

Simplified Response:
"""
                
                simplified = await self.language_ollama_service.generate_response(
                    prompt=simplification_prompt,
                    system_prompt="You are a legal language simplification expert. Simplify complex legal language while maintaining accuracy."
                )
                
                return simplified
            
            return legal_response
            
        except Exception as e:
            logger.error(f"Error in response simplification: {e}")
            return legal_response  # Return original if simplification fails
    
    def _needs_simplification(self, response: str, legal_query: LegalQuery) -> bool:
        """Determine if response needs simplification"""
        # Check for complex legal terms
        complex_terms = [
            "whereas", "heretofore", "notwithstanding", "pursuant", "aforementioned",
            "inter alia", "prima facie", "res judicata", "ultra vires", "bona fide"
        ]
        
        # Check response complexity
        response_lower = response.lower()
        complex_term_count = sum(1 for term in complex_terms if term in response_lower)
        
        # Check query language (if not English, likely needs simplification)
        query_needs_translation = any(
            char for char in legal_query.query 
            if ord(char) > 127  # Non-ASCII characters (Hindi, Bengali, etc.)
        )
        
        # Simplify if:
        # 1. Multiple complex legal terms present
        # 2. Query appears to be in regional language
        # 3. Response is very long and technical
        return (
            complex_term_count >= 3 or 
            query_needs_translation or 
            len(response) > 1500
        )
