# KimuntuX Chatbot Feature

## Overview
A fully-featured, context-aware chatbot widget integrated into the KimuntuX React application. The chatbot provides intelligent FAQ responses, lead qualification, and human handoff capabilities.

## Features

### ✅ Implemented
- **Global Context Provider** - Tracks page context and user session
- **Floating Chat Widget** - Beautiful UI with drawer interface
- **FAQ System** - 20+ pre-configured FAQs with intelligent matching
- **Lead Qualification** - Automatic collection of name, email, role, budget, timeline
- **Lead Scoring** - HOT/WARM/COLD classification based on criteria
- **Human Handoff** - Escalation to support agents
- **Rate Limiting** - 3 messages per 10 seconds
- **Session Persistence** - Maintains conversation across page changes
- **Accessibility** - Full keyboard navigation, ARIA attributes, screen reader support
- **Dark Mode** - Automatic theme detection
- **Mobile Responsive** - Optimized for all screen sizes

## Architecture

### File Structure
```
src/
├── providers/
│   └── ChatbotProvider.js       # Context provider with session & routing logic
├── components/
│   └── ChatWidget.js            # UI component with drawer & messages
├── services/
│   └── chatService.js           # Business logic, FAQ matching, lead qualification
└── styles/
    └── chatbot.css              # Styling with dark mode support

public/
└── kb/
    ├── faq.json                 # Knowledge base with 20+ FAQs
    └── guides/
        └── onboarding.md        # Getting started guide
```

### Data Flow
1. User opens chat widget
2. `ChatbotProvider` generates/retrieves `sessionId` from localStorage
3. `ChatWidget` displays welcome message based on current route
4. User sends message → `sendMessage()` → `chatService.sendMessage()`
5. Service detects intent (FAQ, lead qualification, handoff)
6. Responds with appropriate messages
7. Emits DOM events for lead qualification and handoff

## Usage

### Basic Integration (Already Done)
The chatbot is already integrated into `App.js`:

```javascript
import { ChatbotProvider } from './providers/ChatbotProvider';
import ChatWidget from './components/ChatWidget';

function App() {
  return (
    <Router>
      <ChatbotProvider>
        {/* Your app */}
        <ChatWidget />
      </ChatbotProvider>
    </Router>
  );
}
```

### Listen to Events
```javascript
// Lead qualified event
window.addEventListener('kimuntu:lead_qualified', (e) => {
  const { score, contact } = e.detail;
  console.log('New lead:', score, contact);
  // Send to analytics, CRM, etc.
});

// Handoff requested
window.addEventListener('kimuntu:handoff_requested', () => {
  console.log('User requested human support');
  // Notify support team
});
```

### Customize Welcome Message
Edit `ChatWidget.js` line ~60:
```javascript
const welcomeMsg = {
  text: `Your custom welcome message for ${pageContext.feature}`
};
```

### Add More FAQs
Edit `public/kb/faq.json`:
```json
{
  "id": "kx-custom-01",
  "scope": "global",
  "q": "Your question?",
  "a": "Your answer",
  "tags": ["tag1", "tag2"]
}
```

### Adjust Lead Scoring
Edit `services/chatService.js` function `calculateLeadScore()`:
```javascript
// Customize criteria for HOT/WARM/COLD
const isHighBudget = budgetNum >= 5000; // Change threshold
```

## Testing

### Run Cypress Tests
```bash
npm install cypress --save-dev
npx cypress open
```

Select `chatbot.cy.js` to run the test suite.

### Test Coverage
- Widget visibility and interaction
- Message sending and receiving
- FAQ matching
- Lead qualification flow (5-step collection)
- Handoff flow
- Rate limiting
- Context awareness across pages
- Accessibility (keyboard, ARIA)
- Session persistence

## Configuration

### Rate Limiting
Edit `services/chatService.js`:
```javascript
const RATE_LIMIT_WINDOW = 10000; // milliseconds
const RATE_LIMIT_MAX = 3;        // messages per window
```

### Feature Detection
Edit `providers/ChatbotProvider.js` function `inferFeature()`:
```javascript
if (route.includes('/your-page')) return 'your-feature';
```

## Lead Storage

Currently leads are stored in `localStorage`. To persist to a backend:

Edit `services/chatService.js` function `createLead()`:
```javascript
async function createLead(lead) {
  const response = await fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lead)
  });
  return await response.json();
}
```

## Styling Customization

### Change Colors
Edit `styles/chatbot.css`:
```css
/* Button & header gradient */
background: linear-gradient(135deg, #YOUR_COLOR 0%, #YOUR_COLOR2 100%);

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .chat-widget-drawer {
    background: #YOUR_DARK_BG;
  }
}
```

### Change Position
```css
.chat-widget-button {
  bottom: 24px;  /* Distance from bottom */
  right: 24px;   /* Distance from right */
}
```

## Performance

- **FAQ Loading**: Fetched once and cached
- **Session Storage**: In-memory Map for active sessions
- **Rate Limiting**: Prevents spam and reduces server load
- **Lazy Loading**: Chat service loaded only when needed

## Accessibility

- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ ARIA labels and roles
- ✅ Focus management
- ✅ Screen reader announcements (aria-live="polite")
- ✅ Color contrast (WCAG AA compliant)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Known Limitations

1. **No Backend**: Currently uses localStorage for lead storage
2. **Simple FAQ Matching**: Uses basic string similarity (can be upgraded to NLP)
3. **No Chat History**: Messages cleared on page refresh
4. **No Authentication**: No user login integration yet

## Future Enhancements

- [ ] Real-time typing status from bot
- [ ] File upload support
- [ ] Voice input
- [ ] Multi-language support
- [ ] Chat history persistence
- [ ] Agent assignment and routing
- [ ] Analytics dashboard
- [ ] Sentiment analysis
- [ ] Suggested replies
- [ ] Rich media (images, videos, carousels)

## Troubleshooting

### Chatbot not appearing
- Check browser console for errors
- Verify `ChatbotProvider` wraps your app
- Ensure CSS file is imported

### FAQ not working
- Check `public/kb/faq.json` exists
- Verify file is accessible (check Network tab)
- Ensure JSON is valid

### Events not firing
- Check browser console for event names
- Verify event listener is attached before chatbot loads
- Use `window.addEventListener` not element-specific

## Support

For questions or issues:
- Check console logs (all requests logged with timing)
- Review Cypress tests for examples
- Contact: support@kimuntux.com

---

**Built with ❤️ for KimuntuX**
