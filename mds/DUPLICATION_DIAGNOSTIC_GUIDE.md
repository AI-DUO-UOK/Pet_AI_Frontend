# Chatbot Message Duplication - Diagnostic Guide

## Issue Summary
- **Symptom**: Frontend displays duplicated sections (headings, bullet points, paragraphs)
- **Confirmed**: Backend and LangSmith outputs are correct (no duplicates in source)
- **Location**: Issue is between API response and UI rendering

## Investigation Completed

### 1. Changes Made for Diagnostics

#### ✅ Disabled React StrictMode
**File**: `next.config.ts`
- Changed `reactStrictMode: true` → `false`
- **Reason**: StrictMode causes double rendering in development, which can affect streaming and state updates
- **Impact**: This alone might have fixed the issue if it was causing effect hooks to run twice

#### ✅ Added Comprehensive Logging to Streaming Parser
**File**: `hooks/useChatbotAPI.ts` - `sendMessageStream` function
- Logs each chunk received with size and content preview
- Logs total chunk count and cumulative size
- Logs chunk details: size, done flag, metadata

**Console output to look for**:
```
[STREAM] Starting streaming response
[STREAM] Chunk 1 - Length: 15 Done: false Content: "## Symptoms "
[STREAM] Chunk 2 - Length: 50 Done: false Content: "- Item 1\n- Item 2 "
...
[STREAM] Stream ended. Total chunks: N Total size: M
```

#### ✅ Added Detailed Logging to State Updates
**File**: `app/(dashboard)/ai-assistant/page.tsx` - `handleSend` function
- Logs message creation with unique IDs
- Logs each chunk update with OLD and NEW content lengths
- Logs final accumulated content length
- Tracks chunk counter for duplicate detection

**Console output to look for**:
```
[UI] Creating messages. User ID: 123, AI ID: 124
[UI] Messages updated. Total messages: 2 AI message content length: 0
[UI] Chunk 1 - Length: 15 Accumulated length: 15
[UI] State update for AI message. Old length: 0 New length: 15
[UI] Chunk 2 - Length: 50 Accumulated length: 65
[UI] State update for AI message. Old length: 15 New length: 65
...
[UI] Stream completed. Final accumulated content length: M
```

#### ✅ Added Message Rendering Logs
**File**: `app/(dashboard)/ai-assistant/page.tsx` - useEffect hook
- Logs all messages whenever they change
- Shows message count, IDs, content lengths
- Helps identify if duplicate message objects are created

**Console output to look for**:
```
[RENDER] Messages changed. Count: 3
[RENDER] Message 0: ID=123, Role=user, Content Length=20
[RENDER] Message 1: ID=124, Role=ai, Content Length=200, Is Streaming=false
[RENDER] Message 2: ID=125, Role=ai, Content Length=180
```

## How to Debug

### Step 1: Open Browser DevTools
1. Open the chatbot page
2. Press F12 (or Cmd+Option+I on Mac)
3. Go to Console tab
4. Filter by `[STREAM]`, `[UI]`, or `[RENDER]` to see diagnostic logs

### Step 2: Send a Test Message
1. Select a pet (dog or cat)
2. Send a message that triggers the AI response
3. Watch the console logs

### Step 3: Analyze the Logs

#### Look for these signs of duplication:

**Issue A: Chunks being sent twice**
- If you see the SAME chunk logged twice with the same content
- Example: Two `[STREAM] Chunk 1 - Length: 15` logs
- **Cause**: Backend streaming twice, or network retry

**Issue B: Content being appended twice**
- If accumulated content length grows more than chunk sizes
- Example: Chunk is 15 bytes, but accumulated goes from 0 to 30
- **Cause**: State update applying chunk twice

**Issue C: Message objects duplicated**
- If you see TWO `Role=ai` messages with same content
- Example: Message 1 and Message 2 both have AI role and similar content length
- **Cause**: Message being created twice in state

**Issue D: React rendering same message twice**
- If rendered output shows same content twice but logs show it only once
- **Cause**: ReactMarkdown rendering issue or manual text rendering alongside markdown

## Expected Correct Behavior

### Healthy Stream Log Sequence
```
[STREAM] Starting streaming response
[STREAM] Chunk 1 - Length: 50 Done: false Content: "..."
[STREAM] Chunk 2 - Length: 45 Done: false Content: "..."
[STREAM] Chunk 3 - Length: 60 Done: false Content: "..."
[STREAM] Chunk 4 - Length: 0 Done: true Content: ""  // Final chunk
[STREAM] Stream ended. Total chunks: 4 Total size: 155
```

### Healthy UI Log Sequence
```
[UI] Creating messages. User ID: 123, AI ID: 124
[UI] Messages updated. Total messages: 2
[UI] Starting stream for AI message: 124
[UI] Chunk 1 - Length: 50 Accumulated length: 50
[UI] State update for AI message. Old length: 0 New length: 50
[UI] Chunk 2 - Length: 45 Accumulated length: 95
[UI] State update for AI message. Old length: 50 New length: 95
[UI] Chunk 3 - Length: 60 Accumulated length: 155
[UI] State update for AI message. Old length: 95 New length: 155
[UI] Chunk 4 - Length: 0 Accumulated length: 155
[UI] State update for AI message. Old length: 155 New length: 155
[UI] Stream completed. Final accumulated content length: 155
```

### Healthy Render Log Sequence
```
[RENDER] Messages changed. Count: 2
[RENDER] Message 0: ID=123, Role=user, Content Length=20
[RENDER] Message 1: ID=124, Role=ai, Content Length=155
```

## Common Issues and Solutions

### Issue: Chunks Logged Twice
**Solution**: Check backend streaming endpoint for duplicate yields

### Issue: Accumulated Length Wrong
**Solution**: Check if state update is concatenating correctly
- Verify `content += chunk` is working
- Check if chunk is being passed twice
- Verify state updates aren't batching incorrectly

### Issue: Duplicate Messages in State
**Solution**: Check message creation and IDs
- Verify each message gets unique ID
- Check if user/AI messages are being created correctly
- Verify message arrays aren't duplicating on update

### Issue: Rendered Output Shows Duplicates But Logs Show One Message
**Solution**: ReactMarkdown or manual rendering issue
- Check if content is being rendered both as markdown AND as text
- Verify no duplicate rendering of message content
- Check custom markdown components

## Next Steps After Diagnostics

1. **Analyze the console logs** from Steps 2-3 above
2. **Identify which category the issue falls into** (A, B, C, or D)
3. **Share the logs** if additional help is needed
4. **Test in production build** to confirm if StrictMode fix resolved issue
5. **If still duplicating**, apply targeted fix based on root cause

## Files Modified
- ✅ `next.config.ts` - Disabled StrictMode
- ✅ `hooks/useChatbotAPI.ts` - Added streaming logs
- ✅ `app/(dashboard)/ai-assistant/page.tsx` - Added state and render logs

## Testing the Fix

### To verify if StrictMode fix worked:
```bash
npm run build    # Build for production (StrictMode only affects dev)
npm run start    # Run production build
```

Production builds do NOT use StrictMode, so if the issue goes away in production build, then StrictMode was the culprit.
