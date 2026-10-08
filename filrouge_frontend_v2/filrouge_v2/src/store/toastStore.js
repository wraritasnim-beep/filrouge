import { create } from 'zustand'

const useToastStore = create((set, get) => ({
  toasts: [],
  show: (message, type = 'default') => {
    const id = Date.now()
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 3500)
  },
  success: (msg) => get().show(msg, 'success'),
  error: (msg) => get().show(msg, 'error'),
}))

export default useToastStore
