"""
Centralized configuration for PetPULSE backend
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Paths
BASE_DIR = Path(__file__).parent.parent
WEIGHTS_DIR = BASE_DIR / "weights"
CHATBOT_DB_DIR = BASE_DIR / "chatbot" / "db"
RAG_OUTPUT_DIR = BASE_DIR / "chatbot" / "rag_output_cleaned"

# API Configuration
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", 8000))
API_RELOAD = os.getenv("API_RELOAD", "true").lower() == "true"

# Frontend Configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    FRONTEND_URL,
]

# OpenAI / LLM Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
LLM_MODEL = os.getenv("LLM_MODEL", "mistralai/mistral-large-2512")
LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.0"))
LLM_MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", "1024"))

# Chroma DB Configuration
CHROMA_COLLECTION = "veterinary_docs"
CHROMA_PERSIST_DIR = str(CHATBOT_DB_DIR)

# Model Configuration
PYTORCH_DEVICE = os.getenv("PYTORCH_DEVICE", "cpu")
DOG_SKIN_MODEL_PATH = WEIGHTS_DIR / "dog_skin_model.pth"
DOG_EYE_MODEL_PATH = WEIGHTS_DIR / "dog_eye_model_ResNet_NEW.pth"
CAT_SKIN_MODEL_PATH = WEIGHTS_DIR / "cat_skin_model.pth"

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FILE = BASE_DIR / "logs" / "petpulse.log"

# Validation
if not OPENROUTER_API_KEY:
    print("⚠️  Warning: OPENROUTER_API_KEY not set. RAG will not work.")

print(f"""
✅ PetPULSE Configuration Loaded:
  API: {API_HOST}:{API_PORT}
  Frontend: {FRONTEND_URL}
  LLM: {LLM_MODEL}
  Device: {PYTORCH_DEVICE}
  Chroma DB: {CHROMA_PERSIST_DIR}
""")