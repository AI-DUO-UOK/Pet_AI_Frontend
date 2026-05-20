# Frontend-Backend Integration Setup Guide

## ✅ Status Check

- ✅ **Backend API**: Verified working (`chatbot/api.py`)
- ✅ **Frontend Connected**: AI Assistant page updated with real API calls
- ✅ **Pet Selection**: Modal for choosing dog/cat before chat
- ✅ **Message Handling**: Real API communication with agentic RAG
- ✅ **Image Upload**: Integrated for disease analysis

---

## 🚀 Running the Services

### Option 1: Start Everything (Recommended)

**Terminal 1 - Backend (from `/Pet_AI_Backend`):**
```bash
cd /Users/akilafernando/Documents/GitHub/Pet_AI_Backend
source venv/bin/activate
bash start_backend.sh
```

This starts both:
- CV Model API on `http://localhost:8000`
- Chatbot API on `http://localhost:8001`

**Terminal 2 - Frontend (from `/Pet_AI_Frontend`):**
```bash
cd /Users/akilafernando/Documents/GitHub/Pet_AI_Frontend
npm run dev
```

Frontend runs on `http://localhost:3000`

---

### Option 2: Start Services Individually

**Backend CV Model API:**
```bash
cd /Users/akilafernando/Documents/GitHub/Pet_AI_Backend
source venv/bin/activate
python app/main.py
```
→ Running on `http://localhost:8000`

**Backend Chatbot API:**
```bash
cd /Users/akilafernando/Documents/GitHub/Pet_AI_Backend
source venv/bin/activate
uvicorn chatbot.api:app --reload --port 8001
```
→ Running on `http://localhost:8001`
→ API Docs: `http://localhost:8001/docs`

**Frontend:**
```bash
cd /Users/akilafernando/Documents/GitHub/Pet_AI_Frontend
npm run dev
```
→ Running on `http://localhost:3000`

---

## 📋 Frontend Integration Overview

### Files Modified/Created

#### 1. **`hooks/useChatbotAPI.ts`** (NEW)
React hook for API communication
- `startConversation(animal)` - Start new session
- `sendMessage(sessionId, message)` - Send user message
- `uploadImage(sessionId, diseaseType, file)` - Analyze image
- `endSession(sessionId)` - End conversation

#### 2. **`app/(dashboard)/ai-assistant/page.tsx`** (UPDATED)
Connected to real backend API
- Pet selector modal (dog/cat)
- Session management with `sessionId`
- Real message sending with agentic RAG
- Image upload handler
- RAG indicator in chat

### How It Works

```
1. User opens AI Health Assistant page
   ↓
2. Pet selector modal appears
   ├─ User clicks 🐕 Dog or 🐱 Cat
   ├─ Calls: POST /api/chat/start { animal: "dog" }
   ├─ Receives: session_id
   ↓
3. Chat interface opens
   ├─ User types: "My dog is limping"
   ├─ Calls: POST /api/chat/message { session_id, message: "..." }
   ├─ Backend uses agentic RAG (intelligent routing)
   ├─ Receives: bot_response, used_rag=true, disease_detected="skin"
   ↓
4. Optional: Image Upload
   ├─ Upload button appears if disease detected
   ├─ User selects image file
   ├─ Calls: POST /api/chat/upload-image { session_id, disease_type, file }
   ├─ Backend analyzes image with CV model
   ├─ Receives: disease_class, confidence, explanation
   ├─ Display diagnosis card with analysis
```

---

## 🔗 API Endpoints Used

### Start Conversation
```
POST /api/chat/start
Request:  { animal: "dog" | "cat" }
Response: { session_id, animal, message }
```

### Send Message
```
POST /api/chat/message
Request:  { session_id, message }
Response: { bot_response, used_rag, disease_detected }
```

### Upload Image
```
POST /api/chat/upload-image
Request:  FormData { session_id, disease_type: "skin"|"eye", file }
Response: { disease_class, confidence, explanation }
```

---

## 🧪 Testing the Integration

### 1. Test Backend Health
```bash
curl http://localhost:8001/health
# Expected: {"status": "healthy", "service": "Pet AI Healthcare Chatbot API", "active_sessions": 0}
```

### 2. Test Pet Selection
Open browser: `http://localhost:3000/dashboard/ai-assistant`
- Click 🐕 Dog or 🐱 Cat button
- Should show chat interface with chosen pet

