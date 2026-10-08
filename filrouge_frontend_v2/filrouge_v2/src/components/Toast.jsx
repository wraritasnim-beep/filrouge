import useToastStore from '../store/toastStore'
import { CheckCircle2, XCircle, Bell } from 'lucide-react'

export default function Toast() {
  const { toasts } = useToastStore()
  const icons = { success: <CheckCircle2 size={16} color="#10b981" />, error: <XCircle size={16} color="#ef4444" />, default: <Bell size={16} color="#a78bfa" /> }
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          {icons[t.type] || icons.default}
          {t.message}
        </div>
      ))}
    </div>
  )
}
