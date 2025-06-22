#!/usr/bin/env python3
"""
Test Example: Enhanced Legal Agent Integration
Demonstrates how the enhanced legal agent processes queries with training data
"""

import asyncio
import logging
import json
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_enhanced_legal_agent_integration():
    """
    Test the enhanced legal agent integration with training data
    """
    print("🔄 Testing Enhanced Legal Agent Integration with Training Data")
    print("=" * 60)
    
    # Test queries that should utilize training data
    test_queries = [
        {
            "query": "How do I file a complaint against my landlord for not returning security deposit?",
            "expected_data_types": ["procedure", "case_law", "fees"],
            "urgency": "medium"
        },
        {
            "query": "What are the court fees for filing a civil suit in Delhi?",
            "expected_data_types": ["fees", "geographical_jurisdiction"],
            "urgency": "low"
        },
        {
            "query": "I need to file an emergency petition for bail. Help me urgently!",
            "expected_data_types": ["emergency_data", "procedure", "court_hierarchy"],
            "urgency": "high"
        }
    ]
    
    print("📊 Test Scenarios:")
    for i, test_case in enumerate(test_queries, 1):
        print(f"\n{i}. Query: {test_case['query']}")
        print(f"   Expected Data Types: {', '.join(test_case['expected_data_types'])}")
        print(f"   Urgency Level: {test_case['urgency']}")
        
        # Simulate processing flow
        print(f"   Processing Flow:")
        print(f"   ├─ 📥 Input Processing & Validation")
        print(f"   ├─ 🔍 Enhanced Legal Agent (RAG + Gemma3)")
        print(f"   │  ├─ Vector search across training data")
        print(f"   │  ├─ Context retrieval from {', '.join(test_case['expected_data_types'])}")
        print(f"   │  ├─ Gemma3 local model processing")
        print(f"   │  └─ Quality assessment & confidence scoring")
        print(f"   ├─ 📊 Quality-based routing decision")
        print(f"   ├─ 🤖 Agent enhancement (if needed)")
        print(f"   └─ 📤 Response assembly & delivery")
    
    print("\n" + "=" * 60)
    print("🎯 Integration Benefits:")
    print("✅ Local training data utilization")
    print("✅ Gemma3 model for legal reasoning")
    print("✅ Context-aware response generation")
    print("✅ Quality-based enhancement routing")
    print("✅ Graceful fallback mechanisms")
    
    print("\n📈 Expected Response Quality Factors:")
    print("• Legal terminology usage")
    print("• Case law references from training data")
    print("• Actionable procedural guidance")
    print("• Relevant fee information")
    print("• Court hierarchy awareness")
    print("• Location-specific jurisdiction info")
    
    print("\n🔧 Configuration Requirements:")
    print("• Ollama running with Gemma3 model")
    print("• Training data loaded in Database/training_data/")
    print("• Vector embeddings indexed in ChromaDB")
    print("• Environment variables configured in .env")
    
    return True

async def demo_rag_processing_flow():
    """
    Demonstrate the RAG processing flow with training data
    """
    print("\n🧠 RAG Processing Flow Demonstration")
    print("=" * 50)
    
    # Simulate RAG processing steps
    steps = [
        {
            "step": "1. Query Analysis",
            "description": "Parse user query and extract legal concepts",
            "example": "Query: 'file complaint landlord' → Concepts: [tenant_rights, complaint_filing, property_law]"
        },
        {
            "step": "2. Vector Search",
            "description": "Search training data using embeddings",
            "example": "Search results: 5 case_law docs, 3 procedure docs, 2 fee docs (similarity > 0.7)"
        },
        {
            "step": "3. Context Assembly",
            "description": "Combine relevant training data as context",
            "example": "Context: 1500 tokens from case precedents + filing procedures + fee structure"
        },
        {
            "step": "4. Gemma3 Processing",
            "description": "Generate response using local model + context",
            "example": "Input: Query + Context → Gemma3 → Legal analysis + recommendations"
        },
        {
            "step": "5. Quality Assessment",
            "description": "Evaluate response completeness and accuracy",
            "example": "Score: 0.85 (high quality) → Use as primary response"
        },
        {
            "step": "6. Enhancement Decision",
            "description": "Decide on agent enhancement needs",
            "example": "High quality → Add interactive elements only"
        }
    ]
    
    for step_info in steps:
        print(f"\n{step_info['step']}")
        print(f"├─ {step_info['description']}")
        print(f"└─ {step_info['example']}")
    
    print("\n📊 Quality Metrics:")
    quality_metrics = {
        "content_completeness": "85%",
        "legal_terminology": "90%", 
        "actionable_guidance": "80%",
        "case_law_references": "75%",
        "source_diversity": "3 types",
        "overall_confidence": "0.82"
    }
    
    for metric, value in quality_metrics.items():
        print(f"• {metric.replace('_', ' ').title()}: {value}")
    
    return True

async def show_training_data_structure():
    """
    Show the training data structure and types
    """
    print("\n📁 Training Data Structure")
    print("=" * 40)
    
    data_structure = {
        "case_law/": {
            "description": "Legal precedents and court judgments",
            "files": "*.json",
            "content": "case_name, court, facts, judgment, legal_reasoning, precedents"
        },
        "procedure/": {
            "description": "Legal procedures and filing processes",
            "files": "*.json", 
            "content": "step-by-step guides, required documents, timelines"
        },
        "court_hierarchy.json": {
            "description": "Court structure and jurisdictions",
            "files": "single file",
            "content": "court levels, appeal processes, jurisdiction mappings"
        },
        "emergency_data/": {
            "description": "Urgent legal matter handling",
            "files": "*.json",
            "content": "emergency procedures, urgent contacts, time-sensitive processes"
        },
        "Fees/": {
            "description": "Court fees and legal costs",
            "files": "*.json",
            "content": "filing fees, court costs, payment schedules by jurisdiction"
        },
        "geographical_jurisdiction/": {
            "description": "Location-based legal information",
            "files": "*.json",
            "content": "jurisdiction boundaries, local courts, regional procedures"
        }
    }
    
    for path, info in data_structure.items():
        print(f"\n📂 {path}")
        print(f"   Description: {info['description']}")
        print(f"   Files: {info['files']}")
        print(f"   Content: {info['content']}")
    
    print(f"\n🔍 Vector Indexing:")
    print(f"• Embedding Model: all-MiniLM-L6-v2")
    print(f"• Chunk Size: 1000 tokens")
    print(f"• Chunk Overlap: 200 tokens")
    print(f"• Top-K Retrieval: 5 documents")
    print(f"• Similarity Threshold: 0.7")
    
    return True

async def main():
    """Main test function"""
    print("🚀 Enhanced Legal Agent Integration Test")
    print("Using training data + Ollama Gemma3 model")
    print("=" * 70)
    
    # Run test scenarios
    await test_enhanced_legal_agent_integration()
    await demo_rag_processing_flow()
    await show_training_data_structure()
    
    print("\n" + "=" * 70)
    print("✅ Enhanced Legal Agent Integration Test Complete!")
    print("🔧 To run the actual system:")
    print("   1. Ensure Ollama is running: `ollama serve`")
    print("   2. Pull Gemma3 model: `ollama pull gemma3`")
    print("   3. Start the AI model service: `python start.py`")
    print("   4. The enhanced legal agent will automatically initialize")
    print("   5. Training data will be indexed on first startup")

if __name__ == "__main__":
    asyncio.run(main())
