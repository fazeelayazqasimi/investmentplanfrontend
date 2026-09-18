import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, ChevronDown, Paperclip, Image as ImageIcon } from 'lucide-react';
import {
  getUserConversations,
  getUserMessages,
  createUserConversation,
  createUserConversationWithImages,
  sendUserMessage,
  sendUserMessageWithImages,
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
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const messagesEnd = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

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

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newImages = files.slice(0, 5 - selectedImages.length);
    setSelectedImages(prev => [...prev, ...newImages]);
    newImages.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews(prev => [...prev, ev.target.result]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (idx) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const clearImages = () => {
    setSelectedImages([]);
    setImagePreviews([]);
  };

  const handleNewConversation = async () => {
    if (!newMessage.trim() && selectedImages.length === 0) return;
    setSending(true);
    try {
      if (selectedImages.length > 0) {
        const fd = new FormData();
        fd.append('subject', newSubject || 'Support Request');
        if (newMessage.trim()) fd.append('message', newMessage);
        selectedImages.forEach(f => fd.append('images', f));
        const data = await createUserConversationWithImages(fd);
        setShowNew(false);
        setNewSubject('');
        setNewMessage('');
        clearImages();
        await loadConversations();
        setActiveConvo(data.conversation);
      } else {
        const data = await createUserConversation({ subject: newSubject || 'Support Request', message: newMessage });
        setShowNew(false);
        setNewSubject('');
        setNewMessage('');
        await loadConversations();
        setActiveConvo(data.conversation);
      }
    } catch (_) {}
    finally { setSending(false); }
  };

  const handleSend = async () => {
    if ((!input.trim() && selectedImages.length === 0) || !activeConvo) return;
    setSending(true);
    try {
      if (selectedImages.length > 0) {
        const fd = new FormData();
        if (input.trim()) fd.append('message', input);
        selectedImages.forEach(f => fd.append('images', f));
        const data = await sendUserMessageWithImages(activeConvo._id, fd);
        setMessages((prev) => [...prev, data.message]);
        setInput('');
        clearImages();
      } else {
        const data = await sendUserMessage(activeConvo._id, input);
        setMessages((prev) => [...prev, data.message]);
        setInput('');
      }
    } catch (_) {}
    finally { setSending(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = async (id) => {
    try {
      await closeConversation(id);
      setConversations(prev => prev.map(c => c._id === id ? { ...c, status: 'CLOSED' } : c));
      if (activeConvo?._id === id) setActiveConvo(null);
    } catch (_) {}
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed', bottom: 20, right: 20, width: 56, height: 56,
          borderRadius: '50%', background: 'var(--color-primary, #008C3A)',
          color: '#fff', border: 'none', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 9999, transition: 'transform 0.2s',
        }}
      >
        {open ? <X size={22} /> : <MessageSquare size={22} />}
      </button>

      {open && (
        <div className="chat-widget-panel" style={{
          position: 'fixed', bottom: 88, right: 20, width: 380, maxHeight: 520,
          background: 'var(--color-bg, #fff)', border: '1px solid var(--color-border, #e5e7eb)',
          borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: 9999,
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid var(--color-border, #e5e7eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--color-primary, #008C3A)', color: '#fff',
          }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Support Chat</span>
            <button onClick={() => setShowNew(!showNew)} style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
              borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer',
            }}>{showNew ? 'Cancel' : '+ New'}</button>
          </div>

          {/* New conversation form */}
          {showNew && (
            <div style={{ padding: 12, borderBottom: '1px solid var(--color-border, #e5e7eb)' }}>
              <input
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Subject (optional)"
                style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--color-border, #d1d5db)', borderRadius: 8, fontSize: 13, marginBottom: 8, outline: 'none', boxSizing: 'border-box' }}
              />
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Describe your issue..."
                rows={3}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--color-border, #d1d5db)', borderRadius: 8, fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box' }}
              />
              {/* Image previews for new conversation */}
              {imagePreviews.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                  {imagePreviews.map((src, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={src} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--color-border)' }} />
                      <button onClick={() => removeImage(i)} style={{
                        position: 'absolute', top: -4, right: -4, width: 18, height: 18,
                        borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none',
                        fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>X</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                <button onClick={() => fileInputRef.current?.click()} style={{
                  background: 'none', border: '1px solid var(--color-border, #d1d5db)', borderRadius: 8,
                  padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 12, color: 'var(--color-text-secondary, #6b7280)',
                }}>
                  <Paperclip size={14} /> Attach
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleImageSelect} />
                <div style={{ flex: 1 }} />
                <button onClick={handleNewConversation} disabled={sending || (!newMessage.trim() && selectedImages.length === 0)} style={{
                  background: 'var(--color-primary, #008C3A)', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer', opacity: sending ? 0.5 : 1,
                }}>{sending ? 'Sending...' : 'Send'}</button>
              </div>
            </div>
          )}

          {/* Conversation list or messages */}
          {!activeConvo && !showNew && (
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: 380 }}>
              {loading ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-text-muted, #9ca3af)', fontSize: 13 }}>Loading...</div>
              ) : conversations.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-text-muted, #9ca3af)', fontSize: 13 }}>No conversations yet</div>
              ) : (
                conversations.map(c => (
                  <div key={c._id} onClick={() => setActiveConvo(c)} style={{
                    padding: '12px 16px', borderBottom: '1px solid var(--color-border-light, #f3f4f6)',
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-hover, #f9fafb)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 2, color: 'var(--color-text)' }}>{c.subject}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted, #9ca3af)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{c.lastMessage?.substring(0, 40)}{c.lastMessage?.length > 40 ? '...' : ''}</span>
                      <span style={{ flexShrink: 0, marginLeft: 8 }}>{c.status === 'CLOSED' ? 'Closed' : ''}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Active conversation messages */}
          {activeConvo && (
            <>
              {/* Back + subject header */}
              <div style={{
                padding: '10px 16px', borderBottom: '1px solid var(--color-border, #e5e7eb)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <button onClick={() => setActiveConvo(null)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted, #9ca3af)', padding: 0,
                }}><ChevronDown size={18} style={{ transform: 'rotate(90deg)' }} /></button>
                <span style={{ fontWeight: 500, fontSize: 13, flex: 1, color: 'var(--color-text)' }}>{activeConvo.subject}</span>
                {activeConvo.status !== 'CLOSED' && (
                  <button onClick={() => handleClose(activeConvo._id)} style={{
                    background: 'none', border: '1px solid var(--color-border, #d1d5db)', borderRadius: 6,
                    padding: '3px 8px', fontSize: 11, cursor: 'pointer', color: 'var(--color-text-secondary, #6b7280)',
                  }}>Close</button>
                )}
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', maxHeight: 320, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {loading ? (
                  <div style={{ textAlign: 'center', color: 'var(--color-text-muted, #9ca3af)', fontSize: 13, padding: 20 }}>Loading messages...</div>
                ) : (
                  messages.map((m) => (
                    <div key={m._id} style={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: m.senderRole === 'USER' ? 'flex-end' : 'flex-start',
                    }}>
                      <div style={{
                        maxWidth: '80%', padding: '8px 12px', borderRadius: 12,
                        background: m.senderRole === 'USER' ? 'var(--color-primary, #008C3A)' : 'var(--color-surface-hover, #f3f4f6)',
                        color: m.senderRole === 'USER' ? '#fff' : 'var(--color-text)',
                        fontSize: 13, wordBreak: 'break-word',
                      }}>
                        {m.message && <span>{m.message}</span>}
                        {m.images && m.images.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: m.message ? 6 : 0 }}>
                            {m.images.map((img, i) => (
                              <a key={i} href={img.url} target="_blank" rel="noopener noreferrer">
                                <img src={img.url} alt="attachment" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--color-text-faint, #9ca3af)', marginTop: 2, padding: '0 4px' }}>
                        {m.sender?.name || (m.senderRole === 'ADMIN' ? 'Admin' : 'You')} · {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
                <div ref={messagesEnd} />
              </div>

              {/* Image previews above input */}
              {imagePreviews.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '4px 16px', borderTop: '1px solid var(--color-border-light, #f3f4f6)' }}>
                  {imagePreviews.map((src, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={src} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--color-border)' }} />
                      <button onClick={() => removeImage(i)} style={{
                        position: 'absolute', top: -4, right: -4, width: 16, height: 16,
                        borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none',
                        fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>X</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input */}
              <div style={{
                padding: '12px 16px', borderTop: '1px solid var(--color-border, #e5e7eb)',
                display: 'flex', gap: 8, alignItems: 'flex-end',
              }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: 40, height: 40, borderRadius: 8, border: '1px solid var(--color-border, #d1d5db)',
                    background: 'var(--color-surface, #fff)', color: 'var(--color-text-muted, #6b7280)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}
                  title="Attach image"
                >
                  <Paperclip size={16} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleImageSelect} />
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
                  disabled={sending || (!input.trim() && selectedImages.length === 0)}
                  style={{
                    width: 40, height: 40, borderRadius: 8, border: 'none',
                    background: 'var(--color-primary, #008C3A)', color: '#fff',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: sending || (!input.trim() && selectedImages.length === 0) ? 0.5 : 1,
                  }}
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
