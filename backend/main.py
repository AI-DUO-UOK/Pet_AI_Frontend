"""
PetPULSE Backend - Unified Entry Point
Combines FastAPI (image analysis) with LangChain (RAG + LLM chatbot)
"""
import os
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from app.main import app as api_app
from chatbot.api import router as chatbot_router

# Create unified app
app = FastAPI(
    title="PetPULSE Backend",
    description="AI-powered pet health analysis and advice",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://petpulse.com",
        "https://www.petpulse.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_app.router, prefix="/api", tags=["image-analysis"])

# Mount Chatbot routes
app.include_router(chatbot_router, prefix="/api/chat", tags=["chatbot"])

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "services": {
            "image_analysis": "operational",
            "chatbot_rag": "operational"
        }
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "PetPULSE Backend API",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )