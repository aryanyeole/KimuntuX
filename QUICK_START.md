# 🚀 Quick Start: Chatbot Testing Guide

## Instant Test (3 minutes)

### 1. Start the App
The app should already be running. If not:
```bash
cd KimuntuX
npm start
```
Visit: http://localhost:3000

### 2. Open the Chatbot
Look for the **purple circular button** with 💬 in the bottom-right corner. Click it!

### 3. Try These Commands

#### Test FAQ System:
```
You: What is KimuntuX?
Bot: [Explains KimuntuX is an AI-driven platform...]

You: How much does it cost?
Bot: [Provides pricing information...]

You: How do I create a campaign?
Bot: [Explains campaign creation...]
```

#### Test Lead Qualification:
```
You: My name is John Doe
Bot: Great! What's your email address?

You: john@example.com
Bot: What's your role in the company?

You: CEO
Bot: What's your estimated budget?

You: $10000
Bot: What's your timeline?

You: 2 weeks
Bot: 🔥 Excellent! You're a high-priority lead...
```

**Check localStorage**: F12 → Application → Local Storage → Look for `kimuntu_leads`

#### Test Human Handoff:
```
You: I want to talk to a human
Bot: I'll connect you with a human agent right away! 👋
```

**Check console**: F12 → Console → You should see handoff ticket created

#### Test Context Awareness:
1. Go to `/crm` page
2. Open chatbot
3. Welcome message should mention "crm"

4. Go to `/affiliate-hub` page
5. Welcome message should mention "campaigns"

#### Test Rate Limiting:
Send 4 messages rapidly (within 1 second):
```
Message 1
Message 2
Message 3
Message 4
```
The 4th message should get: "Please slow down! I can only handle 3 messages every 10 seconds."

### 4. Check Events (Developer Console)

Open F12 → Console, paste this:
```javascript
window.addEventListener('kimuntu:lead_qualified', (e) => {
  console.log('✅ LEAD QUALIFIED!', e.detail);
});

window.addEventListener('kimuntu:handoff_requested', () => {
  console.log('✅ HANDOFF REQUESTED!');
});
```

Now complete a lead qualification or request handoff. Events will log!

### 5. Test Accessibility

1. Click somewhere on the page
2. Press `Tab` repeatedly until chat button is focused
3. Press `Enter` to open
4. Input field should auto-focus
5. Type a message and press `Escape` - drawer should close

---

## 🎯 Expected Results

✅ Chatbot button appears bottom-right  
✅ Clicking opens a drawer with "KimuntuX Assistant" header  
✅ Welcome message mentions current page feature  
✅ FAQ questions get relevant answers  
✅ Lead qualification collects 5 fields  
✅ "Talk to human" triggers handoff  
✅ Rate limiting prevents spam  
✅ Events fire in console  
✅ Keyboard navigation works  
✅ Dark mode adapts automatically  

---

## 📊 What to Look For

### Console Logs
Every chat message logs:
```javascript
💬 Chat request: {
  sessionId: "sess_1730918400_abc123",
  feature: "crm",
  intent: "faq",
  elapsedMs: 45
}
```

### localStorage Data
```javascript
// Session ID (persistent)
kimuntu_chat_session_id: "sess_1730918400_abc123"

// Qualified leads
kimuntu_leads: [{
  name: "John Doe",
  email: "john@example.com",
  role: "CEO",
  budget: 10000,
  timeline: "2 weeks",
  score: "HOT",
  source: "chatbot-web",
  leadId: "lead_1730918400_xyz789",
  createdAt: "2025-11-06T..."
}]
```

---

## 🐛 Troubleshooting

### Chatbot not appearing?
- Check console for errors
- Verify you're on http://localhost:3000
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### FAQ not working?
- Check Network tab: `/kb/faq.json` should load (200 OK)
- If 404, verify file exists in `public/kb/faq.json`

### Events not firing?
- Open console BEFORE performing action
- Verify event listener is attached (paste code above)
- Check for typos in event names

### Rate limit not working?
- Must send messages within 10 seconds
- Each new page visit resets the limit
- Check console for rate limit message

---

## 🎨 Customization Quick Tips

### Change Button Color
Edit `src/styles/chatbot.css` line 7:
```css
background: linear-gradient(135deg, #YOUR_COLOR1 0%, #YOUR_COLOR2 100%);
```

### Change Position
Edit `src/styles/chatbot.css` lines 3-4:
```css
bottom: 50px;  /* Your value */
right: 50px;   /* Your value */
```

### Add More FAQs
Edit `public/kb/faq.json`:
```json
{
  "id": "kx-custom-01",
  "scope": "global",
  "q": "Your question?",
  "a": "Your answer!",
  "tags": ["tag1", "tag2"]
}
```

### Change Welcome Message
Edit `src/components/ChatWidget.js` line ~60:
```javascript
text: `Your custom welcome message!`
```

---

## 📱 Mobile Testing

1. Open Chrome DevTools (F12)
2. Click "Toggle Device Toolbar" (Ctrl+Shift+M)
3. Select iPhone/Android device
4. Test chatbot - should be responsive!

---

## ✅ Success Checklist

- [ ] Chatbot button visible and clickable
- [ ] Drawer opens/closes smoothly
- [ ] Welcome message appears
- [ ] Can send and receive messages
- [ ] FAQ responses are relevant
- [ ] Lead qualification works (all 5 fields)
- [ ] Handoff creates ticket ID
- [ ] Rate limiting prevents spam
- [ ] Events fire in console
- [ ] Keyboard navigation works
- [ ] Works on mobile view
- [ ] Dark mode looks good

---

**All done? Read `CHATBOT_README.md` for advanced features!** 🎉
