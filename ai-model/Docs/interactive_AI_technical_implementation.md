# Interactive LegalLink AI Technical Implementation
## Following Data Flow & Technical Flow Architecture with Training Data Integration

## 🏗️ System Architecture Overview
```
┌─────────────────────────────────────────────────────┐
│         🔐 Session Management Layer                  │
│    WebSocket + Redis/MongoDB + JWT Auth             │
├─────────────────────────────────────────────────────┤
│         📥 Enhanced Input Processing                 │
│   Validation + Context Loading + Intent Classification│
├─────────────────────────────────────────────────────┤
│         🧠 NLP Processing Engine                     │
│   Multilingual NLP + Entity Extraction + Conversation NLU│
├─────────────────────────────────────────────────────┤
│         🗃️ Conversation State Management            │
│   State Manager + Topic Tracker + Progress + Memory │
├─────────────────────────────────────────────────────┤
│         🤖 Agentic Conversation System (LangGraph)   │
│   Multi-Agent Orchestrator + Conversation Flows     │
├─────────────────────────────────────────────────────┤
│         🔧 Response Assembly Engine                  │
│   Multi-format Response Generation + Delivery       │
├─────────────────────────────────────────────────────┤
│         🎮 Interaction Management                    │
│   Feedback Collection + Analytics + Learning        │
└─────────────────────────────────────────────────────┘
```

## 🔐 1. SESSION MANAGEMENT LAYER
*Following Technical Flow: Session & Context Management*

```python
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

@dataclass
class UserSession:
    session_id: str
    user_id: str
    start_time: datetime
    last_activity: datetime
    conversation_state: Dict
    user_context: Dict
    trust_score: float = 0.0
    interaction_count: int = 0

class SessionManager:
    """Manages WebSocket sessions with Redis/MongoDB persistence"""
    
    def __init__(self):
        self.redis_client = redis.Redis(host='localhost', port=6379, db=0)
        self.mongo_client = MongoClient('mongodb://localhost:27017/')
        self.db = self.mongo_client['legallink_ai']
        self.sessions_collection = self.db['user_sessions']
        self.active_sessions: Dict[str, UserSession] = {}
        
    async def create_session(self, websocket: WebSocket, user_id: str) -> str:
        """Create new session following Technical Flow"""
        session_id = str(uuid.uuid4())
        
        # Initialize session data
        session = UserSession(
            session_id=session_id,
            user_id=user_id,
            start_time=datetime.utcnow(),
            last_activity=datetime.utcnow(),
            conversation_state={
                'current_topic': None,
                'query_history': [],
                'clarification_needs': [],
                'progress_tracking': {
                    'stage': 'initial_contact',
                    'completed_steps': [],
                    'next_actions': []
                }
            },
            user_context={
                'profile': {},
                'location': None,
                'conversation_history': [],
                'preferences': {
                    'language': 'en',
                    'communication_style': 'professional'
                }
            }
        )
        
        # Store in active sessions
        self.active_sessions[session_id] = session
        
        # Cache in Redis for quick access
        await self.cache_session(session)
        
        # Persist in MongoDB
        await self.persist_session(session)
        
        return session_id
    
    async def cache_session(self, session: UserSession):
        """Cache session in Redis for quick access"""
        session_data = asdict(session)
        session_data['start_time'] = session.start_time.isoformat()
        session_data['last_activity'] = session.last_activity.isoformat()
        
        self.redis_client.setex(
            f"session:{session.session_id}",
            3600,  # 1 hour TTL
            json.dumps(session_data)
        )
    
    async def load_session_context(self, session_id: str) -> Optional[UserSession]:
        """Load session context from Redis/MongoDB"""
        # Try Redis first (fast access)
        cached_data = self.redis_client.get(f"session:{session_id}")
        if cached_data:
            session_data = json.loads(cached_data)
            session_data['start_time'] = datetime.fromisoformat(session_data['start_time'])
            session_data['last_activity'] = datetime.fromisoformat(session_data['last_activity'])
            return UserSession(**session_data)
        
        # Fallback to MongoDB
        session_doc = self.sessions_collection.find_one({'session_id': session_id})
        if session_doc:
            session_doc.pop('_id', None)
            return UserSession(**session_doc)
        
        return None

class AuthenticationService:
    """JWT-based authentication service"""
    
    def __init__(self, secret_key: str):
        self.secret_key = secret_key
        
    def generate_token(self, user_id: str, session_id: str) -> str:
        """Generate JWT token for session"""
        payload = {
            'user_id': user_id,
            'session_id': session_id,
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(hours=24)
        }
        return jwt.encode(payload, self.secret_key, algorithm='HS256')
    
    def verify_token(self, token: str) -> Dict:
        """Verify JWT token and extract payload"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")
```

## 📥 2. ENHANCED INPUT PROCESSING PIPELINE
*Following Technical Flow: Input Processing*

```python
import re
from typing import Dict, List, Tuple
from pydantic import BaseModel, validator
from enum import Enum

class InputType(Enum):
    TEXT = "text"
    VOICE = "voice"
    DOCUMENT = "document"

class QueryIntent(Enum):
    NEW_QUERY = "new_query"
    FOLLOW_UP = "follow_up"
    CLARIFICATION = "clarification"
    FEEDBACK = "feedback"

class InputValidator:
    """Sanitizes and validates user input"""
    
    def __init__(self):
        self.dangerous_patterns = [
            r'<script.*?>.*?</script>',
            r'javascript:',
            r'on\w+\s*=',
            r'<iframe.*?>',
            r'eval\s*\(',
        ]
        
    def sanitize_input(self, input_text: str) -> str:
        """Remove dangerous content and normalize input"""
        # Remove HTML/JS injection attempts
        for pattern in self.dangerous_patterns:
            input_text = re.sub(pattern, '', input_text, flags=re.IGNORECASE)
        
        # Normalize whitespace
        input_text = re.sub(r'\s+', ' ', input_text.strip())
        
        # Limit length
        if len(input_text) > 2000:
            input_text = input_text[:2000] + "..."
        
        return input_text
    
    def validate_input(self, input_data: Dict) -> Dict:
        """Validate input structure and content"""
        content = input_data.get('content', '')
        input_type = input_data.get('type', 'text')
        
        if not content.strip():
            raise ValueError("Empty input not allowed")
        
        if input_type not in [t.value for t in InputType]:
            raise ValueError(f"Invalid input type: {input_type}")
        
        return {
            'content': self.sanitize_input(content),
            'type': input_type,
            'timestamp': datetime.utcnow().isoformat(),
            'validated': True
        }

class ContextLoader:
    """Loads previous conversation context"""
    
    def __init__(self, session_manager: SessionManager):
        self.session_manager = session_manager
        
    async def load_conversation_context(self, session_id: str) -> Dict:
        """Load and structure conversation context"""
        session = await self.session_manager.load_session_context(session_id)
        if not session:
            return {}
        
        return {
            'conversation_history': session.conversation_state.get('query_history', []),
            'current_topic': session.conversation_state.get('current_topic'),
            'user_profile': session.user_context.get('profile', {}),
            'preferences': session.user_context.get('preferences', {}),
            'progress_state': session.conversation_state.get('progress_tracking', {}),
            'trust_score': session.trust_score,
            'interaction_count': session.interaction_count
        }

class IntentClassifier:
    """Classifies user intent using local models"""
    
    def __init__(self):
        self.classification_patterns = {
            QueryIntent.NEW_QUERY: [
                r'^(hello|hi|hey|start|begin)',
                r'(new|different|another)\s+(question|issue|problem)',
                r'^(what|how|when|where|why|can|should|will)',
            ],
            QueryIntent.FOLLOW_UP: [
                r'^(and|also|additionally|furthermore)',
                r'(more|further|additional)\s+(info|information|details)',
                r'^(what about|how about|concerning)',
            ],
            QueryIntent.CLARIFICATION: [
                r'^(what do you mean|can you explain|i don\'t understand)',
                r'(clarify|elaborate|explain)\s+(that|this|it)',
                r'^(sorry|pardon|what)',
            ],
            QueryIntent.FEEDBACK: [
                r'^(thank|thanks|great|good|helpful|excellent)',
                r'(appreciate|satisfied|happy|pleased)',
                r'^(not helpful|wrong|incorrect|bad)',
            ]
        }
    
    def classify_intent(self, message: str, context: Dict) -> QueryIntent:
        """Classify user intent based on message and context"""
        message_lower = message.lower().strip()
        
        # Check conversation history for context
        interaction_count = context.get('interaction_count', 0)
        has_ongoing_topic = bool(context.get('current_topic'))
        
        # New users or clear new query indicators
        if interaction_count == 0:
            return QueryIntent.NEW_QUERY
        
        # Pattern matching
        for intent, patterns in self.classification_patterns.items():
            for pattern in patterns:
                if re.search(pattern, message_lower):
                    return intent
        
        # Context-based classification
        if has_ongoing_topic and len(message_lower) < 50:
            return QueryIntent.FOLLOW_UP
        elif not has_ongoing_topic:
            return QueryIntent.NEW_QUERY
        else:
            return QueryIntent.FOLLOW_UP
```

