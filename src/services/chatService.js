/**
 * Chat Service - Handles chatbot logic, lead qualification, and FAQ matching
 */

let faqData = null;
let onboardingGuide = null;

// Session storage for lead qualification
const sessionStore = new Map();

// Rate limiting
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 10000; // 10 seconds
const RATE_LIMIT_MAX = 3;

/**
 * Load FAQ data
 */
async function loadFAQ() {
  if (faqData) return faqData;
  
  try {
    const response = await fetch('/kb/faq.json');
    faqData = await response.json();
    return faqData;
  } catch (error) {
    console.error('Failed to load FAQ:', error);
    return { faqs: [] };
  }
}

/**
 * Load onboarding guide
 */
async function loadOnboardingGuide() {
  if (onboardingGuide) return onboardingGuide;
  
  try {
    const response = await fetch('/kb/guides/onboarding.md');
    onboardingGuide = await response.text();
    return onboardingGuide;
  } catch (error) {
    console.error('Failed to load onboarding guide:', error);
    return '';
  }
}

/**
 * Check rate limit
 */
function checkRateLimit(sessionId) {
  const now = Date.now();
  const requests = rateLimitStore.get(sessionId) || [];
  
  // Remove old requests outside the window
  const recentRequests = requests.filter(ts => now - ts < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT_MAX) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitStore.set(sessionId, recentRequests);
  return true;
}

/**
 * Simple string similarity (Jaccard index)
 */
function stringSimilarity(str1, str2) {
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Find best FAQ match
 */
async function findFAQMatch(text, feature) {
  const faqs = await loadFAQ();
  
  if (!faqs.faqs || faqs.faqs.length === 0) {
    return null;
  }
  
  // Filter by feature first, then fallback to global
  const featureFaqs = faqs.faqs.filter(faq => 
    faq.scope === feature || faq.scope === 'global'
  );
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const faq of featureFaqs) {
    // Check question similarity
    const qScore = stringSimilarity(text, faq.q);
    
    // Check if any tags match
    const tagScore = faq.tags?.some(tag => 
      text.toLowerCase().includes(tag.toLowerCase())
    ) ? 0.3 : 0;
    
    const totalScore = Math.max(qScore, tagScore);
    
    if (totalScore > bestScore && totalScore > 0.2) {
      bestScore = totalScore;
      bestMatch = faq;
    }
  }
  
  return bestMatch;
}

/**
 * Detect intent from text
 */
