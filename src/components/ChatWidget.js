import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChatbot } from '../providers/ChatbotProvider';
import '../styles/chatbot.css';

/**
 * ChatWidget - Floating chatbot with drawer interface
 */
export default function ChatWidget() {
  const { sendMessage, pageContext } = useChatbot();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const drawerRef = useRef(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);
  
  // Handle Escape key to close drawer
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);
  
  // Add welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMsg = {
        id: `msg_${Date.now()}`,
        from: 'bot',
        text: `Welcome to KimuX Assistant! I'm here to help you with ${pageContext.feature === 'global' ? 'anything' : pageContext.feature}. How can I assist you today?`,
        ts: Date.now()
      };
      setMessages([welcomeMsg]);
    }
  }, [isOpen, messages.length, pageContext.feature]);
  
  /**
   * Handle lead qualification event
   */
  const handleLeadQualified = useCallback((score, contact) => {
    window.dispatchEvent(
      new CustomEvent('kimuntu:lead_qualified', {
        detail: { score, contact }
      })
    );
  }, []);
  
  /**
   * Handle handoff request event
   */
  const handleHandoff = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent('kimuntu:handoff_requested')
    );
  }, []);
  
  /**
   * Send user message and get bot response
   */
  const handleSendMessage = async () => {
    if (!inputText.trim() || isTyping) return;
    
    const userMsg = {
      id: `msg_${Date.now()}`,
      from: 'user',
      text: inputText.trim(),
      ts: Date.now()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    
    try {
      const response = await sendMessage(userMsg.text);
      
      // Add bot messages
      if (response.messages && response.messages.length > 0) {
        const newBotMessages = response.messages.map((msg, idx) => ({
          id: `msg_${Date.now()}_${idx}`,
          from: 'bot',
          text: typeof msg === 'string' ? msg : msg.text,
          ts: Date.now() + idx
        }));
        
        setMessages(prev => [...prev, ...newBotMessages]);
      }
      
      // Handle events
      if (response.leadQualified) {
        handleLeadQualified(response.leadQualified.score, response.leadQualified.contact);
      }
      
      if (response.handoffRequested) {
        handleHandoff();
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMsg = {
        id: `msg_${Date.now()}_error`,
        from: 'bot',
        text: 'Sorry, I encountered an error. Please try again.',
        ts: Date.now()
      };
      
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <>
      {/* Floating Button */}
      <button
        className="chat-widget-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open chat assistant"
        aria-expanded={isOpen}
      >
        {isOpen ? '×' : '💬'}
      </button>
      
      {/* Drawer */}
      {isOpen && (
        <div
          className="chat-widget-drawer"
          ref={drawerRef}
          role="dialog"
          aria-label="KimuX Assistant"
          aria-modal="true"
        >
          {/* Header */}
          <div className="chat-widget-header">
            <h2>KimuX Assistant</h2>
            <button
              className="chat-widget-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>
          
          {/* Messages */}
          <div className="chat-widget-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message chat-message-${msg.from}`}
                role={msg.from === 'bot' ? 'status' : undefined}
                aria-live={msg.from === 'bot' ? 'polite' : undefined}
              >
                <div className="chat-message-content">
                  {msg.text}
                </div>
                <div className="chat-message-time">
                  {new Date(msg.ts).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="chat-message chat-message-bot">
                <div className="chat-message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input Bar */}
          <div className="chat-widget-input-bar">
            <input
              ref={inputRef}
              type="text"
              className="chat-widget-input"
              placeholder="Type your message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isTyping}
              aria-label="Chat message input"
            />
            <button
              className="chat-widget-send"
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              aria-label="Send message"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
