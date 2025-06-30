"""
Vector Database Service for Training Data
Handles loading, indexing, and querying legal training data
"""

import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from pathlib import Path
import logging

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document

logger = logging.getLogger(__name__)

class VectorDBService:
    def __init__(self, 
                 db_path: str = "./Database/vector_store",
                 training_data_path: str = "./Database/training_data",
                 embedding_model: str = "all-MiniLM-L6-v2",
                 chunk_size: int = 1000,
                 chunk_overlap: int = 200):
        
        self.db_path = Path(db_path)
        self.training_data_path = Path(training_data_path)
        self.embedding_model_name = embedding_model
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        
        # Initialize components
        self.client = None
        self.collection = None
        self.embedding_model = None
        self.text_splitter = None
        
        # Create directories if they don't exist
        self.db_path.mkdir(parents=True, exist_ok=True)
        
    async def initialize(self):
        """Initialize the vector database service"""
        try:
            logger.info("Initializing Vector Database Service...")
            
            # Initialize ChromaDB
            self.client = chromadb.PersistentClient(
                path=str(self.db_path),
                settings=Settings(anonymized_telemetry=False)
            )
            
            # Get or create collection
            self.collection = self.client.get_or_create_collection(
                name="legal_training_data",
                metadata={"description": "Legal training data for LegalLink AI"}
            )
            
            # Initialize embedding model
            logger.info(f"Loading embedding model: {self.embedding_model_name}")
            self.embedding_model = SentenceTransformer(self.embedding_model_name)
            
            # Initialize text splitter
            self.text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=self.chunk_size,
                chunk_overlap=self.chunk_overlap,
                separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""]
            )
            
            # Check if data needs to be loaded
            if self.collection.count() == 0:
                logger.info("No existing data found. Loading training data...")
                await self.load_training_data()
            else:
                logger.info(f"Found {self.collection.count()} existing documents in vector store")
                
            logger.info("✅ Vector Database Service initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Vector Database Service: {e}")
            raise
    
    async def load_training_data(self):
        """Load and index all training data"""
        try:
            documents = []
            
            # Load case law data
            case_law_path = self.training_data_path / "case_law"
            if case_law_path.exists():
                for json_file in case_law_path.glob("*.json"):
                    docs = await self._load_case_law_file(json_file)
                    documents.extend(docs)
            
            # Load court hierarchy
            court_hierarchy_file = self.training_data_path / "court_hierarchy.json"
            if court_hierarchy_file.exists():
                docs = await self._load_court_hierarchy(court_hierarchy_file)
                documents.extend(docs)
            
            # Load other structured data
            for category in ["procedure", "emergency_data", "Fees", "geographical_jurisdiction"]:
                category_path = self.training_data_path / category
                if category_path.exists():
                    docs = await self._load_category_data(category_path, category)
                    documents.extend(docs)
            
            # Index documents in batches
            batch_size = 100
            for i in range(0, len(documents), batch_size):
                batch = documents[i:i + batch_size]
                await self._index_documents(batch)
                logger.info(f"Indexed batch {i//batch_size + 1}/{(len(documents)-1)//batch_size + 1}")
            
            logger.info(f"✅ Successfully loaded {len(documents)} documents into vector store")
            
        except Exception as e:
            logger.error(f"❌ Failed to load training data: {e}")
            raise
    
    async def _load_case_law_file(self, file_path: Path) -> List[Document]:
        """Load case law from JSON file"""
        documents = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                cases = json.load(f)
            
            for case in cases:
                # Create document content
                content = f"""
Case: {case.get('case_name', 'Unknown')}
Court: {case.get('court', 'Unknown')}
Year: {case.get('year', 'Unknown')}
Citation: {case.get('citation', 'Unknown')}

Facts: {case.get('facts', '')}

Legal Issues:
{chr(10).join(f"- {issue}" for issue in case.get('legal_issues', []))}

Judgment: {case.get('judgment', '')}

Legal Reasoning: {case.get('legal_reasoning', '')}

Legal Principle: {case.get('legal_principle', '')}

Relevant Sections:
{chr(10).join(f"- {section}" for section in case.get('relevant_sections', []))}

Keywords: {', '.join(case.get('keywords', []))}
                """.strip()
                
                # Create document with metadata
                doc = Document(
                    page_content=content,
                    metadata={
                        "source": str(file_path),
                        "type": "case_law",
                        "case_id": case.get('case_id', ''),
                        "case_name": case.get('case_name', ''),
                        "court": case.get('court', ''),
                        "year": case.get('year', ''),
                        "keywords": case.get('keywords', [])
                    }
                )
                
                documents.append(doc)
                
        except Exception as e:
            logger.error(f"Error loading case law file {file_path}: {e}")
        
        return documents
    
    async def _load_court_hierarchy(self, file_path: Path) -> List[Document]:
        """Load court hierarchy data"""
        documents = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                hierarchy = json.load(f)
            
            def process_court_data(court_name: str, court_data: dict, level: str = ""):
                content = f"Court: {court_name}\n"
                if level:
                    content += f"Level: {level}\n"
                
                content += json.dumps(court_data, indent=2, ensure_ascii=False)
                
                doc = Document(
                    page_content=content,
                    metadata={
                        "source": str(file_path),
                        "type": "court_hierarchy",
                        "court_name": court_name,
                        "level": level
                    }
                )
                documents.append(doc)
            
            # Process each court level
            for court_type, court_info in hierarchy.items():
                process_court_data(court_type, court_info, court_type)
                
        except Exception as e:
            logger.error(f"Error loading court hierarchy: {e}")
        
        return documents
    
    async def _load_category_data(self, category_path: Path, category: str) -> List[Document]:
        """Load data from a category directory"""
        documents = []
        
        try:
            for json_file in category_path.glob("*.json"):
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                content = json.dumps(data, indent=2, ensure_ascii=False)
                
                doc = Document(
                    page_content=content,
                    metadata={
                        "source": str(json_file),
                        "type": category,
                        "filename": json_file.name
                    }
                )
                
                documents.append(doc)
                
        except Exception as e:
            logger.error(f"Error loading category {category}: {e}")
        
        return documents
    
    async def _index_documents(self, documents: List[Document]):
        """Index documents into the vector store"""
        try:
            # Split documents into chunks
            chunked_docs = []
            for doc in documents:
                chunks = self.text_splitter.split_text(doc.page_content)
                for i, chunk in enumerate(chunks):
                    chunked_doc = Document(
                        page_content=chunk,
                        metadata={
                            **doc.metadata,
                            "chunk_id": i,
                            "total_chunks": len(chunks)
                        }
                    )
                    chunked_docs.append(chunked_doc)
            
            # Generate embeddings
            texts = [doc.page_content for doc in chunked_docs]
            embeddings = self.embedding_model.encode(texts, convert_to_tensor=False)
            
            # Prepare data for ChromaDB
            ids = [f"{doc.metadata.get('source', 'unknown')}_{doc.metadata.get('chunk_id', 0)}_{hash(doc.page_content)}" 
                   for doc in chunked_docs]
            metadatas = [doc.metadata for doc in chunked_docs]
            
            # Add to collection
            self.collection.add(
                embeddings=embeddings.tolist(),
                documents=texts,
                metadatas=metadatas,
                ids=ids
            )
            
        except Exception as e:
            logger.error(f"Error indexing documents: {e}")
            raise
    
    async def similarity_search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """Search for similar documents"""
        try:
            # Generate query embedding
            query_embedding = self.embedding_model.encode([query], convert_to_tensor=False)
            
            # Search in ChromaDB
            results = self.collection.query(
                query_embeddings=query_embedding.tolist(),
                n_results=k,
                include=["documents", "metadatas", "distances"]
            )
            
            # Format results
            formatted_results = []
            if results['documents']:
                for i in range(len(results['documents'][0])):
                    formatted_results.append({
                        "content": results['documents'][0][i],
                        "metadata": results['metadatas'][0][i] if results['metadatas'] else {},
                        "score": 1 - results['distances'][0][i] if results['distances'] else 0.0
                    })
            
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error in similarity search: {e}")
            return []
    
    async def get_relevant_context(self, query: str, max_tokens: int = 2000) -> str:
        """Get relevant context for a query, limited by token count"""
        try:
            results = await self.similarity_search(query, k=10)
            
            context_parts = []
            total_length = 0
            
            for result in results:
                content = result['content']
                if total_length + len(content) <= max_tokens:
                    context_parts.append(content)
                    total_length += len(content)
                else:
                    # Add partial content if it fits
                    remaining = max_tokens - total_length
                    if remaining > 100:  # Only add if meaningful
                        context_parts.append(content[:remaining] + "...")
                    break
            
            return "\n\n---\n\n".join(context_parts)
            
        except Exception as e:
            logger.error(f"Error getting relevant context: {e}")
            return ""
    
    async def close(self):
        """Close the vector database service"""
        if self.client:
            logger.info("Closing Vector Database Service...")
