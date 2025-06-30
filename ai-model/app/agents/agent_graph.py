"""
Agent Graph - LangGraph Implementation for Interactive LegalLink AI
Following Technical Flow: Agentic Conversation System
"""
from typing import Dict, List, Optional, Any, TypedDict, Annotated
import operator
from datetime import datetime
import logging
import asyncio

# LangGraph imports (if available, otherwise use our custom implementation)
try:
    from langgraph.graph import Graph, StateGraph, END
    from langgraph.prebuilt import ToolExecutor
    LANGGRAPH_AVAILABLE = True
except ImportError:
    LANGGRAPH_AVAILABLE = False
    # Custom implementation for graph execution
    pass

from .legal_agents import (
    AgentState, DialogueAgent, ClassificationAgent, ClarificationAgent,
    LegalReasoningAgent, RiskAssessmentAgent, RecommendationAgent,
    ContextAgent, ProgressAgent, MemoryAgent
)

logger = logging.getLogger(__name__)

class AgentGraphState(TypedDict):
    """State structure for the agent graph"""
    session_id: str
    user_id: str
    current_message: str
    conversation_history: List[Dict[str, Any]]
    user_context: Dict[str, Any]
    conversation_stage: str
    extracted_entities: Dict[str, Any]
    intent: str
    confidence: float
    urgency_level: str
    legal_domain: str
    next_action: str
    response_data: Dict[str, Any]
    memory: Dict[str, Any]
    flow_decision: str
    processing_complete: bool

