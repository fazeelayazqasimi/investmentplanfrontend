import { useState, useCallback } from 'react';
import { ToastContainer } from './Toast';

let toastId = 0;

export default function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((title, message) => addToast({ type: 'success', title, message }), [addToast]);
  const error = useCallback((title, message) => addToast({ type: 'error', title, message }), [addToast]);
  const warning = useCallback((title, message) => addToast({ type: 'warning', title, message }), [addToast]);
  const info = useCallback((title, message) => addToast({ type: 'info', title, message }), [addToast]);

  return { toasts, addToast, removeToast, success, error, warning, info, ToastContainer: () => <ToastContainer toasts={toasts} onDismiss={removeToast} /> };
}
