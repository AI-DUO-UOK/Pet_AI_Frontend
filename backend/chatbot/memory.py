class SimpleMemory:
    """Simple conversation memory implementation"""

    def __init__(self, memory_key="chat_history", input_key="input", output_key="output"):
        self.memory_key = memory_key
        self.input_key = input_key
        self.output_key = output_key
        self.chat_history = []

    def save_context(self, inputs, outputs):
        """Save a turn of the conversation to memory"""
        input_text = inputs.get(self.input_key, "") if isinstance(inputs, dict) else str(inputs)
        output_text = outputs.get(self.output_key, "") if isinstance(outputs, dict) else str(outputs)

        self.chat_history.append({
            "input": input_text,
            "output": output_text
        })

    def load_memory_variables(self, inputs):
        """Load memory variables - return formatted chat history"""
        if not self.chat_history:
            return {self.memory_key: ""}

        # Format chat history as a readable string
        formatted_history = []
        for turn in self.chat_history:
            formatted_history.append(f"User: {turn['input']}\nAssistant: {turn['output']}")

        chat_history_str = "\n\n".join(formatted_history)
        return {self.memory_key: chat_history_str}

    def clear(self):
        """Clear conversation history"""
        self.chat_history = []


# Initialize conversation memory for the chatbot
# This keeps track of the conversation history for context
memory = SimpleMemory(
    memory_key="chat_history",
    input_key="input",
    output_key="output"
)
