import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const ChatbotContext = createContext(null);

/**
 * Infer feature from pathname
 */
export function inferFeature(pathname) {
  const route = pathname.toLowerCase();
  
  if (route.includes('/crm')) return 'crm';
  if (route.includes('/campaign') || route.includes('/affiliate')) return 'campaigns';
  if (route.includes('/payout') || route.includes('/monetization')) return 'payouts';
  if (route.includes('/setting') || route.includes('/integration')) return 'settings';
  if (route.includes('/b2b-brokerage')) return 'b2b-brokerage';
  if (route.includes('/b2c-marketplace')) return 'b2c-marketplace';
  if (route.includes('/ecommerce')) return 'ecommerce';
  if (route.includes('/ai-dashboard')) return 'ai-dashboard';
  if (route.includes('/blockchain')) return 'blockchain';
  if (route.includes('/fintech')) return 'fintech';
  if (route.includes('/commerce-intelligence')) return 'commerce-intelligence';
  if (route.includes('/developer')) return 'developer';
  if (route.includes('/usbh')) return 'usbh';
  
  return 'global';
}

/**
 * Generate or retrieve a stable sessionId
 */
function getSessionId() {
  let sessionId = localStorage.getItem('kimuntu_chat_session_id');
  
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('kimuntu_chat_session_id', sessionId);
  }
  
  return sessionId;
}

/**
 * Get current user from localStorage or context
 */
function getCurrentUser() {
  try {
    const userStr = localStorage.getItem('kimuntu_current_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

export function ChatbotProvider({ children }) {
  const location = useLocation();
  const [sessionId] = useState(getSessionId);
  const [pageContext, setPageContext] = useState({
    route: '/',
    feature: 'global',
    userRole: 'guest'
  });
  
  // Update pageContext when route changes
  useEffect(() => {
    const currentUser = getCurrentUser();
    
    setPageContext({
      route: location.pathname,
      feature: inferFeature(location.pathname),
      userRole: currentUser?.role ?? 'guest'
    });
  }, [location]);
  
  /**
   * Send a message to the chatbot
   */
  const sendMessage = useCallback(async (text) => {
    const { chatService } = await import('../services/chatService');
    
    const response = await chatService.sendMessage({
      sessionId,
      text,
      context: pageContext
    });
    
    return response;
  }, [sessionId, pageContext]);
  
  const value = {
    sessionId,
    pageContext,
    sendMessage
  };
  
  return (
    <ChatbotContext.Provider value={value}>
      {children}
    </ChatbotContext.Provider>
  );
}

export function useChatbot() {
  const context = useContext(ChatbotContext);
  
  if (!context) {
    throw new Error('useChatbot must be used within ChatbotProvider');
  }
  
  return context;
}