class AgentGraph:
    """Main agent orchestration graph following the technical flow"""
    
    def __init__(self):
        self.agents = {
            "dialogue": DialogueAgent(),
            "classification": ClassificationAgent(),
            "clarification": ClarificationAgent(),
            "legal_reasoning": LegalReasoningAgent(),
            "risk_assessment": RiskAssessmentAgent(),
            "recommendation": RecommendationAgent(),
            "context": ContextAgent(),
            "progress": ProgressAgent(),
            "memory": MemoryAgent()
        }
        
        self.graph = None
        self._build_graph()
    
    def _build_graph(self):
        """Build the agent execution graph following the technical flow"""
        if LANGGRAPH_AVAILABLE:
            self._build_langgraph()
        else:
            self._build_custom_graph()
    
    def _build_langgraph(self):
        """Build graph using LangGraph"""
        workflow = StateGraph(AgentGraphState)
        
        # Add nodes for each processing stage
        workflow.add_node("context_agent", self._context_agent_node)
        workflow.add_node("dialogue_agent", self._dialogue_agent_node)
        workflow.add_node("classification_agent", self._classification_agent_node)
        workflow.add_node("clarification_agent", self._clarification_agent_node)
        workflow.add_node("legal_reasoning_agent", self._legal_reasoning_agent_node) 
        workflow.add_node("risk_assessment_agent", self._risk_assessment_agent_node)
        workflow.add_node("recommendation_agent", self._recommendation_agent_node)
        workflow.add_node("memory_agent", self._memory_agent_node)
        workflow.add_node("progress_agent", self._progress_agent_node)
        workflow.add_node("flow_decision", self._flow_decision_node)
        
        # Define the flow following the technical architecture
        workflow.set_entry_point("context_agent")
        
        # Context → Dialogue
        workflow.add_edge("context_agent", "dialogue_agent")
        
        # Dialogue → Classification
        workflow.add_edge("dialogue_agent", "classification_agent")
        
        # Classification → Parallel processing of specialized agents
        workflow.add_edge("classification_agent", "clarification_agent")
        workflow.add_edge("classification_agent", "legal_reasoning_agent")
        workflow.add_edge("classification_agent", "risk_assessment_agent")
        workflow.add_edge("classification_agent", "recommendation_agent")
        
        # All specialized agents → Memory
        workflow.add_edge("clarification_agent", "memory_agent")
        workflow.add_edge("legal_reasoning_agent", "memory_agent")
        workflow.add_edge("risk_assessment_agent", "memory_agent") 
        workflow.add_edge("recommendation_agent", "memory_agent")
        
        # Memory → Progress
        workflow.add_edge("memory_agent", "progress_agent")
        
        # Progress → Flow Decision
        workflow.add_edge("progress_agent", "flow_decision")
        
        # Flow Decision → End or Loop
        workflow.add_conditional_edges(
            "flow_decision",
            self._should_continue,
            {
                "continue": "dialogue_agent",
                "end": END
            }
        )
        
        self.graph = workflow.compile()
    
    def _build_custom_graph(self):
        """Build custom graph execution when LangGraph is not available"""
        self.execution_order = [
            "context_agent",
            "dialogue_agent", 
            "classification_agent",
            # Parallel processing
            ["clarification_agent", "legal_reasoning_agent", "risk_assessment_agent", "recommendation_agent"],
            "memory_agent",
            "progress_agent",
            "flow_decision"
        ]
    
    async def process_message(
        self,
        session_id: str,
        user_id: str,
        message: str,
        conversation_history: List[Dict[str, Any]],
        user_context: Dict[str, Any],
        memory: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Process a user message through the agent graph"""
        
        # Initialize state
        initial_state = AgentGraphState(
            session_id=session_id,
            user_id=user_id,
            current_message=message,
            conversation_history=conversation_history,
            user_context=user_context,
            conversation_stage="greeting",
            extracted_entities={},
            intent="",
            confidence=0.0,
            urgency_level="LOW",
            legal_domain="",
            next_action="",
            response_data={},
            memory=memory,
            flow_decision="",
            processing_complete=False
        )
        
        if LANGGRAPH_AVAILABLE and self.graph:
            # Use LangGraph execution
            result = await self.graph.ainvoke(initial_state)
            return result
        else:
            # Use custom execution
            return await self._execute_custom_graph(initial_state)
    
    async def _execute_custom_graph(self, state: AgentGraphState) -> Dict[str, Any]:
        """Execute the graph using custom implementation"""
        agent_state = self._convert_to_agent_state(state)
        
        try:
            for step in self.execution_order:
                if isinstance(step, list):
                    # Parallel execution
                    tasks = []
                    for agent_name in step:
                        if agent_name in self.agents:
                            tasks.append(self.agents[agent_name].process(agent_state))
                    
                    # Wait for all parallel agents to complete
                    if tasks:
                        await asyncio.gather(*tasks)
                else:
                    # Sequential execution
                    if step == "flow_decision":
                        flow_decision = await self._flow_decision_logic(agent_state)
                        agent_state.response_data["flow_decision"] = flow_decision
                        
                        if flow_decision == "end":
                            break
                    elif step in self.agents:
                        agent_state = await self.agents[step].process(agent_state)
            
            return self._prepare_response(agent_state)
            
        except Exception as e:
            logger.error(f"Error in agent graph execution: {e}")
            return {
                "type": "error",
                "content": "I apologize, but I encountered an error processing your request. Please try again.",
                "timestamp": datetime.now().isoformat(),
                "session_id": state["session_id"]
            }
    
    def _convert_to_agent_state(self, graph_state: AgentGraphState) -> AgentState:
        """Convert graph state to agent state"""
        from app.models import UserContext, ConversationStage, UrgencyLevel
        
        # Create UserContext object
        user_context = UserContext(
            legal_issue=graph_state["user_context"].get("legal_issue"),
            location=graph_state["user_context"].get("location"),
            urgency_level=UrgencyLevel(graph_state["user_context"].get("urgency_level", "LOW")),
            budget_range=graph_state["user_context"].get("budget_range")
        )
        
        return AgentState(
            session_id=graph_state["session_id"],
            user_id=graph_state["user_id"],
            current_message=graph_state["current_message"],
            conversation_history=graph_state["conversation_history"],
            user_context=user_context,
            conversation_stage=ConversationStage(graph_state["conversation_stage"]),
            extracted_entities=graph_state["extracted_entities"],
            intent=graph_state["intent"],
            confidence=graph_state["confidence"],
            urgency_level=UrgencyLevel(graph_state["urgency_level"]),
            legal_domain=graph_state["legal_domain"],
            next_action=graph_state["next_action"],
            response_data=graph_state["response_data"],
            memory=graph_state["memory"]
        )
    
    async def _flow_decision_logic(self, state: AgentState) -> str:
        """Decision logic for flow control"""
        # Check if clarification is needed
        if state.response_data.get("clarification_needed", False):
            return "clarification_request"
        
        # Check completion status
        completion_status = state.response_data.get("completion_status", {})
        if completion_status.get("ready_for_closure", False):
            return "end"
        
        # Check conversation stage
        if state.conversation_stage.value in ["greeting", "information_gathering"]:
            return "continue"
        
        # Default to continue
        return "continue"
    
    def _prepare_response(self, state: AgentState) -> Dict[str, Any]:
        """Prepare final response based on agent processing"""
        response = {
            "type": "ai_response",
            "timestamp": datetime.now().isoformat(),
            "session_id": state.session_id
        }
        
        # Determine response content based on next action
        if state.next_action == "provide_greeting":
            response["content"] = self._generate_greeting_response(state)
        elif state.next_action == "request_clarification":
            response["content"] = self._generate_clarification_response(state)
        elif state.next_action == "provide_legal_guidance":
            response["content"] = self._generate_guidance_response(state)
        elif state.next_action == "recommend_advocates":
            response["content"] = self._generate_recommendation_response(state)
        else:
            response["content"] = self._generate_general_response(state)
        
        # Add metadata
        response["metadata"] = {
            "intent": state.intent,
            "confidence": state.confidence,
            "legal_domain": state.legal_domain,
            "urgency_level": state.urgency_level.value,
            "conversation_stage": state.conversation_stage.value
        }
        
        # Add quick actions if available
        if "quick_actions" in state.response_data:
            response["quick_actions"] = state.response_data["quick_actions"]
        
        # Add advocate recommendations if available
        if "advocate_search" in state.response_data:
            response["advocate_recommendations"] = state.response_data["advocate_search"]
        
        # Add progress information
        if "progress" in state.response_data:
            response["progress"] = state.response_data["progress"]
        
        return response
    
    def _generate_greeting_response(self, state: AgentState) -> str:
        """Generate greeting response"""
        greeting_templates = [
            "Hello! I'm your Legal AI Assistant. I'm here to help you with your legal questions and connect you with qualified advocates.",
            "Welcome to LegalLink AI! How can I assist you with your legal matter today?",
            "Hi there! I'm here to provide legal guidance and help you find the right advocate for your case."
        ]
        
        # Select based on time of day or randomize
        import random
        return random.choice(greeting_templates)
    
    def _generate_clarification_response(self, state: AgentState) -> str:
        """Generate clarification request response"""
        base_response = "I'd like to better understand your situation to provide the most helpful guidance. "
        
        questions = state.response_data.get("questions", [])
        if questions:
            question_text = questions[0]["question"]  # Start with first question
            return base_response + question_text
        
        return base_response + "Could you provide more details about your legal issue?"
    
    def _generate_guidance_response(self, state: AgentState) -> str:
        """Generate legal guidance response"""
        guidance = state.response_data.get("legal_guidance", "")
        relevant_laws = state.response_data.get("relevant_laws", [])
        next_steps = state.response_data.get("next_steps", [])
        
        response = guidance
        
        if relevant_laws:
            response += f"\n\nRelevant laws that may apply: {', '.join(relevant_laws)}"
        
        if next_steps:
            response += "\n\nRecommended next steps:\n"
            for i, step in enumerate(next_steps, 1):
                response += f"{i}. {step}\n"
        
        return response
    
    def _generate_recommendation_response(self, state: AgentState) -> str:
        """Generate advocate recommendation response"""
        recommendations = state.response_data.get("recommendations", [])
        
        response = "Based on your legal issue, I recommend the following:\n\n"
        
        for i, rec in enumerate(recommendations, 1):
            response += f"{i}. {rec}\n"
        
        response += "\nWould you like me to help you find qualified advocates in your area?"
        
        return response
    
    def _generate_general_response(self, state: AgentState) -> str:
        """Generate general response"""
        if state.legal_domain:
            return f"I understand you have a {state.legal_domain.lower()} related matter. Let me help you with that."
        
        return "I'm here to help with your legal question. Could you tell me more about your situation?"
    
    # Node implementations for LangGraph
    async def _context_agent_node(self, state: AgentGraphState) -> AgentGraphState:
        """Context agent node"""
        agent_state = self._convert_to_agent_state(state)
        result = await self.agents["context"].process(agent_state)
        return self._update_graph_state(state, result)
    
    async def _dialogue_agent_node(self, state: AgentGraphState) -> AgentGraphState:
        """Dialogue agent node"""
        agent_state = self._convert_to_agent_state(state)
        result = await self.agents["dialogue"].process(agent_state)
        return self._update_graph_state(state, result)
    
    async def _classification_agent_node(self, state: AgentGraphState) -> AgentGraphState:
        """Classification agent node"""
        agent_state = self._convert_to_agent_state(state)
        result = await self.agents["classification"].process(agent_state)
        return self._update_graph_state(state, result)
    
    async def _clarification_agent_node(self, state: AgentGraphState) -> AgentGraphState:
        """Clarification agent node"""
        agent_state = self._convert_to_agent_state(state)
        result = await self.agents["clarification"].process(agent_state)
        return self._update_graph_state(state, result)
    
    async def _legal_reasoning_agent_node(self, state: AgentGraphState) -> AgentGraphState:
        """Legal reasoning agent node"""
        agent_state = self._convert_to_agent_state(state)
        result = await self.agents["legal_reasoning"].process(agent_state)
        return self._update_graph_state(state, result)
    
    async def _risk_assessment_agent_node(self, state: AgentGraphState) -> AgentGraphState:
        """Risk assessment agent node"""
        agent_state = self._convert_to_agent_state(state)
        result = await self.agents["risk_assessment"].process(agent_state)
        return self._update_graph_state(state, result)
    
    async def _recommendation_agent_node(self, state: AgentGraphState) -> AgentGraphState:
        """Recommendation agent node"""
        agent_state = self._convert_to_agent_state(state)
        result = await self.agents["recommendation"].process(agent_state)
        return self._update_graph_state(state, result)
    
    async def _memory_agent_node(self, state: AgentGraphState) -> AgentGraphState:
        """Memory agent node"""
        agent_state = self._convert_to_agent_state(state)
        result = await self.agents["memory"].process(agent_state)
        return self._update_graph_state(state, result)
    
    async def _progress_agent_node(self, state: AgentGraphState) -> AgentGraphState:
        """Progress agent node"""
        agent_state = self._convert_to_agent_state(state)
        result = await self.agents["progress"].process(agent_state)
        return self._update_graph_state(state, result)
    
    async def _flow_decision_node(self, state: AgentGraphState) -> AgentGraphState:
        """Flow decision node"""
        agent_state = self._convert_to_agent_state(state)
        flow_decision = await self._flow_decision_logic(agent_state)
        state["flow_decision"] = flow_decision
        state["processing_complete"] = flow_decision == "end"
        return state
    
    def _update_graph_state(self, graph_state: AgentGraphState, agent_state: AgentState) -> AgentGraphState:
        """Update graph state from agent state"""
        graph_state.update({
            "conversation_stage": agent_state.conversation_stage.value,
            "extracted_entities": agent_state.extracted_entities,
            "intent": agent_state.intent,
            "confidence": agent_state.confidence,
            "urgency_level": agent_state.urgency_level.value,
            "legal_domain": agent_state.legal_domain,
            "next_action": agent_state.next_action,
            "response_data": agent_state.response_data,
            "memory": agent_state.memory
        })
        return graph_state
    
    def _should_continue(self, state: AgentGraphState) -> str:
        """Determine if processing should continue"""
        return state.get("flow_decision", "end")
