import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { taskAPI } from '../api'
import useToastStore from '../store/toastStore'

const EMPTY = { title: '', description: '', assignee: '', status: 'todo', priority: 'medium', estimated_time: '', sprint: '', real_time: '' }

export default function TaskModal({ task, projectId, members, sprints, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const toast = useToastStore()
  const isEdit = !!task

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        assignee: task.assignee || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        estimated_time: task.estimated_time || '',
        sprint: task.sprint || '',
        real_time: task.real_time || '',
      })
    } else {
      setForm(EMPTY)
    }
  }, [task])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.title.trim()) return toast.error('Le titre est obligatoire')
    setLoading(true)
    try {
      // ✅ Convertir les chaînes vides en null pour les champs FK
      const payload = {
        ...form,
        assignee: form.assignee !== '' ? parseInt(form.assignee) : null,
        sprint: form.sprint !== '' ? parseInt(form.sprint) : null,
        estimated_time: form.estimated_time !== '' ? parseFloat(form.estimated_time) : null,
        real_time: form.real_time !== '' ? parseFloat(form.real_time) : null,
      }
      if (isEdit) {
        await taskAPI.update(task.id, payload)
        toast.success('✅ Tâche mise à jour !')
      } else {
        await taskAPI.create(projectId, payload)
        toast.success('✅ Tâche créée !')
      }
      onSaved()
   } catch (err) {
  const errors = err.response?.data || {}
  console.log('ERREUR COMPLETE:', JSON.stringify(errors))
  const msg = typeof errors === 'string'
    ? errors
    : Object.entries(errors).map(([k, v]) => `${k}: ${v}`).join(' | ') || 'Une erreur est survenue'
  toast.error(msg)
}finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? '✏️ Modifier la tâche' : '➕ Nouvelle tâche'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Titre *</label>
            <input className="input" placeholder="Ex: Créer la page de connexion" value={form.title} onChange={e => set('title', e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="input" placeholder="Décris les détails de cette tâche..." value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Statut</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="todo">📋 To Do</option>
                <option value="in_progress">⚡ In Progress</option>
                <option value="done">✅ Done</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priorité</label>
              <select className="input" value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="low">🟢 Faible</option>
                <option value="medium">🟡 Moyenne</option>
                <option value="high">🔴 Haute</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Assigné à</label>
              <select className="input" value={form.assignee} onChange={e => set('assignee', e.target.value)}>
                <option value="">Non assigné</option>
                {members?.map(m => (
                  <option key={m.id} value={m.id}>{m.first_name || m.username} {m.last_name || ''}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Sprint</label>
              <select className="input" value={form.sprint} onChange={e => set('sprint', e.target.value)}>
                <option value="">📌 Backlog</option>
                {sprints?.map(sp => (<option key={sp.id} value={sp.id}>⚡ {sp.name}</option>))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Temps estimé (h)</label>
              <input type="number" className="input" placeholder="Ex: 3" value={form.estimated_time} onChange={e => set('estimated_time', e.target.value)} min="0" step="0.5" />
            </div>
            <div className="form-group">
              <label className="form-label">Temps réel (h)</label>
              <input type="number" className="input" placeholder="Ex: 4" value={form.real_time} onChange={e => set('real_time', e.target.value)} min="0" step="0.5" />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={onClose}>Annuler</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading && <span className="spinner" style={{ width: 14, height: 14 }} />}
              {isEdit ? 'Enregistrer' : 'Créer la tâche'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