## 🧠 3. NLP PROCESSING ENGINE
*Following Technical Flow: NLP & Understanding*

```python
import ollama
from sentence_transformers import SentenceTransformer
from transformers import pipeline
import spacy
from typing import Dict, List, Any

class MultilingualNLP:
    """Processes text in Hindi/English/Bengali using Gemma2 1B"""
    
    def __init__(self):
        self.supported_languages = ['en', 'hi', 'bn']
        self.embeddings_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        self.translation_pipeline = pipeline("translation", model="Helsinki-NLP/opus-mt-hi-en")
        
        # Load spaCy models for different languages
        try:
            self.nlp_en = spacy.load("en_core_web_sm")
        except:
            self.nlp_en = None
            
    def detect_language(self, text: str) -> str:
        """Detect input language"""
        # Simple heuristic-based detection
        hindi_chars = len(re.findall(r'[ऀ-ॿ]', text))
        bengali_chars = len(re.findall(r'[ঀ-৿]', text))
        total_chars = len(text)
        
        if hindi_chars / total_chars > 0.3:
            return 'hi'
        elif bengali_chars / total_chars > 0.3:
            return 'bn'
        else:
            return 'en'
    
    def translate_to_english(self, text: str, source_lang: str) -> str:
        """Translate text to English if needed"""
        if source_lang == 'en':
            return text
        
        try:
            if source_lang == 'hi':
                result = self.translation_pipeline(text)
                return result[0]['translation_text']
            else:
                # For Bengali, use a simpler approach or external service
                return text  # Fallback to original
        except:
            return text
    
    def process_multilingual_input(self, text: str) -> Dict:
        """Process multilingual input and return structured data"""
        detected_lang = self.detect_language(text)
        english_text = self.translate_to_english(text, detected_lang)
        
        return {
            'original_text': text,
            'detected_language': detected_lang,
            'english_text': english_text,
            'embedding': self.embeddings_model.encode([english_text])[0].tolist()
        }

class EntityExtractor:
    """Enhanced entity extraction for legal context"""
    
    def __init__(self):
        self.legal_entity_patterns = {
            'case_references': r'(AIR|SCC|All|Cri|LJ|ILR)\s+\d{4}\s+\w+\s+\d+',
            'section_references': r'Section\s+\d+(?:\(\d+\))?(?:\s+of\s+[\w\s]+Act)?',
            'act_names': r'([\w\s]+Act,?\s+\d{4})',
            'court_names': r'(Supreme Court|High Court|District Court|Magistrate|Tribunal)',
            'dates': r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}',
            'amounts': r'₹\s*\d+(?:,\d{3})*(?:\.\d{2})?|Rs\.?\s*\d+',
            'time_periods': r'\d+\s+(days?|weeks?|months?|years?)',
        }
        
    def extract_legal_entities(self, text: str) -> Dict[str, List[str]]:
        """Extract legal entities from text"""
        entities = {}
        
        for entity_type, pattern in self.legal_entity_patterns.items():
            matches = re.findall(pattern, text, re.IGNORECASE)
            entities[entity_type] = matches
        
        # Extract locations (basic implementation)
        entities['locations'] = self.extract_locations(text)
        
        # Extract person names (basic implementation)
        entities['persons'] = self.extract_person_names(text)
        
        return entities
    
    def extract_temporal_references(self, text: str) -> List[Dict]:
        """Extract temporal information"""
        temporal_refs = []
        
        # Date patterns
        date_matches = re.finditer(r'\b\d{1,2}[/-]\d{1,2}[/-](?:\d{2}|\d{4})\b', text)
        for match in date_matches:
            temporal_refs.append({
                'type': 'date',
                'text': match.group(),
                'start': match.start(),
                'end': match.end()
            })
        
        # Relative time patterns
        relative_time_matches = re.finditer(r'\b(yesterday|today|tomorrow|last week|next month|within \d+ days)\b', text, re.IGNORECASE)
        for match in relative_time_matches:
            temporal_refs.append({
                'type': 'relative_time',
                'text': match.group(),
                'start': match.start(),
                'end': match.end()
            })
        
        return temporal_refs
    
    def extract_locations(self, text: str) -> List[str]:
        """Extract location entities"""
        # Load West Bengal geographical data from training data
        with open('../Database/training_data/geographical_jurisdiction/data.json', 'r') as f:
            geo_data = json.load(f)
        
        locations = []
        wb_areas = geo_data.get('west_bengal_jurisdiction_data', {}).get('geographic_mapping', {})
        
        for city, data in wb_areas.items():
            if city.lower() in text.lower():
                locations.append(city.title())
                
            for area_name, area_data in data.get('major_areas', {}).items():
                if area_data.get('area_name', '').lower() in text.lower():
                    locations.append(area_data['area_name'])
        
        return list(set(locations))
    
    def extract_person_names(self, text: str) -> List[str]:
        """Basic person name extraction"""
        # Simple pattern for Indian names
        name_patterns = [
            r'\b[A-Z][a-z]+\s+[A-Z][a-z]+\b',  # First Last
            r'\b[A-Z][a-z]+\s+[A-Z]\.\s*[A-Z][a-z]+\b',  # First M. Last
        ]
        
        names = []
        for pattern in name_patterns:
            matches = re.findall(pattern, text)
            names.extend(matches)
        
        return list(set(names))

class ConversationNLU:
    """Natural Language Understanding for conversations"""
    
    def __init__(self):
        self.coreference_patterns = {
            'this': ['this case', 'this matter', 'this issue'],
            'that': ['that case', 'that situation', 'that problem'],
            'it': ['the case', 'the matter', 'the issue'],
            'they': ['the parties', 'the defendants', 'the plaintiffs']
        }
    
    def resolve_coreferences(self, text: str, context: Dict) -> str:
        """Resolve pronoun references to entities"""
        resolved_text = text
        current_topic = context.get('current_topic', {})
        
        for pronoun, replacements in self.coreference_patterns.items():
            if pronoun in text.lower():
                # Find the most relevant replacement based on context
                if current_topic.get('legal_domain'):
                    for replacement in replacements:
                        if current_topic['legal_domain'] in replacement.lower():
                            resolved_text = re.sub(
                                rf'\b{pronoun}\b', 
                                replacement, 
                                resolved_text, 
                                flags=re.IGNORECASE
                            )
                            break
        
        return resolved_text
    
    def link_context(self, current_query: str, conversation_history: List[Dict]) -> Dict:
        """Link current query to conversation context"""
        context_links = {
            'referenced_queries': [],
            'topic_continuity': False,
            'information_gaps': []
        }
        
        if not conversation_history:
            return context_links
        
        # Find references to previous queries
        for i, prev_query in enumerate(conversation_history[-5:]):  # Last 5 queries
            prev_text = prev_query.get('content', '')
            # Simple keyword overlap detection
            current_words = set(current_query.lower().split())
            prev_words = set(prev_text.lower().split())
            overlap = current_words.intersection(prev_words)
            
            if len(overlap) > 2:  # Threshold for relevance
                context_links['referenced_queries'].append({
                    'query_index': len(conversation_history) - 5 + i,
                    'content': prev_text,
                    'overlap_words': list(overlap)
                })
        
        # Check topic continuity
        if conversation_history:
            last_query = conversation_history[-1]
            context_links['topic_continuity'] = self.check_topic_continuity(
                current_query, last_query.get('content', '')
            )
        
        return context_links
    
    def check_topic_continuity(self, current_query: str, previous_query: str) -> bool:
        """Check if current query continues the same topic"""
        # Simple approach: check for legal domain keywords
        legal_domains = [
            'property', 'divorce', 'criminal', 'consumer', 'employment',
            'contract', 'family', 'civil', 'commercial', 'tax'
        ]
        
        current_domains = [domain for domain in legal_domains if domain in current_query.lower()]
        previous_domains = [domain for domain in legal_domains if domain in previous_query.lower()]
        
        return bool(set(current_domains).intersection(set(previous_domains)))
    
    def track_intent_progression(self, conversation_history: List[Dict]) -> Dict:
        """Track how user intent progresses through conversation"""
        progression = {
            'stages': [],
            'current_stage': 'information_seeking',
            'next_likely_stage': 'problem_identification'
        }
        
        # Define intent progression stages
        stage_indicators = {
            'information_seeking': ['what', 'how', 'when', 'where', 'can you tell'],
            'problem_identification': ['my problem', 'my issue', 'my case', 'help me'],
            'solution_exploration': ['what should', 'what can', 'options', 'alternatives'],
            'decision_making': ['which', 'better', 'recommend', 'suggest'],
            'action_planning': ['how to proceed', 'next steps', 'what documents', 'timeline']
        }
        
        for query in conversation_history[-10:]:  # Analyze last 10 queries
            query_text = query.get('content', '').lower()
            for stage, indicators in stage_indicators.items():
                if any(indicator in query_text for indicator in indicators):
                    progression['stages'].append(stage)
                    break
        
        # Determine current and next stage
        if progression['stages']:
            progression['current_stage'] = progression['stages'][-1]
            
            # Predict next stage
            stage_sequence = list(stage_indicators.keys())
            current_index = stage_sequence.index(progression['current_stage'])
            if current_index < len(stage_sequence) - 1:
                progression['next_likely_stage'] = stage_sequence[current_index + 1]
        
        return progression
```