function detectIntent(text) {
  const lower = text.toLowerCase();
  
  // Handoff keywords
  if (/(talk to|speak with|human|agent|representative|support|help me)/i.test(lower)) {
    return 'handoff';
  }
  
  // Onboarding/getting started
  if (/(get started|onboard|how to start|first step|begin)/i.test(lower)) {
    return 'onboarding';
  }
  
  // Lead qualification fields
  if (/(budget|price|cost|spend)/i.test(lower)) return 'budget';
  if (/(timeline|when|deadline|urgency)/i.test(lower)) return 'timeline';
  if (/(role|position|title|job)/i.test(lower)) return 'role';
  if (/(email|contact|reach)/i.test(lower)) return 'email';
  if (/(name|called|i'm|i am)/i.test(lower)) return 'name';
  
  return 'faq';
}

/**
 * Extract field value from text
 */
function extractFieldValue(text, field) {
  const lower = text.toLowerCase();
  
  if (field === 'budget') {
    const match = text.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    return match ? parseFloat(match[1].replace(',', '')) : null;
  }
  
  if (field === 'timeline') {
    if (/(asap|immediately|urgent|right away|now)/i.test(lower)) return '1 week';
    if (/(\d+)\s*(week|wk)/i.test(lower)) {
      const match = lower.match(/(\d+)\s*(week|wk)/i);
      return `${match[1]} weeks`;
    }
    if (/(\d+)\s*(month|mo)/i.test(lower)) {
      const match = lower.match(/(\d+)\s*(month|mo)/i);
      return `${match[1]} months`;
    }
  }
  
  if (field === 'email') {
    const match = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    return match ? match[0] : null;
  }
  
  if (field === 'role') {
    const roles = ['founder', 'ceo', 'cto', 'head of growth', 'marketing lead', 'vp', 'director', 'manager'];
    for (const role of roles) {
      if (lower.includes(role)) return role;
    }
  }
  
  // For name, just return the text if it looks like a name
  if (field === 'name' && text.split(' ').length <= 4) {
    return text;
  }
  
  return text;
}

/**
 * Calculate lead score
 */
function calculateLeadScore(lead) {
  const { budget, timeline, role } = lead;
  
  const highValueRoles = ['founder', 'ceo', 'head of growth', 'marketing lead', 'vp'];
  const isHighValueRole = highValueRoles.some(r => role?.toLowerCase().includes(r));
  
  const budgetNum = typeof budget === 'number' ? budget : parseFloat(budget) || 0;
  const isHighBudget = budgetNum >= 2000;
  
  const timelineNum = timeline?.match(/(\d+)\s*week/i);
  const isUrgent = timelineNum ? parseInt(timelineNum[1]) <= 2 : 
                   timeline?.toLowerCase().includes('asap') || 
                   timeline?.toLowerCase().includes('urgent');
  
  if ((isHighBudget || isUrgent) && isHighValueRole) {
    return 'HOT';
  }
  
  if (isHighBudget || isUrgent || isHighValueRole) {
    return 'WARM';
  }
  
  return 'COLD';
}

/**
 * Create lead via API simulation
 */
async function createLead(lead) {
  const leadId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // In a real app, this would POST to /api/leads
  // For now, store in localStorage
  try {
    const leads = JSON.parse(localStorage.getItem('kimuntu_leads') || '[]');
    leads.push({ ...lead, leadId, createdAt: new Date().toISOString() });
    localStorage.setItem('kimuntu_leads', JSON.stringify(leads));
    
    console.log('✅ Lead created:', { leadId, lead });
  } catch (error) {
    console.error('Failed to create lead:', error);
  }
  
  return { leadId };
}

/**
 * Create handoff ticket
 */
async function createHandoff(sessionId, lastMessages) {
  const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('🎫 Handoff requested:', { sessionId, ticketId, messageCount: lastMessages.length });
  
  // In a real app, this would POST to /api/handoff
  return { ticketId };
}

/**
 * Main chat service
 */
export const chatService = {
  async sendMessage({ sessionId, text, context }) {
    const startTime = Date.now();
    
    // Rate limiting
    if (!checkRateLimit(sessionId)) {
      return {
        messages: ['Please slow down! I can only handle 3 messages every 10 seconds. 😅']
      };
    }
    
    const intent = detectIntent(text);
    
    console.log('💬 Chat request:', {
      sessionId,
      feature: context.feature,
      intent,
      elapsedMs: Date.now() - startTime
    });
    
    // Handle handoff
    if (intent === 'handoff') {
      const session = sessionStore.get(sessionId) || {};
      const messages = session.messages || [];
      
      const { ticketId } = await createHandoff(sessionId, messages);
      
      return {
        messages: [
          'I\'ll connect you with a human agent right away! 👋',
          `Your ticket ID is: ${ticketId}`
        ],
        handoffRequested: true,
        ticketId
      };
    }
    
    // Handle onboarding
    if (intent === 'onboarding') {
      const guide = await loadOnboardingGuide();
      const summary = guide ? 
        guide.split('\n').slice(0, 10).join('\n') : 
        `Here's how to get started:\n1. Sign up for an account\n2. Connect your data sources\n3. Create your first campaign\n4. Track results in real-time`;
      
      return {
        messages: [summary]
      };
    }
    
    // Lead qualification flow
    const session = sessionStore.get(sessionId) || {
      lead: {},
      messages: [],
      collectingFields: false
    };
    
    // Add message to history
    session.messages.push({ from: 'user', text, ts: Date.now() });
    
    // Check if user is providing qualification data
    const qualificationFields = ['name', 'email', 'role', 'budget', 'timeline'];
    const detectedField = qualificationFields.find(field => 
      detectIntent(text) === field || session.waitingFor === field
    );
    
    if (detectedField || session.collectingFields) {
      const field = detectedField || session.waitingFor;
      const value = extractFieldValue(text, field);
      
      if (value) {
        session.lead[field] = value;
        session.waitingFor = null;
      }
      
      // Check what's missing
      const missing = qualificationFields.filter(f => !session.lead[f]);
      
      if (missing.length > 0) {
        session.collectingFields = true;
        session.waitingFor = missing[0];
        
        const prompts = {
          name: 'Great! What\'s your name?',
          email: 'What\'s your email address?',
          role: 'What\'s your role in the company?',
          budget: 'What\'s your estimated budget? (e.g., $5000)',
          timeline: 'What\'s your timeline? (e.g., 2 weeks, 1 month)'
        };
        
        sessionStore.set(sessionId, session);
        
        return {
          messages: [prompts[missing[0]]]
        };
      } else {
        // All fields collected - qualify the lead
        const score = calculateLeadScore(session.lead);
        const contact = { ...session.lead, source: 'chatbot-web', score };
        
        const { leadId } = await createLead(contact);
        
        session.collectingFields = false;
        sessionStore.set(sessionId, session);
        
        const scoreMessages = {
          'HOT': '🔥 Excellent! You\'re a high-priority lead. Our team will reach out within 24 hours!',
          'WARM': '✨ Great! We\'ll have someone contact you within 2-3 business days.',
          'COLD': '📧 Thanks! We\'ll send you more information via email.'
        };
        
        console.log('📊 Lead qualified:', { score, leadId, contact });
        
        return {
          messages: [
            'Thanks for providing that information!',
            scoreMessages[score]
          ],
          leadQualified: { score, contact },
          leadId
        };
      }
    }
    
    // Try to find FAQ match
    const faqMatch = await findFAQMatch(text, context.feature);
    
    if (faqMatch) {
      sessionStore.set(sessionId, session);
      return {
        messages: [faqMatch.a]
      };
    }
    
    // Default response with lead qualification offer
    const defaultResponses = [
      'I\'m not sure I understand. Can you rephrase that?',
      'I can help you with questions about KimuntuX, or connect you with our sales team. What would you like to know?',
      'Try asking about our features, pricing, or say "talk to a human" to speak with someone.'
    ];
    
    sessionStore.set(sessionId, session);
    
    return {
      messages: [defaultResponses[Math.floor(Math.random() * defaultResponses.length)]]
    };
  }
};
