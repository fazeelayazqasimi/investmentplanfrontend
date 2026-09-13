import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, ChevronDown } from 'lucide-react';
import {
  getUserConversations,
  getUserMessages,
  createUserConversation,
  sendUserMessage,
  closeConversation,
} from '../services/apiClient';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const messagesEnd = useRef(null);
  const inputRef = useRef(null);

  const scrollBottom = () => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (open) {
      loadConversations();
    }
  }, [open]);

  useEffect(() => {
    if (activeConvo) {
      loadMessages(activeConvo._id);
    }
  }, [activeConvo]);

  useEffect(() => {
    scrollBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await getUserConversations();
      setConversations(data.conversations || []);
    } catch (_) {}
    finally { setLoading(false); }
  };

  const loadMessages = async (id) => {
    try {
      setLoading(true);
      const data = await getUserMessages(id);
      setMessages(data.messages || []);
    } catch (_) {}
    finally { setLoading(false); }
  };

  const handleNewConversation = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const data = await createUserConversation({ subject: newSubject || 'Support Request', message: newMessage });
      setShowNew(false);
      setNewSubject('');
      setNewMessage('');
      await loadConversations();
      setActiveConvo(data.conversation);
    } catch (_) {}
    finally { setSending(false); }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeConvo) return;
    setSending(true);
    try {
      const data = await sendUserMessage(activeConvo._id, input);
      setMessages((prev) => [...prev, data.message]);
      setInput('');
      await loadConversations();
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (_) {}
    finally { setSending(false); }
  };

  const handleClose = async (id) => {
    try {
      await closeConversation(id);
      if (activeConvo?._id === id) {
        setActiveConvo(null);
        setMessages([]);
      }
      await loadConversations();
    } catch (_) {}
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const openChat = (convo) => {
    setActiveConvo(convo);
    setShowNew(false);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--color-primary, #5B4BFF)', color: '#fff',
          border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(91,75,255,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s',
        }}
      >
        {open ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Chat Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 92, right: 24, zIndex: 9999,
          width: 380, maxWidth: 'calc(100vw - 48px)', height: 520, maxHeight: 'calc(100vh - 140px)',
          background: '#fff', borderRadius: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          border: '1px solid var(--color-border, #e5e7eb)',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid var(--color-border, #e5e7eb)',
            background: 'var(--color-primary, #5B4BFF)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Support Chat</div>
            {activeConvo && (
              <button onClick={() => { setActiveConvo(null); setMessages([]); }}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13 }}>
                ← Back
              </button>
            )}
          </div>

          {/* Body */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {!activeConvo && !showNew && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                <button
                  onClick={() => setShowNew(true)}
                  style={{
                    width: '100%', padding: '12px', marginBottom: 8,
                    background: 'var(--color-bg-secondary, #f9fafb)', border: '1px dashed var(--color-border, #d1d5db)',
                    borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--color-primary, #5B4BFF)',
                  }}
                >
                  + New Conversation
                </button>
                {loading && <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>Loading...</div>}
                {!loading && conversations.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 40, color: '#999', fontSize: 13 }}>
                    No conversations yet. Start a new one!
                  </div>
                )}
                {conversations.map((c) => (
                  <div
                    key={c._id}
                    onClick={() => openChat(c)}
                    style={{
                      padding: '12px 14px', marginBottom: 6, borderRadius: 10,
                      background: c._id === activeConvo?._id ? 'var(--color-bg-secondary, #f3f4f6)' : 'transparent',
                      cursor: 'pointer', border: '1px solid var(--color-border, #f3f4f6)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.background = c._id === activeConvo?._id ? '#f3f4f6' : 'transparent'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{c.subject}</span>
                      <span style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 12,
                        background: c.status === 'OPEN' ? '#dbeafe' : c.status === 'IN_PROGRESS' ? '#fef3c7' : c.status === 'RESOLVED' ? '#d1fae5' : '#f3f4f6',
                        color: c.status === 'OPEN' ? '#1d4ed8' : c.status === 'IN_PROGRESS' ? '#b45309' : c.status === 'RESOLVED' ? '#047857' : '#6b7280',
                        fontWeight: 500,
                      }}>
                        {c.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.lastMessage}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                      {new Date(c.lastMessageAt).toLocaleDateString()}
                      {c.unreadByUser > 0 && (
                        <span style={{
                          marginLeft: 8, background: 'var(--color-primary, #5B4BFF)', color: '#fff',
                          padding: '1px 6px', borderRadius: 8, fontSize: 10, fontWeight: 600,
                        }}>
                          {c.unreadByUser} new
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* New Conversation Form */}
            {showNew && (
              <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  placeholder="Subject (optional)"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  style={{
                    padding: '10px 12px', border: '1px solid var(--color-border, #d1d5db)',
                    borderRadius: 8, fontSize: 14, outline: 'none',
                  }}
                />
                <textarea
                  placeholder="How can we help you?"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={5}
                  style={{
                    padding: '10px 12px', border: '1px solid var(--color-border, #d1d5db)',
                    borderRadius: 8, fontSize: 14, outline: 'none', resize: 'none', flex: 1,
                  }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowNew(false)}
                    style={{
                      flex: 1, padding: '10px', border: '1px solid var(--color-border, #d1d5db)',
                      borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14,
                    }}>
                    Cancel
                  </button>
                  <button onClick={handleNewConversation} disabled={sending || !newMessage.trim()}
                    style={{
                      flex: 1, padding: '10px', border: 'none',
                      borderRadius: 8, background: 'var(--color-primary, #5B4BFF)', color: '#fff',
                      cursor: 'pointer', fontSize: 14, fontWeight: 500, opacity: sending || !newMessage.trim() ? 0.6 : 1,
                    }}>
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            {activeConvo && (
              <>
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
                  {loading && <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>Loading...</div>}
                  {messages.map((m) => {
                    const isUser = m.senderRole === 'USER';
                    return (
                      <div key={m._id} style={{
                        display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
                        marginBottom: 8,
                      }}>
                        <div style={{
                          maxWidth: '80%', padding: '10px 14px', borderRadius: 12,
                          background: isUser ? 'var(--color-primary, #5B4BFF)' : '#f3f4f6',
                          color: isUser ? '#fff' : 'var(--color-text, #1a1a2e)',
                          fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word',
                        }}>
                          <div>{m.message}</div>
                          <div style={{
                            fontSize: 10, marginTop: 4,
                            color: isUser ? 'rgba(255,255,255,0.7)' : '#9ca3af',
                          }}>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEnd} />
                </div>

                {/* Input */}
                <div style={{
                  padding: '12px 16px', borderTop: '1px solid var(--color-border, #e5e7eb)',
                  display: 'flex', gap: 8, alignItems: 'flex-end',
                }}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    style={{
                      flex: 1, padding: '10px 12px', border: '1px solid var(--color-border, #d1d5db)',
                      borderRadius: 8, fontSize: 13, outline: 'none', resize: 'none',
                      maxHeight: 80, minHeight: 40,
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !input.trim()}
                    style={{
                      width: 40, height: 40, borderRadius: 8, border: 'none',
                      background: 'var(--color-primary, #5B4BFF)', color: '#fff',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: sending || !input.trim() ? 0.5 : 1,
                    }}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
