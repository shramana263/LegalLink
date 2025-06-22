"""
Ollama Service for Local AI Model Integration
Handles communication with local Ollama server running Gemma3
"""

import os
import httpx
import json
import logging
from typing import Dict, Any, Optional, AsyncGenerator
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class OllamaConfig:
    """Configuration for Ollama service"""
    base_url: str = "http://localhost:11434"
    model_name: str = "gemma2:9b"
    timeout: int = 120
    temperature: float = 0.7
    max_tokens: int = 2048

class OllamaService:
    """Service for interacting with local Ollama models"""
    
    def __init__(self, config: Optional[OllamaConfig] = None):
        self.config = config or OllamaConfig()
        self.client = None
        self.model_available = False
        
    async def initialize(self):
        """Initialize the Ollama service"""
        try:
            logger.info("Initializing Ollama Service...")
            
            # Create HTTP client
            self.client = httpx.AsyncClient(
                base_url=self.config.base_url,
                timeout=httpx.Timeout(self.config.timeout)
            )
            
            # Check if Ollama server is running
            await self._check_server_health()
            
            # Check if model is available
            await self._check_model_availability()
            
            logger.info(f"✅ Ollama Service initialized with model: {self.config.model_name}")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Ollama Service: {e}")
            raise
    
    async def _check_server_health(self):
        """Check if Ollama server is running"""
        try:
            response = await self.client.get("/api/tags")
            if response.status_code == 200:
                logger.info("Ollama server is running")
            else:
                raise Exception(f"Ollama server returned status {response.status_code}")
        except Exception as e:
            raise Exception(f"Cannot connect to Ollama server at {self.config.base_url}: {e}")
    
    async def _check_model_availability(self):
        """Check if the specified model is available"""
        try:
            response = await self.client.get("/api/tags")
            if response.status_code == 200:
                models = response.json()
                available_models = [model["name"] for model in models.get("models", [])]
                
                if self.config.model_name in available_models:
                    self.model_available = True
                    logger.info(f"Model {self.config.model_name} is available")
                else:
                    logger.warning(f"Model {self.config.model_name} not found. Available models: {available_models}")
                    logger.info(f"Attempting to pull model {self.config.model_name}...")
                    await self._pull_model()
            else:
                raise Exception(f"Failed to check model availability: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Error checking model availability: {e}")
            raise
    
    async def _pull_model(self):
        """Pull the model if it's not available"""
        try:
            logger.info(f"Pulling model {self.config.model_name}... This may take a while.")
            
            response = await self.client.post(
                "/api/pull",
                json={"name": self.config.model_name},
                timeout=httpx.Timeout(600)  # 10 minutes for model pull
            )
            
            if response.status_code == 200:
                # Stream the pull progress
                async for line in response.aiter_lines():
                    if line:
                        try:
                            data = json.loads(line)
                            if "status" in data:
                                logger.info(f"Pull status: {data['status']}")
                        except json.JSONDecodeError:
                            continue
                
                self.model_available = True
                logger.info(f"✅ Successfully pulled model {self.config.model_name}")
            else:
                raise Exception(f"Failed to pull model: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Error pulling model: {e}")
            raise
    
    async def generate_response(self, 
                              prompt: str, 
                              context: str = "",
                              system_prompt: str = "",
                              stream: bool = False) -> str:
        """Generate response from the model"""
        if not self.model_available:
            raise Exception("Model is not available")
        
        try:
            # Construct the full prompt
            full_prompt = self._construct_prompt(prompt, context, system_prompt)
            
            payload = {
                "model": self.config.model_name,
                "prompt": full_prompt,
                "stream": stream,
                "options": {
                    "temperature": self.config.temperature,
                    "num_predict": self.config.max_tokens,
                }
            }
            
            if stream:
                return await self._generate_streaming_response(payload)
            else:
                return await self._generate_single_response(payload)
                
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            raise
    
    async def _generate_single_response(self, payload: Dict[str, Any]) -> str:
        """Generate a single response (non-streaming)"""
        try:
            response = await self.client.post("/api/generate", json=payload)
            
            if response.status_code == 200:
                result = response.json()
                return result.get("response", "")
            else:
                raise Exception(f"Generation failed with status {response.status_code}")
                
        except Exception as e:
            logger.error(f"Error in single response generation: {e}")
            raise
    
    async def _generate_streaming_response(self, payload: Dict[str, Any]) -> AsyncGenerator[str, None]:
        """Generate streaming response"""
        try:
            async with self.client.stream("POST", "/api/generate", json=payload) as response:
                if response.status_code == 200:
                    async for line in response.aiter_lines():
                        if line:
                            try:
                                data = json.loads(line)
                                if "response" in data:
                                    yield data["response"]
                                if data.get("done", False):
                                    break
                            except json.JSONDecodeError:
                                continue
                else:
                    raise Exception(f"Streaming failed with status {response.status_code}")
                    
        except Exception as e:
            logger.error(f"Error in streaming response: {e}")
            raise
    
    def _construct_prompt(self, user_prompt: str, context: str = "", system_prompt: str = "") -> str:
        """Construct the full prompt with context and system instructions"""
        if not system_prompt:
            system_prompt = """You are LegalLink AI, an expert legal assistant for Indian law. 
You provide accurate, helpful legal guidance based on Indian legal system, procedures, and case law.
Always cite relevant sections, acts, or cases when applicable.
If you're unsure about something, clearly state your limitations.
Provide practical, actionable advice while emphasizing the importance of consulting qualified legal professionals for specific cases."""
        
        prompt_parts = []
        
        # Add system prompt
        if system_prompt:
            prompt_parts.append(f"<system>{system_prompt}</system>")
        
        # Add context if available
        if context:
            prompt_parts.append(f"<context>\nRelevant Legal Context:\n{context}\n</context>")
        
        # Add user query
        prompt_parts.append(f"<user>{user_prompt}</user>")
        
        # Add assistant prompt
        prompt_parts.append("<assistant>")
        
        return "\n\n".join(prompt_parts)
    
    async def chat_completion(self, 
                            messages: list, 
                            stream: bool = False) -> str:
        """Chat completion with conversation history"""
        if not self.model_available:
            raise Exception("Model is not available")
        
        try:
            # Convert messages to prompt format
            prompt = self._messages_to_prompt(messages)
            
            payload = {
                "model": self.config.model_name,
                "prompt": prompt,
                "stream": stream,
                "options": {
                    "temperature": self.config.temperature,
                    "num_predict": self.config.max_tokens,
                }
            }
            
            if stream:
                return await self._generate_streaming_response(payload)
            else:
                return await self._generate_single_response(payload)
                
        except Exception as e:
            logger.error(f"Error in chat completion: {e}")
            raise
    
    def _messages_to_prompt(self, messages: list) -> str:
        """Convert message history to prompt format"""
        prompt_parts = []
        
        for message in messages:
            role = message.get("role", "user")
            content = message.get("content", "")
            
            if role == "system":
                prompt_parts.append(f"<system>{content}</system>")
            elif role == "user":
                prompt_parts.append(f"<user>{content}</user>")
            elif role == "assistant":
                prompt_parts.append(f"<assistant>{content}</assistant>")
        
        # Add final assistant prompt
        prompt_parts.append("<assistant>")
        
        return "\n\n".join(prompt_parts)
    
    async def get_model_info(self) -> Dict[str, Any]:
        """Get information about the current model"""
        try:
            response = await self.client.post("/api/show", json={"name": self.config.model_name})
            if response.status_code == 200:
                return response.json()
            else:
                return {}
        except Exception as e:
            logger.error(f"Error getting model info: {e}")
            return {}
    
    async def close(self):
        """Close the Ollama service"""
        if self.client:
            await self.client.aclose()
            logger.info("Ollama Service closed")