## 🗃️ 4. CONVERSATION STATE MANAGEMENT
*Following Technical Flow: Conversation State Management*

### 1. Trust-Building Through Competence Display

#### A. Executive Summary Generator
```python
# Trust-building through immediate value demonstration
from langchain.schema import BaseMessage
from typing import Dict, List, Optional
import ollama
import json

class TrustBuildingAgent:
    def __init__(self):
        self.ollama_client = ollama.Client()
        self.model = "llama3.1:3b"
        
    def generate_executive_summary(self, query: str, user_context: Dict) -> Dict:
        """Generate comprehensive overview to demonstrate competence"""
        
        prompt = f"""
        You are an expert legal assistant. A user has asked: "{query}"
        
        User Context: {json.dumps(user_context, indent=2)}
        
        Generate a comprehensive executive summary that:
        1. Shows deep understanding of their situation
        2. Provides immediate actionable insights
        3. Identifies potential risks and opportunities
        4. Demonstrates knowledge of relevant laws and procedures
        5. Sets clear expectations about next steps
        
        Structure your response as:
        - Executive Summary (2-3 sentences)
        - Key Legal Considerations (3-4 points)
        - Immediate Steps Required (timeline-based)
        - Potential Risks & Red Flags
        - Professional Consultation Recommendation
        
        Use confident, professional tone with specific legal references.
        """
        
        response = self.ollama_client.chat(
            model=self.model,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return self.parse_executive_summary(response['message']['content'])
    
    def parse_executive_summary(self, response: str) -> Dict:
        """Parse and structure the executive summary response"""
        sections = {
            'executive_summary': '',
            'legal_considerations': [],
            'immediate_steps': [],
            'risk_alerts': [],
            'consultation_recommendation': ''
        }
        
        # Parse the structured response
        current_section = None
        lines = response.split('\n')
        
        for line in lines:
            line = line.strip()
            if 'Executive Summary' in line:
                current_section = 'executive_summary'
            elif 'Legal Considerations' in line:
                current_section = 'legal_considerations'
            elif 'Immediate Steps' in line:
                current_section = 'immediate_steps'
            elif 'Risks' in line or 'Red Flags' in line:
                current_section = 'risk_alerts'
            elif 'Professional Consultation' in line:
                current_section = 'consultation_recommendation'
            elif line and current_section:
                if current_section == 'executive_summary':
                    sections[current_section] += line + ' '
                elif line.startswith('- ') or line.startswith('• '):
                    sections[current_section].append(line[2:])
                else:
                    sections[current_section] += line + ' '
        
        return sections
```

#### B. Risk Calculation Engine
```python
class RiskCalculationAgent:
    def __init__(self):
        self.legal_calculators = {
            'property_dispute': self.calculate_property_risk,
            'employment': self.calculate_employment_risk,
            'criminal': self.calculate_criminal_risk,
            'family': self.calculate_family_risk,
            'contract': self.calculate_contract_risk
        }
        
    def calculate_risk_urgency(self, query_analysis: Dict, user_context: Dict) -> Dict:
        """Calculate specific risks with quantifiable metrics"""
        legal_domain = query_analysis.get('legal_domain')
        calculator = self.legal_calculators.get(legal_domain, self.calculate_general_risk)
        
        return calculator(query_analysis, user_context)
    
    def calculate_property_risk(self, analysis: Dict, context: Dict) -> Dict:
        """Calculate property-specific risks with financial implications"""
        risk_factors = analysis.get('risk_factors', [])
        property_value = context.get('property_value', 0)
        timeline_pressure = analysis.get('timeline_pressure', 0)
        
        # Calculate financial exposure
        base_risk = len(risk_factors) * 0.15
        timeline_multiplier = min(timeline_pressure / 30, 2.0)  # Days to months
        financial_exposure = property_value * base_risk * timeline_multiplier
        
        urgency_score = min((base_risk + timeline_multiplier) * 10, 100)
        
        return {
            'urgency_score': urgency_score,
            'financial_exposure': financial_exposure,
            'critical_timeline': self.calculate_critical_timeline(analysis),
            'risk_breakdown': self.breakdown_property_risks(risk_factors),
            'immediate_actions': self.get_immediate_actions(analysis),
            'professional_urgency': self.determine_professional_urgency(urgency_score)
        }
    
    def calculate_critical_timeline(self, analysis: Dict) -> Dict:
        """Calculate critical deadlines and time-sensitive actions"""
        legal_procedures = analysis.get('applicable_procedures', [])
        timeline_data = {}
        
        for procedure in legal_procedures:
            # Query knowledge base for procedure timelines
            timeline_info = self.get_procedure_timeline(procedure)
            timeline_data[procedure] = timeline_info
            
        return timeline_data
    
    def create_urgency_alert(self, risk_calculation: Dict) -> str:
        """Generate compelling urgency messaging"""
        urgency_score = risk_calculation['urgency_score']
        financial_exposure = risk_calculation['financial_exposure']
        
        if urgency_score > 80:
            urgency_level = "🚨 CRITICAL"
            action_phrase = "immediate legal intervention required"
        elif urgency_score > 60:
            urgency_level = "⚠️ HIGH PRIORITY"
            action_phrase = "professional consultation recommended within 48 hours"
        else:
            urgency_level = "⚡ MODERATE"
            action_phrase = "legal guidance advisable within one week"
        
        alert_message = f"""
{urgency_level} - Risk Assessment Complete

📊 **Calculated Risk Score: {urgency_score}/100**
💰 **Potential Financial Exposure: ₹{financial_exposure:,.0f}**
⏰ **Critical Timeline: {risk_calculation.get('critical_timeline', {}).get('urgent_deadline', 'Multiple deadlines identified')}**

🎯 **Recommended Action:** {action_phrase}
"""
        return alert_message
```

### 2. Progressive Information Disclosure System

#### A. Information Layering Engine
```python
class ProgressiveDisclosureAgent:
    def __init__(self):
        self.disclosure_strategies = {
            'initial_contact': self.first_interaction_strategy,
            'trust_building': self.competence_demonstration_strategy,
            'problem_amplification': self.risk_highlighting_strategy,
            'solution_presentation': self.advocate_matching_strategy,
            'conversion': self.consultation_booking_strategy,
            'retention': self.post_booking_strategy
        }
        
    def determine_disclosure_strategy(self, conversation_state: Dict) -> str:
        """Determine appropriate information disclosure strategy"""
        interaction_count = conversation_state.get('interaction_count', 0)
        trust_score = conversation_state.get('trust_score', 0)
        urgency_identified = conversation_state.get('urgency_identified', False)
        
        if interaction_count == 0:
            return 'initial_contact'
        elif trust_score < 70:
            return 'trust_building'
        elif not urgency_identified:
            return 'problem_amplification'
        elif not conversation_state.get('advocates_presented', False):
            return 'solution_presentation'
        elif not conversation_state.get('consultation_booked', False):
            return 'conversion'
        else:
            return 'retention'
    
    def first_interaction_strategy(self, query: str, context: Dict) -> Dict:
        """Initial strategy: Demonstrate competence, provide value, build trust"""
        return {
            'response_components': {
                'greeting': self.generate_personalized_greeting(context),
                'competence_display': self.generate_executive_summary(query, context),
                'value_proposition': self.highlight_unique_insights(query),
                'next_step_tease': self.create_curiosity_gap(),
                'engagement_question': self.generate_engagement_question(query)
            },
            'conversation_goals': ['establish_credibility', 'provide_immediate_value', 'encourage_sharing'],
            'disclosure_level': 'high_value_overview'
        }
    
    def problem_amplification_strategy(self, query: str, context: Dict) -> Dict:
        """Strategy: Quantify risks, create urgency, position expertise"""
        risk_calculation = self.calculate_detailed_risks(query, context)
        
        return {
            'response_components': {
                'risk_quantification': self.create_risk_calculations(risk_calculation),
                'urgency_creation': self.generate_urgency_messaging(risk_calculation),
                'expertise_positioning': self.demonstrate_specialized_knowledge(),
                'solution_teasing': self.hint_at_professional_solution(),
                'fear_management': self.provide_reassuring_context()
            },
            'conversation_goals': ['create_urgency', 'highlight_complexity', 'position_solution'],
            'disclosure_level': 'problem_amplification'
        }
```

