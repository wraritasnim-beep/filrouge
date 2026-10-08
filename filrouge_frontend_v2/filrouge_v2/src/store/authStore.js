import { create } from 'zustand'
import { authAPI } from '../api'

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('access_token') || null,
  loading: false,
  error: null,

  login: async (username, password) => {
    set({ loading: true, error: null })
    try {
      const res = await authAPI.login({ username, password })
      const { user, access, refresh } = res.data
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      localStorage.setItem('user', JSON.stringify(user))
      set({ user, token: access, loading: false })
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.non_field_errors?.[0] || 'Identifiants incorrects'
      set({ error: msg, loading: false })
      return { success: false, error: msg }
    }
  },

  register: async (data) => {
    set({ loading: true, error: null })
    try {
      const res = await authAPI.register(data)
      const { user, access, refresh } = res.data
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      localStorage.setItem('user', JSON.stringify(user))
      set({ user, token: access, loading: false })
      return { success: true }
    } catch (err) {
      const errors = err.response?.data || {}
      // Extraire le premier message d'erreur de n'importe quel champ
      let msg = "Erreur lors de l'inscription"
      if (typeof errors === 'string') {
        msg = errors
      } else {
        const allMessages = Object.entries(errors).map(([field, msgs]) => {
          const fieldName = {
            username: "Nom d'utilisateur",
            email: 'Email',
            password: 'Mot de passe',
            password2: 'Confirmation',
            first_name: 'Prénom',
            last_name: 'Nom',
            role: 'Rôle',
          }[field] || field
          const msgText = Array.isArray(msgs) ? msgs[0] : msgs
          return `${fieldName} : ${msgText}`
        })
        if (allMessages.length > 0) msg = allMessages[0]
      }
      set({ error: msg, loading: false })
      return { success: false, error: msg }
    }
  },

  logout: () => {
    localStorage.clear()
    set({ user: null, token: null })
  },

  isTeacher: () => get().user?.role === 'teacher',
  isStudent: () => get().user?.role === 'student',
}))

export default useAuthStore
