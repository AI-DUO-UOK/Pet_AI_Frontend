# Pet AI Frontend - Setup & Integration Guide

## Frontend-Backend Connection

The frontend now connects to the backend via REST API. Here's how to set it up and run both services together.

## Quick Start

### Step 1: Backend Setup

First, start the backend API server:

```bash
# From Pet_AI_Backend directory
cd /Users/akilafernando/Documents/GitHub/Pet_AI_Backend

# Make sure your .env file has the required keys:
# OPENROUTER_API_KEY=your_key_here
# LANGCHAIN_API_KEY=your_key_here
# LANGCHAIN_TRACING_V2=true

# Start the API server
python -m uvicorn chatbot.api:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
Uvicorn running on http://0.0.0.0:8000
```

### Step 2: Frontend Setup

In a new terminal, start the frontend:

```bash
# From Pet_AI_Frontend directory
cd /Users/akilafernando/Documents/GitHub/Pet_AI_Frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

You should see:
```
> next dev
  ▲ Next.js 15.0.0
  - Local:        http://localhost:3000
```

### Step 3: Access the Application

1. Open http://localhost:3000 in your browser
2. Log in or navigate to the AI Assistant page
3. Select your pet type (dog or cat)
4. Start chatting!

## Environment Configuration

### Frontend `.env.local`

Create or edit `.env.local` in the Pet_AI_Frontend directory:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend `.env`

Ensure the backend has these variables in Pet_AI_Backend/.env:

```env
OPENROUTER_API_KEY=your_actual_api_key
LANGCHAIN_API_KEY=your_actual_api_key
LANGCHAIN_TRACING_V2=true
```

## Features

### Pet Type Selection
- User selects dog or cat before chat starts
- Selection persists throughout the session
- Passed to backend for pet-specific analysis

### Chat Interface
- Real-time message sending and receiving
- Typing indicator while AI processes
- Support for suggested prompts
- Error handling with user-friendly messages

### AI Responses
- Regular text responses for general questions
- Structured analysis cards for symptoms:
  - Condition diagnosis
  - Confidence percentage
  - Recommended actions
  - DO's and DON'Ts
  - Disclaimer about AI analysis

### Image Support
- Upload pet images directly in the chat
- Future: Integrate with CV models for image analysis

## API Integration Details

### Session Management

Each chat session is created when user selects pet type:

```typescript
// Frontend creates session when pet is selected
const response = await fetch('http://localhost:8000/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ pet_type: 'dog' })
});
const { session_id } = await response.json();
```

### Chat Flow

User message → API request → Backend processes → Returns response:

```typescript
// Send message to backend
const response = await fetch(
  `http://localhost:8000/api/sessions/${sessionId}/chat`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: userMessage,
      include_image: hasImage
    })
  }
);

// Response includes optional analysis data
const { message, is_analysis, analysis_data } = await response.json();
```

## Development Workflow

### Making Changes

1. **Frontend Changes**: Edit files in `/app/(dashboard)/ai-assistant/page.tsx`
   - Hot reload enabled via Next.js
   - Changes appear immediately in browser

2. **Backend Changes**: Edit files in `/chatbot/api.py` or related modules
   - Hot reload enabled via Uvicorn with `--reload`
   - API docs update at http://localhost:8000/docs

3. **Testing API**: Use Swagger UI
   - Open http://localhost:8000/docs
   - Test endpoints interactively
   - See request/response examples

### Debugging

#### Frontend Issues
```bash
# Check console errors
# Press F12 in browser → Console tab

# Check network requests
# Press F12 → Network tab → Send message and inspect
```

#### Backend Issues
```bash
# Check API logs in terminal where uvicorn is running
# Check for stack traces in error responses

# Use API docs to test endpoints
http://localhost:8000/docs
```

## Building for Production

### Frontend Build

```bash
cd /Users/akilafernando/Documents/GitHub/Pet_AI_Frontend

# Build the project
npm run build

# Start production server
npm start
```

### Backend Deployment

Update API configuration:

```python
# In chatbot/api.py, change CORS settings:
allow_origins=["https://yourdomain.com"]  # Instead of "*"

# Run with production server
python -m uvicorn chatbot.api:app --host 0.0.0.0 --port 8000
```

Update frontend environment:

```env
# .env.production.local
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## Troubleshooting

### "Failed to create session" Error
- Check backend is running on port 8000
- Check API_URL in `.env.local`
- Check browser console for CORS errors
- Ensure `.env` file exists in Pet_AI_Backend

### "Failed to get response from AI" Error
- Check backend logs for errors
- Verify OpenRouter API key is valid
- Check internet connection
- Check OpenRouter account has credits

### Typing Indicator Never Stops
- Check backend response logs
- Verify API endpoint is being hit
- Check for timeouts (> 30 seconds)

### Pet Selection UI Not Showing
- Clear browser cache
- Check if session creation request is failing
- Look at network tab in DevTools

### CORS Errors
- Backend CORS is enabled for all origins in development
- If issues persist, check browser console details
- Verify API_URL doesn't have trailing slash

## Performance Optimization

### Frontend
- Components use React.memo where appropriate
- Framer Motion animations optimized
- Message virtualization (if needed for long conversations)

### Backend
- LLM response timeout: 30 seconds
- Token limits: 400 max (optimized for cost)
- Conversation memory: Last 6 messages for context

## Security Considerations

### Current Setup (Development)
- CORS allows all origins
- No authentication required
- Sessions stored in memory (lost on restart)

### Production Setup
- Update CORS to specific domains
- Implement API authentication (JWT tokens)
- Add rate limiting
- Use HTTPS only
- Store sessions in database
- Validate and sanitize inputs

## API Documentation

Full API documentation available at:
- **Interactive Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

See [API_SETUP.md](../Pet_AI_Backend/API_SETUP.md) in backend for detailed endpoint documentation.

## Monitoring

### Frontend Metrics
- Page load time
- Time to first AI response
- Error rates

### Backend Metrics
- API response times
- Session creation success rate
- LLM API call success
- Average response length

## Support & Issues

If you encounter issues:

1. Check the logs in both terminals
2. Try clearing browser cache
3. Restart both services
4. Check that both ports (3000, 8000) are available
5. Verify environment variables are set correctly

For detailed API information, see [API_SETUP.md](../Pet_AI_Backend/API_SETUP.md).