#### B. Emotional Intelligence Engine
```python
class EmotionalIntelligenceAgent:
    def __init__(self):
        self.emotion_detector = self.load_emotion_model()
        self.response_adapters = {
            'anxiety': self.anxiety_response_adapter,
            'confusion': self.confusion_response_adapter,
            'urgency': self.urgency_response_adapter,
            'skepticism': self.skepticism_response_adapter,
            'gratitude': self.gratitude_response_adapter
        }
    
    def detect_user_emotion(self, message: str, context: Dict) -> Dict:
        """Detect user emotional state from message content and context"""
        emotional_indicators = {
            'anxiety': ['worried', 'scared', 'nervous', 'afraid', 'panic'],
            'confusion': ['confused', 'don\'t understand', 'unclear', 'what does'],
            'urgency': ['urgent', 'quickly', 'asap', 'emergency', 'immediate'],
            'skepticism': ['really?', 'sure?', 'doubt', 'skeptical', 'trust'],
            'gratitude': ['thank', 'appreciate', 'helpful', 'great', 'excellent']
        }
        
        detected_emotions = []
        message_lower = message.lower()
        
        for emotion, indicators in emotional_indicators.items():
            if any(indicator in message_lower for indicator in indicators):
                detected_emotions.append(emotion)
        
        return {
            'primary_emotion': detected_emotions[0] if detected_emotions else 'neutral',
            'emotion_confidence': self.calculate_emotion_confidence(message, detected_emotions),
            'emotional_context': self.analyze_emotional_context(context),
            'response_strategy': self.determine_emotional_response_strategy(detected_emotions)
        }
    
    def anxiety_response_adapter(self, base_response: str, emotional_context: Dict) -> str:
        """Adapt response to address user anxiety"""
        reassurance_prefix = """
I understand this situation feels overwhelming, and that's completely normal. Let me break this down into manageable steps and show you exactly what we can do to protect your interests.

🛡️ **First, let's address your immediate concerns:**
"""
        
        confidence_suffix = """
💪 **Remember:** You're taking the right step by seeking information early. Most legal issues are manageable with proper guidance, and you have several good options available.
"""
        
        return reassurance_prefix + base_response + confidence_suffix
    
    def skepticism_response_adapter(self, base_response: str, emotional_context: Dict) -> str:
        """Adapt response to address user skepticism with proof and specificity"""
        credibility_prefix = """
I appreciate your careful approach - it's smart to verify legal information. Let me provide specific details with exact legal references:

📋 **Verifiable Facts:**
"""
        
        proof_suffix = """
🔍 **Sources:** All information above is based on current Indian legal statutes. I can provide specific section references if needed.
✅ **Verification:** You can cross-check these details with any legal professional.
"""
        
        return credibility_prefix + base_response + proof_suffix
```

### 3. Advocate Matching & Conversion Engine

#### A. Strategic Advocate Presentation System
```python
class AdvocateMatchingAgent:
    def __init__(self):
        self.advocate_db = self.connect_advocate_database()
        self.matching_algorithms = {
            'specialization_match': self.calculate_specialization_score,
            'location_proximity': self.calculate_location_score,
            'availability_alignment': self.calculate_availability_score,
            'success_rate': self.calculate_success_score,
            'fee_alignment': self.calculate_fee_score,
            'communication_style': self.calculate_communication_score
        }
        
    def generate_strategic_advocate_presentation(self, query_analysis: Dict, 
                                               user_context: Dict, 
                                               urgency_level: str) -> Dict:
        """Generate advocate recommendations with strategic presentation"""
        
        # Get matched advocates
        advocates = self.match_advocates(query_analysis, user_context)
        
        # Apply strategic presentation based on conversion psychology
        presentation_strategy = self.determine_presentation_strategy(urgency_level, user_context)
        
        return {
            'presentation_strategy': presentation_strategy,
            'advocate_cards': self.create_advocate_cards(advocates, presentation_strategy),
            'social_proof': self.generate_social_proof(advocates),
            'scarcity_elements': self.create_scarcity_messaging(advocates),
            'value_proposition': self.highlight_value_proposition(advocates, query_analysis),
            'call_to_action': self.generate_strategic_cta(presentation_strategy),
            'preparation_materials': self.create_consultation_prep_kit(query_analysis)
        }
    
    def create_advocate_cards(self, advocates: List[Dict], strategy: Dict) -> List[Dict]:
        """Create strategically designed advocate presentation cards"""
        cards = []
        
        for i, advocate in enumerate(advocates[:3]):  # Top 3 matches
            card = {
                'position': i + 1,
                'advocate_id': advocate['id'],
                'presentation_data': {
                    'headline': self.create_compelling_headline(advocate, strategy),
                    'credibility_markers': self.extract_credibility_markers(advocate),
                    'social_proof': self.format_social_proof(advocate),
                    'specialization_match': self.highlight_specialization_match(advocate, strategy),
                    'availability_urgency': self.create_availability_messaging(advocate),
                    'value_demonstration': self.demonstrate_value(advocate, strategy),
                    'risk_mitigation': self.show_risk_mitigation(advocate),
                    'call_to_action': self.create_advocate_cta(advocate, i)
                },
                'booking_facilitation': {
                    'direct_booking_url': f"/book/{advocate['id']}",
                    'consultation_types': advocate.get('consultation_types', []),
                    'next_available': advocate.get('next_available'),
                    'booking_incentives': self.create_booking_incentives(advocate, i)
                }
            }
            cards.append(card)
            
        return cards
    
    def create_compelling_headline(self, advocate: Dict, strategy: Dict) -> str:
        """Create psychologically compelling advocate headlines"""
        specializations = advocate.get('specializations', [])
        success_rate = advocate.get('success_rate', 0)
        experience_years = advocate.get('experience_years', 0)
        
        if strategy.get('urgency_level') == 'high':
            return f"🚨 **{advocate['name']}** - Available Today, {experience_years}+ Yrs in {specializations[0]}"
        elif strategy.get('credibility_focus'):
            return f"⭐ **{advocate['name']}** - {success_rate}% Success Rate, {len(advocate.get('high_profile_cases', []))} Major Cases Won"
        else:
            return f"🏆 **{advocate['name']}** - Top {specializations[0]} Specialist, {advocate.get('review_count', 0)} Client Reviews"
    
    def generate_consultation_prep_kit(self, query_analysis: Dict) -> Dict:
        """Generate consultation preparation materials to increase success rate"""
        legal_domain = query_analysis.get('legal_domain')
        
        prep_kit = {
            'essential_questions': self.generate_essential_questions(query_analysis),
            'document_checklist': self.create_document_checklist(legal_domain),
            'timeline_expectations': self.set_timeline_expectations(query_analysis),
            'fee_discussion_guide': self.create_fee_discussion_guide(legal_domain),
            'red_flags_to_mention': self.identify_red_flags_to_discuss(query_analysis),
            'success_factors': self.outline_success_factors(legal_domain)
        }
        
        return prep_kit
    
    def generate_essential_questions(self, query_analysis: Dict) -> List[str]:
        """Generate strategic questions to ask during consultation"""
        base_questions = [
            "What is your assessment of the strength of our case?",
            "What are the potential outcomes and their likelihood?",
            "What is the expected timeline for resolution?",
            "What are the total costs involved, including court fees?",
            "What documents and evidence do we need to strengthen our position?"
        ]
        
        domain_specific = self.get_domain_specific_questions(query_analysis.get('legal_domain'))
        situation_specific = self.get_situation_specific_questions(query_analysis)
        
        return base_questions + domain_specific + situation_specific
```

## 🔄 6. CONVERSATION FLOW CONTROL & RESPONSE ASSEMBLY
*Following Technical Flow: Decision Making & Flow Control + Response Assembly*