### 3. Test Message Flow
- Type: "My dog is limping"
- Backend detects disease + uses RAG
- Should receive response with `used_rag: true`

### 4. Test Image Upload
- Type: "My dog has a rash on his leg"
- Click "Upload" button
- Select an image file
- Should display diagnosis with confidence score

---

## 🛠️ Configuration

### Backend API URL
Located in: `hooks/useChatbotAPI.ts`
```typescript
const API_BASE_URL = 'http://localhost:8001';
```

Change if backend runs on different host/port.

### CORS Configuration
Already enabled in `chatbot/api.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🔍 Debugging

### Issue: "Cannot connect to API"
**Solution**: Check if backend is running on port 8001
```bash
lsof -i :8001  # macOS
# or
netstat -an | grep 8001  # Linux
```

### Issue: "Network error in chat"
**Solution**: Check browser console for error details
- Open DevTools (F12)
- Check Console tab for error messages
- Check Network tab for failed requests

### Issue: "Session not found"
**Solution**: Ensure pet selector runs first
- Session is created on `/api/chat/start`
- All messages need valid `session_id`

### Issue: "Image upload not working"
**Solution**: Check both backend and frontend
- Backend must be running CV Model API on port 8000
- Frontend must have `session_id` and `disease_type`

---

## 📱 Feature Checklist

- ✅ Pet type selection (dog/cat)
- ✅ Chat interface with real messages
- ✅ Agentic RAG routing (intelligent knowledge base usage)
- ✅ Image upload capability (when disease detected)
- ✅ Disease detection and analysis
- ✅ Confidence score display
- ✅ Recommendation cards (Actions/DOs/DON'Ts)
- ✅ RAG indicator in chat
- ✅ Loading states and animations
- ✅ Error handling

---

## 🚨 Important Notes

### Backend Unchanged ✅
- **No changes** to chatbot logic
- **No changes** to agentic RAG system
- **No changes** to prompts or memory
- CLI still works: `python -m chatbot.main`

### Frontend Integration Only
- Frontend is a new communication layer
- Uses exactly the same backend logic
- No duplication of code
- Clean separation of concerns

### Session Management
- Sessions are in-memory (per API process)
- Each session is independent
- Stateless API design
- For production: consider database persistence

---

## 📊 Data Flow Example

```
User Input: "My dog is limping"

┌─ Frontend ─────────────────────────────┐
│  1. User types message                  │
│  2. onClick: handleSend()               │
│  3. Call: sendMessage(sessionId, msg)   │
└─────────────────────────────────────────┘
                    ↓
┌─ API Layer ────────────────────────────┐
│  1. Receive: POST /api/chat/message    │
│  2. Extract: sessionId, message        │
│  3. Get session from memory            │
└─────────────────────────────────────────┘
                    ↓
┌─ Chatbot Logic (UNCHANGED) ────────────┐
│  1. Detect disease: "limping" → "skin" │
│  2. Call: query_agentic_rag()          │
│  3. Agentic RAG decides: need retrieval │
│  4. Search knowledge base              │
│  5. Generate response with context     │
│  6. Return: {bot_response, used_rag}   │
└─────────────────────────────────────────┘
                    ↓
┌─ Frontend ─────────────────────────────┐
│  1. Receive: bot_response              │
│  2. Show message in chat               │
│  3. Show 🔍 indicator (used_rag: true) │
│  4. Enable upload button (disease)     │
└─────────────────────────────────────────┘
```

---

## ✨ What's Next

### Optional Enhancements
1. **Conversation History**: Persist to database
2. **User Profiles**: Save per-user settings
3. **Analytics**: Track common questions
4. **Better Error UI**: More user-friendly errors
5. **Voice Input**: Add voice-to-text
6. **Multi-language**: Support other languages

### Production Deployment
1. Environment configuration
2. Session persistence database
3. Rate limiting
4. Authentication/Authorization
5. Monitoring and logging
6. Docker containerization

---

## 📞 Support

If integration issues occur:
1. Check backend is running: `curl http://localhost:8001/health`
2. Check frontend can reach it: Browser Network tab (F12)
3. Check console errors: Frontend DevTools console
4. Check API docs: `http://localhost:8001/docs`

**All backend logic is preserved and unchanged.**
**Frontend is just a communication layer.**
