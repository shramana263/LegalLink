#!/usr/bin/env python3
"""
LegalLink AI ChatBot Startup Script
Handles environment setup, dependency checks, and service initialization
"""

import os
import sys
import subprocess
import platform
import asyncio
from pathlib import Path
import argparse
from typing import Dict, List

class LegalLinkStartup:
    """Startup manager for LegalLink AI ChatBot"""
    
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.venv_path = self.project_root / "venv"
        self.requirements_file = self.project_root / "requirements.txt"
        self.env_file = self.project_root / ".env"
        
    def print_banner(self):
        """Print startup banner"""
        banner = """
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║               🏛️  LegalLink AI ChatBot  ⚖️                   ║
║                                                              ║
║              Interactive Legal Assistant System              ║
║                     Starting Up...                           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
        """
        print(banner)
    
    def check_python_version(self) -> bool:
        """Check if Python version is compatible"""
        print("🐍 Checking Python version...")
        
        version = sys.version_info
        if version.major != 3 or version.minor < 8:
            print(f"❌ Python 3.8+ required. Current version: {version.major}.{version.minor}")
            return False
        
        print(f"✅ Python {version.major}.{version.minor}.{version.micro} detected")
        return True
    
    def check_virtual_environment(self) -> bool:
        """Check if virtual environment exists"""
        print("📦 Checking virtual environment...")
        
        if self.venv_path.exists():
            print(f"✅ Virtual environment found at: {self.venv_path}")
            return True
        else:
            print(f"❌ Virtual environment not found at: {self.venv_path}")
            return False
    
    def create_virtual_environment(self) -> bool:
        """Create virtual environment"""
        print("🏗️  Creating virtual environment...")
        
        try:
            subprocess.run([
                sys.executable, "-m", "venv", str(self.venv_path)
            ], check=True, capture_output=True)
            
            print(f"✅ Virtual environment created at: {self.venv_path}")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to create virtual environment: {e}")
            return False
    
    def get_pip_command(self) -> str:
        """Get pip command based on OS"""
        if platform.system() == "Windows":
            return str(self.venv_path / "Scripts" / "pip.exe")
        else:
            return str(self.venv_path / "bin" / "pip")
    
    def get_python_command(self) -> str:
        """Get python command based on OS"""
        if platform.system() == "Windows":
            return str(self.venv_path / "Scripts" / "python.exe")
        else:
            return str(self.venv_path / "bin" / "python")
    
    def install_dependencies(self) -> bool:
        """Install required dependencies"""
        print("📚 Installing dependencies...")
        
        if not self.requirements_file.exists():
            print(f"❌ Requirements file not found: {self.requirements_file}")
            return False
        
        try:
            pip_cmd = self.get_pip_command()
            subprocess.run([
                pip_cmd, "install", "-r", str(self.requirements_file)
            ], check=True)
            
            print("✅ Dependencies installed successfully")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install dependencies: {e}")
            return False
    
    def create_env_file(self) -> bool:
        """Create .env file with default values"""
        print("⚙️  Setting up environment configuration...")
        
        default_env = """# LegalLink AI ChatBot Environment Configuration

# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
DEBUG=true

# Backend Integration
EXPRESS_BACKEND_URL=http://localhost:3000
EXPRESS_API_PREFIX=/api

# Indian Kanoon API Configuration
INDIAN_KANOON_API_URL=https://api.indiankanoon.org
INDIAN_KANOON_API_KEY=your_api_key_here

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# WebSocket Configuration
WS_MAX_CONNECTIONS=100

# Logging Configuration
LOG_LEVEL=INFO
LOG_FILE=logs/app.log

# AI Model Configuration (for future use)
AI_MODEL_NAME=llama3
AI_MODEL_ENDPOINT=http://localhost:11434

# Session Configuration
SESSION_TIMEOUT_MINUTES=30
MAX_MESSAGE_HISTORY=100
"""
        
        try:
            with open(self.env_file, 'w', encoding='utf-8') as f:
                f.write(default_env)
            
            print(f"✅ Environment file created: {self.env_file}")
            print("📝 Please update the .env file with your specific configuration")
            return True
        except Exception as e:
            print(f"❌ Failed to create .env file: {e}")
            return False
    
    def check_env_file(self) -> bool:
        """Check if .env file exists"""
        print("🔧 Checking environment configuration...")
        
        if self.env_file.exists():
            print(f"✅ Environment file found: {self.env_file}")
            return True
        else:
            print(f"❌ Environment file not found: {self.env_file}")
            return self.create_env_file()
    
    def create_logs_directory(self) -> bool:
        """Create logs directory"""
        logs_dir = self.project_root / "logs"
        
        try:
            logs_dir.mkdir(exist_ok=True)
            print(f"✅ Logs directory ready: {logs_dir}")
            return True
        except Exception as e:
            print(f"❌ Failed to create logs directory: {e}")
            return False
    
    def check_backend_connection(self) -> bool:
        """Check connection to Express backend"""
        print("🔗 Checking backend connection...")
        
        try:
            import httpx
            import asyncio
            
            async def test_connection():
                try:
                    async with httpx.AsyncClient() as client:
                        response = await client.get("http://localhost:3000/health", timeout=5.0)
                        return response.status_code == 200
                except:
                    return False
            
            is_connected = asyncio.run(test_connection())
            
            if is_connected:
                print("✅ Express backend is running and accessible")
                return True
            else:
                print("⚠️  Express backend not accessible (will start in offline mode)")
                return False
        except ImportError:
            print("⚠️  Cannot check backend connection (httpx not installed yet)")
            return False
    
    def run_server(self, host: str = "0.0.0.0", port: int = 8000, reload: bool = True):
        """Run the FastAPI server"""
        print(f"🚀 Starting LegalLink AI ChatBot server...")
        print(f"📍 Server will be available at: http://{host}:{port}")
        print(f"📚 API Documentation: http://{host}:{port}/docs")
        print(f"🔌 WebSocket endpoint: ws://{host}:{port}/ws/chat/{{user_id}}")
        print("\n" + "="*60)
        
        try:
            python_cmd = self.get_python_command()
            subprocess.run([
                python_cmd, "-m", "uvicorn", "main:app",
                "--host", host,
                "--port", str(port),
                "--reload" if reload else "--no-reload"
            ], cwd=self.project_root)
        except KeyboardInterrupt:
            print("\n🛑 Server stopped by user")
        except Exception as e:
            print(f"❌ Failed to start server: {e}")
    
    def setup_project(self) -> bool:
        """Complete project setup"""
        print("🔧 Setting up LegalLink AI ChatBot project...")
        
        steps = [
            ("Checking Python version", self.check_python_version),
            ("Checking virtual environment", self.check_virtual_environment),
            ("Checking environment configuration", self.check_env_file),
            ("Creating logs directory", self.create_logs_directory),
        ]
        
        # Create virtual environment if it doesn't exist
        if not self.venv_path.exists():
            if not self.create_virtual_environment():
                return False
        
        # Install dependencies
        if not self.install_dependencies():
            return False
        
        # Run setup steps
        for step_name, step_func in steps:
            if not step_func():
                print(f"❌ Setup failed at: {step_name}")
                return False
        
        # Check backend connection (optional)
        self.check_backend_connection()
        
        print("\n✅ Project setup completed successfully!")
        print("\n📋 Next steps:")
        print("1. Update .env file with your configuration")
        print("2. Ensure Express backend is running on http://localhost:3000")
        print("3. Run: python start.py --run")
        return True