```python
from enum import Enum
from typing import Dict, List, Any, Optional
import json

class ConversationFlow(Enum):
    INFORMATION_GATHERING = "information_gathering"
    LEGAL_GUIDANCE = "legal_guidance"
    CLARIFICATION_LOOP = "clarification_loop"
    RECOMMENDATION = "recommendation"
    PROGRESS_CHECK = "progress_check"
    CLOSURE = "closure"

class FlowDecisionEngine:
    """Determines next action in conversation flow"""
    
    def __init__(self):
        self.flow_rules = self.initialize_flow_rules()
    
    def initialize_flow_rules(self) -> Dict:
        """Initialize flow decision rules"""
        return {
            ConversationFlow.INFORMATION_GATHERING: {
                'triggers': ['new_query', 'insufficient_info'],
                'next_flows': [ConversationFlow.LEGAL_GUIDANCE, ConversationFlow.CLARIFICATION_LOOP],
                'conditions': {
                    'entities_complete': lambda state: len(state.get('extracted_entities', {})) >= 3,
                    'topic_identified': lambda state: state.get('current_topic') is not None
                }
            },
            ConversationFlow.LEGAL_GUIDANCE: {
                'triggers': ['topic_classified', 'research_complete'],
                'next_flows': [ConversationFlow.RECOMMENDATION, ConversationFlow.CLARIFICATION_LOOP],
                'conditions': {
                    'risk_assessed': lambda state: state.get('risk_assessment') is not None,
                    'guidance_provided': lambda state: 'legal_research' in state.get('response_components', {})
                }
            },
            ConversationFlow.RECOMMENDATION: {
                'triggers': ['risk_high', 'user_ready'],
                'next_flows': [ConversationFlow.CLOSURE, ConversationFlow.PROGRESS_CHECK],
                'conditions': {
                    'advocates_matched': lambda state: len(state.get('advocate_matches', [])) > 0
                }
            }
        }
    
    def determine_next_flow(self, state: ConversationState) -> ConversationFlow:
        """Determine next conversation flow"""
        current_stage = state.get('conversation_stage', ConversationStage.INITIAL_CONTACT)
        risk_assessment = state.get('risk_assessment', {})
        user_context = state.get('user_context', {})
        
        # High urgency cases go directly to recommendation
        if risk_assessment.get('urgency_level') == 'critical':
            return ConversationFlow.RECOMMENDATION
        
        # Check flow progression rules
        current_flow = self.map_stage_to_flow(current_stage)
        flow_rule = self.flow_rules.get(current_flow, {})
        
        for next_flow in flow_rule.get('next_flows', []):
            if self.check_flow_conditions(next_flow, state):
                return next_flow
        
        # Default fallback
        return ConversationFlow.INFORMATION_GATHERING
    
    def map_stage_to_flow(self, stage: ConversationStage) -> ConversationFlow:
        """Map conversation stage to flow"""
        mapping = {
            ConversationStage.INITIAL_CONTACT: ConversationFlow.INFORMATION_GATHERING,
            ConversationStage.TRUST_BUILDING: ConversationFlow.INFORMATION_GATHERING,
            ConversationStage.PROBLEM_IDENTIFICATION: ConversationFlow.LEGAL_GUIDANCE,
            ConversationStage.RISK_ASSESSMENT: ConversationFlow.LEGAL_GUIDANCE,
            ConversationStage.SOLUTION_PRESENTATION: ConversationFlow.RECOMMENDATION,
            ConversationStage.ADVOCATE_RECOMMENDATION: ConversationFlow.RECOMMENDATION
        }
        return mapping.get(stage, ConversationFlow.INFORMATION_GATHERING)
    
    def check_flow_conditions(self, flow: ConversationFlow, state: ConversationState) -> bool:
        """Check if conditions are met for flow transition"""
        flow_rule = self.flow_rules.get(flow, {})
        conditions = flow_rule.get('conditions', {})
        
        for condition_name, condition_func in conditions.items():
            if not condition_func(state):
                return False
        
        return True

class ResponseAssembler:
    """Assembles multi-component responses"""
    
    def __init__(self, training_data_path: str):
        self.training_data_path = training_data_path
        
    def assemble_response(self, state: ConversationState, flow: ConversationFlow) -> Dict:
        """Assemble response based on conversation flow"""
        response_components = state.get('response_components', {})
        
        if flow == ConversationFlow.INFORMATION_GATHERING:
            return self.create_information_gathering_response(state)
        elif flow == ConversationFlow.LEGAL_GUIDANCE:
            return self.create_legal_guidance_response(state)
        elif flow == ConversationFlow.RECOMMENDATION:
            return self.create_recommendation_response(state)
        elif flow == ConversationFlow.CLARIFICATION_LOOP:
            return self.create_clarification_response(state)
        else:
            return self.create_default_response(state)
    
    def create_information_gathering_response(self, state: ConversationState) -> Dict:
        """Create response for information gathering flow"""
        topic = state.get('current_topic')
        entities = state.get('extracted_entities', {})
        
        response = {
            'type': 'information_gathering',
            'conversational_response': self.generate_information_gathering_text(topic, entities),
            'interactive_elements': self.create_information_gathering_elements(topic),
            'progress_indicator': self.calculate_information_completeness(entities),
            'next_questions': self.generate_follow_up_questions(topic, entities)
        }
        
        return response
    
    def create_legal_guidance_response(self, state: ConversationState) -> Dict:
        """Create comprehensive legal guidance response"""
        topic = state.get('current_topic')
        research = state.get('response_components', {}).get('legal_research', {})
        risk_assessment = state.get('risk_assessment', {})
        
        response = {
            'type': 'legal_guidance',
            'conversational_response': self.generate_guidance_summary(topic, research),
            'structured_guidance': self.create_structured_guidance(research),
            'risk_alerts': self.format_risk_alerts(risk_assessment),
            'legal_references': research.get('relevant_cases', [])[:3],  # Top 3
            'procedural_steps': self.extract_procedural_steps(research),
            'interactive_elements': self.create_guidance_elements(topic)
        }
        
        return response
    
    def create_recommendation_response(self, state: ConversationState) -> Dict:
        """Create advocate recommendation response"""
        advocate_matches = state.get('advocate_matches', [])
        risk_assessment = state.get('risk_assessment', {})
        topic = state.get('current_topic')
        
        response = {
            'type': 'recommendation',
            'conversational_response': self.generate_recommendation_text(advocate_matches, risk_assessment),
            'recommendation_cards': self.format_advocate_cards(advocate_matches),
            'consultation_prep': self.create_consultation_prep_kit(topic),
            'booking_facilitation': self.create_booking_elements(advocate_matches),
            'urgency_messaging': self.create_urgency_messaging(risk_assessment)
        }
        
        return response
    
    def generate_information_gathering_text(self, topic: ConversationTopic, entities: Dict) -> str:
        """Generate conversational text for information gathering"""
        if not topic:
            return """I'm here to help you with your legal concern. To provide you with the most accurate guidance, could you please share more details about your situation? 

What specific legal issue are you facing?"""
        
        domain_responses = {
            'consumer_protection': f"""I understand you're dealing with a consumer issue. Based on what you've shared, this appears to be related to {topic.legal_domain}.

To provide you with specific guidance, I need a few more details:""",
            
            'property_disputes': f"""I see you're facing a property-related matter. Property disputes can be complex, and I want to ensure I give you the most relevant advice.

Let me gather some essential information:""",
            
            'family_law': f"""I understand you're dealing with a family law matter. These situations can be emotionally challenging, and I'm here to help guide you through the legal aspects.

To provide tailored guidance, please help me understand:"""
        }
        
        return domain_responses.get(topic.legal_domain, 
            f"I see you're dealing with a {topic.legal_domain} matter. Let me help you understand your options.")
    
    def create_structured_guidance(self, research: Dict) -> Dict:
        """Create structured legal guidance from research"""
        guidance = {
            'applicable_laws': [],
            'process_overview': {},
            'required_documents': [],
            'timeline_expectations': {},
            'fee_estimates': {}
        }
        
        procedural_data = research.get('procedural_guidance', {})
        if procedural_data:
            guidance['process_overview'] = {
                'steps': procedural_data.get('steps', []),
                'timeline': procedural_data.get('timeline', {}),
                'required_documents': procedural_data.get('required_documents', [])
            }
            
            # Extract applicable laws
            legal_framework = procedural_data.get('legal_framework', {})
            guidance['applicable_laws'] = [
                legal_framework.get('primary_act', ''),
                *legal_framework.get('governing_laws', [])
            ]
            
            # Fee estimates
            guidance['fee_estimates'] = procedural_data.get('fees', {})
        
        return guidance
    
    def format_advocate_cards(self, advocate_matches: List[Dict]) -> List[Dict]:
        """Format advocate information into cards"""
        cards = []
        
        for i, advocate in enumerate(advocate_matches[:3]):  # Top 3
            card = {
                'position': i + 1,
                'advocate_id': advocate.get('advocate_id'),
                'name': advocate.get('name', 'Advocate Name'),
                'experience': f"{advocate.get('experience_years', 0)} years",
                'specializations': advocate.get('specializations', []),
                'location': advocate.get('location_city', ''),
                'fee_structure': advocate.get('fee_structure', {}),
                'availability': advocate.get('availability_status', False),
                'rating': advocate.get('rating', 4.0),
                'verification': advocate.get('is_verified', False),
                'contact_info': {
                    'phone': advocate.get('phone_number', ''),
                    'email': advocate.get('contact_email', '')
                },
                'call_to_action': self.create_advocate_cta(advocate, i),
                'unique_selling_points': self.extract_advocate_usp(advocate)
            }
            cards.append(card)
        
        return cards
    
    def create_advocate_cta(self, advocate: Dict, position: int) -> Dict:
        """Create call-to-action for advocate"""
        urgency_messages = [
            "🚨 Book Priority Consultation",
            "⭐ Schedule Expert Consultation",
            "🏆 Connect with Top Advocate"
        ]
        
        return {
            'primary_button': {
                'text': urgency_messages[position] if position < len(urgency_messages) else "Book Consultation",
                'action': f"book_consultation:{advocate.get('advocate_id')}",
                'style': 'primary' if position == 0 else 'secondary'
            },
            'secondary_button': {
                'text': "View Profile",
                'action': f"view_profile:{advocate.get('advocate_id')}",
                'style': 'outline'
            }
        }
    
    def create_consultation_prep_kit(self, topic: ConversationTopic) -> Dict:
        """Create consultation preparation materials"""
        if not topic:
            return {}
        
        domain_specific_questions = {
            'consumer_protection': [
                "What product or service was defective?",
                "When did you purchase it and from whom?",
                "What attempts have you made to resolve this with the seller?",
                "Do you have purchase receipts, warranty documents?",
                "What specific damages or losses have you suffered?"
            ],
            'property_disputes': [
                "What type of property is involved (residential/commercial/land)?",
                "What documents do you have (sale deed, title documents)?",
                "Who are the other parties claiming rights?",
                "When did this dispute begin?",
                "Have you received any legal notices?"
            ],
            'family_law': [
                "What is the current status of your marriage?",
                "Are there children involved? What are their ages?",
                "Have you attempted mediation or counseling?",
                "What are your main concerns (custody, property, maintenance)?",
                "Do you have marriage certificate and other relevant documents?"
            ]
        }
        
        return {
            'essential_questions': domain_specific_questions.get(topic.legal_domain, []),
            'documents_to_bring': self.get_required_documents(topic.legal_domain),
            'fee_discussion_points': [
                "What are your total estimated fees including court costs?",
                "What is your payment structure?",
                "Are there any additional costs I should be aware of?",
                "What is the estimated timeline for resolution?"
            ],
            'success_factors': self.get_success_factors(topic.legal_domain)
        }
    
    def get_required_documents(self, domain: str) -> List[str]:
        """Get required documents by legal domain"""
        documents = {
            'consumer_protection': [
                "Purchase receipts/invoices",
                "Warranty/guarantee documents",
                "Communication with seller/service provider",
                "Photos/videos of defective product",
                "Medical reports (if applicable)"
            ],
            'property_disputes': [
                "Original sale deed",
                "Title documents",
                "Survey settlement records",
                "Tax payment receipts",
                "Possession documents",
                "Any previous legal notices"
            ],
            'family_law': [
                "Marriage certificate",
                "Identity documents (Aadhaar, PAN)",
                "Income documents",
                "Children's birth certificates",
                "Property documents",
                "Bank statements"
            ]
        }
        return documents.get(domain, [])

class ResponseRenderer:
    """Renders responses in multiple formats"""
    
    def render_response(self, response_data: Dict, format_type: str = 'json') -> str:
        """Render response in specified format"""
        if format_type == 'json':
            return json.dumps(response_data, indent=2)
        elif format_type == 'markdown':
            return self.render_markdown(response_data)
        elif format_type == 'html':
            return self.render_html(response_data)
        else:
            return str(response_data)
    
    def render_markdown(self, response_data: Dict) -> str:
        """Render response as markdown"""
        markdown_content = []
        
        # Main response
        if 'conversational_response' in response_data:
            markdown_content.append(response_data['conversational_response'])
            markdown_content.append('\n---\n')
        
        # Structured guidance
        if 'structured_guidance' in response_data:
            guidance = response_data['structured_guidance']
            markdown_content.append('## 📋 Legal Guidance\n')
            
            if guidance.get('applicable_laws'):
                markdown_content.append('### Applicable Laws:')
                for law in guidance['applicable_laws']:
                    markdown_content.append(f"- {law}")
                markdown_content.append('')
            
            if guidance.get('process_overview', {}).get('steps'):
                markdown_content.append('### Process Steps:')
                for i, step in enumerate(guidance['process_overview']['steps'], 1):
                    markdown_content.append(f"{i}. {step}")
                markdown_content.append('')
        
        # Risk alerts
        if 'risk_alerts' in response_data:
            risk = response_data['risk_alerts']
            urgency_level = risk.get('urgency_level', 'medium')
            markdown_content.append(f'## ⚠️ Risk Assessment - {urgency_level.upper()}\n')
            markdown_content.append(f"**Risk Score:** {risk.get('risk_score', 0)}/100\n")
            markdown_content.append(f"**Recommended Action:** {risk.get('recommended_action_timeline', 'Within 1 week')}\n")
        
        # Advocate recommendations
        if 'recommendation_cards' in response_data:
            markdown_content.append('## 👨‍💼 Recommended Legal Professionals\n')
            for card in response_data['recommendation_cards']:
                markdown_content.append(f"### {card['position']}. {card['name']}")
                markdown_content.append(f"**Experience:** {card['experience']}")
                markdown_content.append(f"**Specializations:** {', '.join(card['specializations'])}")
                markdown_content.append(f"**Location:** {card['location']}")
                markdown_content.append(f"**Consultation Fee:** ₹{card['fee_structure'].get('Consultation', 'Contact for details')}")
                markdown_content.append('')
        
        return '\n'.join(markdown_content)
```

