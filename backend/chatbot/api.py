from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    animal: str = "dog"

class ChatResponse(BaseModel):
    response: str
    status: str = "success"

@router.post("/message")
async def chat_message(request: ChatRequest):
    """Chat endpoint for the chatbot"""
    try:
        from chatbot.agent import agent
        from chatbot.memory import memory

        # Build context for the agent
        enriched_input = f"""
        Pet Type: {request.animal}
        User Query: {request.message}
        """

        response = agent.run(enriched_input)

        # Save to memory
        memory.save_context(
            {"input": request.message},
            {"output": str(response)}
        )

        return ChatResponse(response=str(response))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health():
    """Health check for chatbot service"""
    return {"status": "operational", "service": "chatbot"}