def main():
    """Main startup function"""
    parser = argparse.ArgumentParser(description="LegalLink AI ChatBot Startup Script")
    parser.add_argument("--setup", action="store_true", help="Setup the project")
    parser.add_argument("--run", action="store_true", help="Run the server")
    parser.add_argument("--host", default="0.0.0.0", help="Server host")
    parser.add_argument("--port", type=int, default=8000, help="Server port")
    parser.add_argument("--no-reload", action="store_true", help="Disable auto-reload")
    
    args = parser.parse_args()
    
    startup = LegalLinkStartup()
    startup.print_banner()
    
    if args.setup:
        if startup.setup_project():
            print("\n🎉 Setup completed! You can now run the server with: python start.py --run")
        else:
            print("\n❌ Setup failed. Please check the errors above.")
            sys.exit(1)
    
    elif args.run:
        # Quick setup check
        if not startup.venv_path.exists():
            print("❌ Virtual environment not found. Please run: python start.py --setup")
            sys.exit(1)
        
        startup.run_server(
            host=args.host,
            port=args.port,
            reload=not args.no_reload
        )
    
    else:
        print("Usage:")
        print("  python start.py --setup    # Setup the project")
        print("  python start.py --run      # Run the server")
        print("  python start.py --help     # Show help")

if __name__ == "__main__":
    main()