## 🎮 7. INTERACTION MANAGEMENT & LEARNING SYSTEM
*Following Technical Flow: Feedback & Interaction Handling + Learning & Adaptation*

```python
class InteractionHandler:
    """Processes user interactions and feedback"""
    
    def __init__(self):
        self.interaction_patterns = {}
        
    async def handle_user_action(self, session_id: str, action: Dict) -> Dict:
        """Handle various user actions"""
        action_type = action.get('type')
        action_data = action.get('data', {})
        
        if action_type == 'advocate_booking':
            return await self.handle_advocate_booking(session_id, action_data)
        elif action_type == 'clarification_request':
            return await self.handle_clarification_request(session_id, action_data)
        elif action_type == 'feedback_submission':
            return await self.handle_feedback_submission(session_id, action_data)
        elif action_type == 'document_upload':
            return await self.handle_document_upload(session_id, action_data)
        else:
            return {'status': 'unknown_action', 'message': 'Action type not recognized'}
    
    async def handle_advocate_booking(self, session_id: str, booking_data: Dict) -> Dict:
        """Handle advocate booking requests"""
        advocate_id = booking_data.get('advocate_id')
        consultation_type = booking_data.get('consultation_type', 'general')
        preferred_time = booking_data.get('preferred_time')
        
        # Process booking logic here
        booking_result = {
            'status': 'booking_initiated',
            'advocate_id': advocate_id,
            'consultation_type': consultation_type,
            'booking_reference': f"BK{session_id[:8]}{advocate_id[:8]}",
            'next_steps': [
                'Advocate will be notified within 2 hours',
                'You will receive confirmation via email/SMS',
                'Prepare documents as discussed'
            ]
        }
        
        return booking_result
    
    async def handle_clarification_request(self, session_id: str, clarification_data: Dict) -> Dict:
        """Handle requests for clarification"""
        question = clarification_data.get('question')
        context = clarification_data.get('context', {})
        
        # Generate clarification response
        clarification_response = {
            'status': 'clarification_provided',
            'question': question,
            'response': await self.generate_clarification_response(question, context),
            'additional_resources': self.get_clarification_resources(question)
        }
        
        return clarification_response
    
    async def generate_clarification_response(self, question: str, context: Dict) -> str:
        """Generate clarification response using Ollama"""
        prompt = f"""
        The user is asking for clarification about: "{question}"
        
        Context: {json.dumps(context, indent=2)}
        
        Provide a clear, simple explanation that addresses their specific confusion.
        Use plain language and avoid legal jargon.
        """
        
        try:
            response = ollama.chat(
                model="llama3.1:3b",
                messages=[{"role": "user", "content": prompt}]
            )
            return response['message']['content']
        except:
            return "I'd be happy to clarify that for you. Could you please rephrase your question or let me know which specific part you'd like me to explain in more detail?"

class FeedbackCollector:
    """Collects and processes user feedback"""
    
    def __init__(self):
        self.feedback_storage = {}
        
    def collect_feedback(self, session_id: str, feedback: Dict):
        """Collect user feedback"""
        if session_id not in self.feedback_storage:
            self.feedback_storage[session_id] = []
        
        feedback_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'type': feedback.get('type', 'general'),
            'rating': feedback.get('rating'),
            'comment': feedback.get('comment', ''),
            'helpful_elements': feedback.get('helpful_elements', []),
            'improvement_suggestions': feedback.get('improvement_suggestions', []),
            'satisfaction_score': feedback.get('satisfaction_score'),
            'would_recommend': feedback.get('would_recommend')
        }
        
        self.feedback_storage[session_id].append(feedback_entry)
        
        return {
            'status': 'feedback_collected',
            'feedback_id': f"FB{session_id[:8]}{len(self.feedback_storage[session_id])}",
            'thank_you_message': 'Thank you for your feedback! It helps us improve our service.'
        }

class ConversationAnalyzer:
    """Analyzes conversations for optimization"""
    
    def __init__(self):
        self.analysis_metrics = {
            'turn_success_rate': {},
            'clarification_patterns': {},
            'drop_off_points': {},
            'conversion_funnel': {}
        }
    
    def analyze_conversation(self, session_id: str, conversation_data: Dict) -> Dict:
        """Analyze conversation effectiveness"""
        analysis = {
            'conversation_flow_effectiveness': self.analyze_flow_effectiveness(conversation_data),
            'user_satisfaction_indicators': self.extract_satisfaction_indicators(conversation_data),
            'improvement_opportunities': self.identify_improvement_opportunities(conversation_data),
            'success_metrics': self.calculate_success_metrics(conversation_data)
        }
        
        return analysis
    
    def analyze_flow_effectiveness(self, conversation_data: Dict) -> Dict:
        """Analyze how effective the conversation flow was"""
        messages = conversation_data.get('messages', [])
        stages_completed = conversation_data.get('stages_completed', [])
        
        effectiveness = {
            'total_turns': len(messages),
            'stages_progression_rate': len(stages_completed) / 6 * 100,  # 6 total stages
            'average_response_relevance': self.calculate_response_relevance(messages),
            'flow_efficiency': self.calculate_flow_efficiency(conversation_data)
        }
        
        return effectiveness
    
    def extract_satisfaction_indicators(self, conversation_data: Dict) -> Dict:
        """Extract indicators of user satisfaction"""
        messages = conversation_data.get('messages', [])
        feedback = conversation_data.get('feedback', [])
        
        positive_indicators = 0
        negative_indicators = 0
        
        satisfaction_keywords = {
            'positive': ['thank', 'helpful', 'great', 'excellent', 'clear', 'understand'],
            'negative': ['confused', 'unclear', 'wrong', 'unhelpful', 'frustrating']
        }
        
        for message in messages:
            content = message.get('content', '').lower()
            for keyword in satisfaction_keywords['positive']:
                if keyword in content:
                    positive_indicators += 1
            for keyword in satisfaction_keywords['negative']:
                if keyword in content:
                    negative_indicators += 1
        
        return {
            'positive_sentiment_count': positive_indicators,
            'negative_sentiment_count': negative_indicators,
            'sentiment_ratio': positive_indicators / max(negative_indicators, 1),
            'explicit_feedback_score': self.average_feedback_score(feedback)
        }
    
    def calculate_response_relevance(self, messages: List[Dict]) -> float:
        """Calculate average relevance of responses"""
        # Simplified relevance calculation
        # In practice, this would use more sophisticated NLP analysis
        return 0.85  # Placeholder
    
    def average_feedback_score(self, feedback: List[Dict]) -> float:
        """Calculate average feedback score"""
        if not feedback:
            return 0.0
        
        scores = [f.get('satisfaction_score', 0) for f in feedback if f.get('satisfaction_score')]
        return sum(scores) / len(scores) if scores else 0.0

class ConversationLearner:
    """Learns from conversation patterns"""
    
    def __init__(self):
        self.learned_patterns = {
            'successful_flows': [],
            'common_user_intents': {},
            'effective_responses': {},
            'optimization_insights': []
        }
    
    def learn_from_conversation(self, conversation_analysis: Dict, conversation_data: Dict):
        """Learn patterns from analyzed conversations"""
        # Extract successful patterns
        if conversation_analysis.get('success_metrics', {}).get('overall_success', 0) > 0.8:
            self.learned_patterns['successful_flows'].append({
                'flow_sequence': conversation_data.get('stages_completed', []),
                'user_characteristics': conversation_data.get('user_profile', {}),
                'success_factors': conversation_analysis.get('success_factors', [])
            })
        
        # Learn common user intents
        self.update_intent_patterns(conversation_data)
        
        # Identify effective responses
        self.identify_effective_responses(conversation_data, conversation_analysis)
    
    def update_intent_patterns(self, conversation_data: Dict):
        """Update understanding of user intent patterns"""
        messages = conversation_data.get('messages', [])
        
        for message in messages:
            if message.get('role') == 'user':
                intent = message.get('classified_intent')
                content_type = self.classify_content_type(message.get('content', ''))
                
                if intent not in self.learned_patterns['common_user_intents']:
                    self.learned_patterns['common_user_intents'][intent] = {
                        'frequency': 0,
                        'content_patterns': [],
                        'successful_responses': []
                    }
                
                self.learned_patterns['common_user_intents'][intent]['frequency'] += 1
                self.learned_patterns['common_user_intents'][intent]['content_patterns'].append(content_type)
    
    def classify_content_type(self, content: str) -> str:
        """Classify the type of content in user message"""
        content_lower = content.lower()
        
        if any(word in content_lower for word in ['what', 'how', 'when', 'where', 'why']):
            return 'question'
        elif any(word in content_lower for word in ['my', 'i have', 'i am facing']):
            return 'problem_description'
        elif any(word in content_lower for word in ['thank', 'appreciate', 'helpful']):
            return 'appreciation'
        else:
            return 'general'

class PersonalizationEngine:
    """Personalizes responses based on user patterns"""
    
    def __init__(self):
        self.user_profiles = {}
        
    def update_user_profile(self, user_id: str, interaction_data: Dict):
        """Update user profile based on interactions"""
        if user_id not in self.user_profiles:
            self.user_profiles[user_id] = {
                'communication_style': 'formal',
                'legal_knowledge_level': 'basic',
                'preferred_detail_level': 'medium',
                'common_legal_domains': [],
                'interaction_history': []
            }
        
        profile = self.user_profiles[user_id]
        
        # Update communication style based on language used
        self.update_communication_style(profile, interaction_data)
        
        # Update knowledge level based on questions asked
        self.update_knowledge_level(profile, interaction_data)
        
        # Track legal domains of interest
        self.update_legal_domains(profile, interaction_data)
    
    def update_communication_style(self, profile: Dict, interaction_data: Dict):
        """Update preferred communication style"""
        user_messages = [msg for msg in interaction_data.get('messages', []) 
                        if msg.get('role') == 'user']
        
        formal_indicators = ['please', 'kindly', 'would you', 'could you']
        casual_indicators = ['hi', 'hey', 'thanks', 'ok', 'yeah']
        
        formal_count = sum(1 for msg in user_messages 
                          for indicator in formal_indicators 
                          if indicator in msg.get('content', '').lower())
        
        casual_count = sum(1 for msg in user_messages 
                          for indicator in casual_indicators 
                          if indicator in msg.get('content', '').lower())
        
        if formal_count > casual_count:
            profile['communication_style'] = 'formal'
        elif casual_count > formal_count:
            profile['communication_style'] = 'casual'
        else:
            profile['communication_style'] = 'neutral'
    
    def personalize_response(self, response: str, user_id: str) -> str:
        """Personalize response based on user profile"""
        if user_id not in self.user_profiles:
            return response
        
        profile = self.user_profiles[user_id]
        
        # Adjust tone based on communication style
        if profile['communication_style'] == 'formal':
            response = self.make_response_formal(response)
        elif profile['communication_style'] == 'casual':
            response = self.make_response_casual(response)
        
        # Adjust detail level
        if profile['legal_knowledge_level'] == 'basic':
            response = self.simplify_legal_language(response)
        elif profile['legal_knowledge_level'] == 'advanced':
            response = self.add_technical_details(response)
        
        return response
    
    def make_response_formal(self, response: str) -> str:
        """Make response more formal"""
        # Simple replacements for formality
        replacements = {
            "Hi": "Good day",
            "Thanks": "Thank you",
            "Ok": "Understood",
            "I'll": "I will",
            "You're": "You are"
        }
        
        for informal, formal in replacements.items():
            response = response.replace(informal, formal)
        
        return response
    
    def simplify_legal_language(self, response: str) -> str:
        """Simplify legal language for basic users"""
        # Replace complex legal terms with simpler explanations
        simplifications = {
            "jurisdiction": "court area/authority",
            "precedent": "previous court decision",
            "appellant": "person appealing",
            "respondent": "other party",
            "plaintiff": "person filing the case",
            "defendant": "person being sued"
        }
        
        for complex_term, simple_term in simplifications.items():
            response = response.replace(complex_term, f"{simple_term} ({complex_term})")
        
        return response
```


