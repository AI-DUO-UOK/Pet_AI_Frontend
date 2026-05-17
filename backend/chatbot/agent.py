from chatbot.llm import llm
from chatbot.tools import analyze_pet_image
from chatbot.memory import memory

tools = [analyze_pet_image]

class SimpleAgent:
    def __init__(self, llm, tools, memory):
        self.llm = llm
        self.tools = tools
        self.memory = memory

    def run(self, input_text):
        """Simple agent that routes to tools or LLM"""
        try:
            # For now, just use the LLM directly
            # The chatbot/main.py handles tool routing
            response = self.llm.invoke(input_text)
            return response.content if hasattr(response, 'content') else str(response)
        except Exception as e:
            return f"Error: {str(e)}"

agent = SimpleAgent(llm, tools, memory)