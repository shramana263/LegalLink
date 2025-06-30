# LegalLink - AI-Powered Legal Assistant Platform

Welcome to **LegalLink**, a comprehensive AI-powered legal assistance platform designed to democratize access to legal services in India.

## 🎯 Project Overview

LegalLink combines cutting-edge AI technology with practical legal assistance to provide:

- **AI Query Assistant**: Intelligent legal guidance powered by conversational AI
- **Advocate Matching**: Smart matching with verified legal professionals
- **Real-time Chat**: WebSocket-based instant legal assistance
- **Multi-language Support**: Hindi, English, and Bengali
- **Training Data Integration**: Comprehensive Indian legal knowledge base

## 📁 Project Structure

```
LegalLink/
├── ai-model/           # AI Query Assistant & Agentic System
├── backend/            # Express.js API & D`atabase
├── frontend/           # Next.js Web Application
└── docs/              # Documentation & Guides
```

## 🤖 AI Query Assistant

The heart of LegalLink is our sophisticated AI Query Assistant featuring:

### **Multi-Agent Architecture (LangGraph)**
- **DialogueAgent**: Conversation flow management
- **ClassificationAgent**: Legal query classification
- **LegalReasoningAgent**: Legal analysis and guidance
- **RiskAssessmentAgent**: Urgency and risk evaluation
- **RecommendationAgent**: Advocate matching
- **ContextAgent**: Context and memory management

### **Enhanced Legal Processing**
- **RAG System**: Retrieval-Augmented Generation with legal training data
- **Vector Database**: ChromaDB for semantic search
- **Local AI Model**: Ollama Gemma3 for legal reasoning
- **Indian Kanoon Integration**: Live legal database access

### **Conversation Flow**
```
User Query → Enhanced Legal Agent (RAG) → Quality Assessment → 
    ├─ High Quality: Direct Response
    └─ Needs Enhancement: Multi-Agent Processing → Comprehensive Response
```

## 📚 Documentation

### **Comprehensive Documentation**
📖 **[Complete Software Documentation](./LEGALLINK_AI_SOFTWARE_DOCUMENTATION.md)**

This comprehensive guide covers:
- **System Architecture**: Detailed technical architecture
- **AI Model Flow**: Complete agentic system explanation
- **API Documentation**: REST and WebSocket APIs
- **Integration Guide**: Express.js and frontend integration
- **Deployment Guide**: Production deployment instructions
- **Troubleshooting**: Common issues and solutions

### **Component-Specific Documentation**
- **[AI Model Documentation](./ai-model/README.md)**: AI system setup and configuration
- **[Backend API Documentation](./backend/README.md)**: Express.js API and database
- **[Frontend Documentation](./frontend/README.md)**: Next.js application setup

## 🚀 Quick Start

### **Prerequisites**
- Python 3.8+ (AI Model)
- Node.js 16+ (Backend/Frontend)
- PostgreSQL (Database)
- Redis (Session Management)

### **1. AI Model Setup**
```bash
cd ai-model
python start.py --setup
python start.py --run
```

### **2. Backend Setup**
```bash
cd backend
npm install
npm run dev
```

### **3. Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

## 🎯 Key Features

### **🤖 AI Query Assistant**
- Real-time conversational AI for legal assistance
- Multi-agent system for comprehensive query processing
- Training data integration with vector search
- Legal domain classification and urgency assessment

### **⚖️ Legal Intelligence**
- Indian legal knowledge base integration
- Case law research and analysis
- Risk assessment and legal guidance
- Professional disclaimers and boundaries

### **👨‍💼 Advocate Matching**
- AI-powered advocate recommendations
- Specialization and location-based matching
- Real-time availability checking
- Integrated consultation booking

### **🌐 Accessibility**
- Multi-language support (Hindi, English, Bengali)
- Public access without registration
- Mobile-responsive design
- WebSocket real-time communication

## 🏗️ Technical Stack

### **AI & Machine Learning**
- **FastAPI**: High-performance Python web framework
- **LangGraph**: Multi-agent orchestration
- **Ollama**: Local AI model deployment (Gemma3)
- **ChromaDB**: Vector database for embeddings
- **Sentence Transformers**: Text embedding generation

### **Backend Services**
- **Express.js**: Node.js web framework
- **PostgreSQL**: Primary database with Prisma ORM
- **Redis**: Session management and caching
- **WebSocket**: Real-time communication

### **Frontend**
- **Next.js**: React-based web framework
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library

## 🔒 Security & Compliance

- **Data Encryption**: TLS 1.3 for all communications
- **Privacy Protection**: Anonymized analytics
- **Rate Limiting**: API protection and abuse prevention
- **Legal Compliance**: Professional boundary maintenance
- **Content Moderation**: Inappropriate content filtering

## 📊 Performance

- **Response Time**: < 500ms for initial responses
- **Concurrent Users**: 1,000+ simultaneous connections
- **Availability**: 99.9% uptime target
- **Scalability**: Kubernetes-ready deployment

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guidelines](./CONTRIBUTING.md) and follow our development process:

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Documentation**: [Complete Software Documentation](./LEGALLINK_AI_SOFTWARE_DOCUMENTATION.md)
- **Issues**: GitHub Issues
- **Email**: support@legallink.ai

---

**LegalLink** - *Making legal assistance accessible to everyone in India*

*Built with ❤️ for legal accessibility and powered by advanced AI technology*