## 🚀 8. MAIN APPLICATION INTEGRATION
*Complete FastAPI Application with WebSocket Support*

```python
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import asyncio
import uvicorn
from contextlib import asynccontextmanager

# Initialize training data path
TRAINING_DATA_PATH = "../Database/training_data"

# Global managers
session_manager = SessionManager()
auth_service = AuthenticationService("your-secret-key-here")
conversation_orchestrator = ConversationOrchestrator(TRAINING_DATA_PATH)
delivery_engine = DeliveryEngine()
interaction_handler = InteractionHandler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("🚀 LegalLink AI Starting...")
    print("📚 Loading training data...")
    print("🤖 Initializing AI agents...")
    print("✅ LegalLink AI Ready!")
    
    yield
    
    # Shutdown
    print("🛑 LegalLink AI Shutting down...")

app = FastAPI(
    title="Interactive LegalLink AI",
    description="Advanced AI Legal Assistant with Agentic RAG",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """Main WebSocket endpoint for real-time conversation"""
    session_id = await session_manager.create_session(websocket, user_id)
    delivery_engine.active_connections[session_id] = websocket
    
    try:
        # Send welcome message
        await delivery_engine.deliver_response(session_id, {
            'type': 'welcome',
            'message': 'Welcome to LegalLink AI! I\'m here to help with your legal questions.',
            'session_id': session_id
        })
        
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            
            # Show typing indicator
            await delivery_engine.send_typing_indicator(session_id, True)
            
            # Process message through conversation system
            response = await process_conversation_message(session_id, data)
            
            # Hide typing indicator
            await delivery_engine.send_typing_indicator(session_id, False)
            
            # Deliver response
            await delivery_engine.deliver_response(session_id, response)
            
    except WebSocketDisconnect:
        print(f"Client {user_id} disconnected")
        delivery_engine.active_connections.pop(session_id, None)
    except Exception as e:
        print(f"Error in WebSocket connection: {e}")
        await websocket.close()

async def process_conversation_message(session_id: str, message_data: Dict) -> Dict:
    """Process conversation message through the full pipeline"""
    try:
        # Input processing pipeline
        input_validator = InputValidator()
        context_loader = ContextLoader(session_manager)
        intent_classifier = IntentClassifier()
        
        # Validate input
        validated_input = input_validator.validate_input(message_data)
        
        # Load context
        context = await context_loader.load_conversation_context(session_id)
        
        # Classify intent
        intent = intent_classifier.classify_intent(
            validated_input['content'], 
            context
        )
        
        # NLP Processing
        nlp_processor = MultilingualNLP()
        entity_extractor = EntityExtractor()
        conversation_nlu = ConversationNLU()
        
        # Process language
        nlp_result = nlp_processor.process_multilingual_input(validated_input['content'])
        
        # Extract entities
        entities = entity_extractor.extract_legal_entities(nlp_result['english_text'])
        
        # Resolve coreferences
        resolved_text = conversation_nlu.resolve_coreferences(
            nlp_result['english_text'], 
            context
        )
        
        # Conversation state management
        state_manager = StateManager()
        topic_tracker = TopicTracker()
        progress_tracker = ProgressTracker()
        memory_manager = MemoryManager()
        
        # Update conversation state
        if entities:
            topic = topic_tracker.classify_legal_domain(resolved_text, entities)
            state_manager.update_conversation_state(session_id, {
                'topic': topic,
                'entities_collected': entities
            })
        
        # Prepare LangGraph state
        conversation_state = ConversationState(
            messages=[HumanMessage(content=resolved_text)],
            session_id=session_id,
            user_context=context,
            conversation_stage=ConversationStage.INITIAL_CONTACT,
            current_topic=topic if entities else None,
            extracted_entities=entities,
            risk_assessment={},
            advocate_matches=[],
            response_components={},
            next_action="process"
        )
        
        # Process through LangGraph workflow
        result = await conversation_orchestrator.workflow.ainvoke(conversation_state)
        
        # Flow decision and response assembly
        flow_engine = FlowDecisionEngine()
        response_assembler = ResponseAssembler(TRAINING_DATA_PATH)
        
        next_flow = flow_engine.determine_next_flow(result)
        assembled_response = response_assembler.assemble_response(result, next_flow)
        
        # Store interaction
        memory_manager.store_interaction(
            session_id, 
            context.get('user_id', 'anonymous'),
            {
                'user_message': validated_input['content'],
                'intent': intent.value,
                'entities': entities,
                'topic': topic.__dict__ if topic else None,
                'response': assembled_response
            }
        )
        
        return assembled_response
        
    except Exception as e:
        print(f"Error processing conversation: {e}")
        return {
            'type': 'error',
            'message': 'I apologize, but I encountered an error processing your request. Please try again.',
            'error_details': str(e) if app.debug else None
        }

@app.post("/api/v1/auth/login")
async def login(credentials: Dict):
    """User authentication endpoint"""
    try:
        # Validate credentials (implement your auth logic)
        user_id = credentials.get('user_id')
        password = credentials.get('password')
        
        # Create session
        session = await session_manager.create_session(user_id)
        
        # Generate JWT token
        token = auth_service.generate_token({
            'user_id': user_id,
            'session_id': session.session_id

        })
        
        return {
            'access_token': token,
            'session_id': session.session_id,
            'user_profile': session.user_profile
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication failed")

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time conversation"""
    try:
        await connection_manager.connect(websocket, session_id)
        
        # Load session context
        context = await session_manager.get_session_context(session_id)
        
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            
            # Process the conversation
            response = await process_conversation_message(data, context)
            
            # Send response back to client
            await connection_manager.send_message(session_id, response)
            
            # Record interaction
            await interaction_manager.handle_user_interaction(session_id, {
                'type': 'message',
                'content': data,
                'response': response
            })
    
    except WebSocketDisconnect:
        connection_manager.disconnect(session_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close(code=1000)

async def process_conversation_message(message_data: Dict, context: Dict) -> Dict:
    """Process conversation message through the full pipeline"""
    try:
        session_id = context.get('session_id')
        
        # 1. Input Processing & Validation
        validated_input = input_processor.process_input(
            message_data.get('content', ''),
            message_data.get('metadata', {})
        )
        
        # 2. NLP Processing
        nlp_result = nlp_engine.process_message(
            validated_input['content'],
            context.get('conversation_history', [])
        )
        
        intent = nlp_result['intent']
        entities = nlp_result['entities']
        
        # 3. State Management
        current_state = state_manager.get_conversation_state(session_id)
        topic = state_manager.update_topic_tracking(session_id, intent, entities)
        progress = state_manager.update_conversation_progress(session_id, intent)
        
        # 4. Agent Orchestration
        agent_input = {
            'user_message': validated_input['content'],
            'intent': intent,
            'entities': entities,
            'context': {
                **context,
                'conversation_state': current_state,
                'current_topic': topic.__dict__ if topic else None,
                'progress': progress.__dict__ if progress else None
            }
        }
        
        result = await agent_orchestrator.process_conversation(agent_input)
        
        # 5. Flow Decision & Response Assembly
        flow_engine = FlowDecisionEngine()
        response_assembler = ResponseAssembler(TRAINING_DATA_PATH)
        
        next_flow = flow_engine.determine_next_flow(result)
        assembled_response = response_assembler.assemble_response(result, next_flow)
        
        # 6. Store Conversation Memory
        memory_manager.store_interaction(
            session_id, 
            context.get('user_id', 'anonymous'),
            {
                'user_message': validated_input['content'],
                'intent': intent.value,
                'entities': entities,
                'topic': topic.__dict__ if topic else None,
                'response': assembled_response
            }
        )
        
        return assembled_response
        
    except Exception as e:
        print(f"Error processing conversation: {e}")
        return {
            'type': 'error',
            'message': 'I apologize, but I encountered an error processing your request. Please try again.',
            'error_details': str(e) if app.debug else None
        }

@app.post("/api/v1/feedback")
async def submit_feedback(feedback_data: Dict, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Submit user feedback"""
    try:
        # Verify token
        payload = auth_service.verify_token(credentials.credentials)
        session_id = payload.get('session_id')
        
        # Collect feedback
        result = await interaction_manager.collect_feedback(session_id, feedback_data)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/session/{session_id}/history")
async def get_conversation_history(session_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get conversation history"""
    try:
        # Verify token
        payload = auth_service.verify_token(credentials.credentials)
        
        # Get history
        history = memory_manager.get_conversation_history(session_id)
        
        return {'history': history}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/advocates/recommendations/{session_id}")
async def get_advocate_recommendations(session_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get advocate recommendations for session"""
    try:
        # Verify token
        payload = auth_service.verify_token(credentials.credentials)
        
        # Get context and generate recommendations
        context = await session_manager.get_session_context(session_id)
        
        # Use advocate matching agent
        advocate_matcher = AdvocateMatchingAgent(TRAINING_DATA_PATH)
        recommendations = advocate_matcher.find_matching_advocates(context)
        
        return {'recommendations': recommendations}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '2.0.0'
    }

# 🏃‍♂️ 17. APPLICATION STARTUP & CONFIGURATION

@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    print("🚀 Starting LegalLink Interactive AI Assistant...")
    
    # Initialize databases
    await session_manager.initialize()
    await memory_manager.initialize()
    
    # Load training data
    print("📚 Loading training data...")
    await agent_orchestrator.load_training_data()
    
    # Initialize ML models
    print("🧠 Initializing AI models...")
    await nlp_engine.initialize_models()
    
    print("✅ LegalLink AI Assistant is ready!")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("🛑 Shutting down LegalLink AI Assistant...")
    await session_manager.cleanup()
    await memory_manager.cleanup()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

# 📋 18. DEPLOYMENT & USAGE INSTRUCTIONS

"""
## 🚀 Deployment Instructions

### Prerequisites:
```bash
pip install fastapi uvicorn websockets redis pymongo jwt langchain langgraph ollama
pip install spacy transformers torch sentence-transformers
python -m spacy download en_core_web_sm
```

### Environment Setup:
```bash
# Start Redis
redis-server

# Start MongoDB
mongod

# Start Ollama (with required models)
ollama pull llama3
ollama pull gemma2
```

### Run Application:
```bash
python main.py
```

### API Endpoints:
- WebSocket /ws/{user_id} - Real-time conversation (Public)
- POST /api/v1/feedback - Submit feedback (Public)
- GET /api/v1/session/{session_id}/history - Get conversation history (Public)
- GET /api/v1/advocates/recommendations/{session_id} - Get advocate recommendations (Public)
- GET /health - Health check (Public)

### Usage Flow:
1. User directly connects via WebSocket (No authentication required)
2. Frontend establishes WebSocket connection with auto-generated user_id
3. Real-time conversation via WebSocket
4. System processes through full pipeline:
   - Input validation & processing
   - NLP analysis (intent, entities)
   - State management & topic tracking
   - Multi-agent orchestration (dialogue, research, risk analysis, advocate matching)
   - Flow decision & response assembly
   - Real-time delivery via WebSocket
5. Continuous learning from user interactions

### Key Features:
✅ Real-time WebSocket-based conversation
✅ Multi-agent AI system with LangGraph orchestration
✅ Comprehensive legal research with Indian Kanoon API
✅ Advanced risk assessment and mitigation
✅ Intelligent advocate matching and recommendations
✅ Conversation flow optimization for engagement and conversion
✅ Multi-format response assembly (text, structured data, interactive elements)
✅ Session management with Redis and MongoDB
✅ Public access - No authentication required
✅ Feedback collection and system learning
✅ Full integration of training data schemas
✅ Scalable and production-ready architecture

This implementation follows both the data flow and technical flow diagrams exactly while leveraging all available training data for maximum AI capability and user experience.
"""