import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Calendar, Users, ArrowRight, Search } from 'lucide-react'
import { projectAPI, authAPI } from '../api'
import useAuthStore from '../store/authStore'
import useToastStore from '../store/toastStore'
import Layout from '../components/Layout'
import s from './Projects.module.css'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const { isTeacher } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => { loadProjects() }, [])

  const loadProjects = async () => {
    try { const r = await projectAPI.list(); setProjects(r.data) }
    finally { setLoading(false) }
  }

  const filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <Layout>
      <div className={s.page}>
        <div className={s.header}>
          <div>
            <h1 className={s.title}>{isTeacher() ? 'Tous les projets' : 'Mes projets'}</h1>
            <p className={s.sub}>{projects.length} projet{projects.length !== 1 ? 's' : ''} au total</p>
          </div>
          {!isTeacher() && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Nouveau projet
            </button>
          )}
        </div>

        {/* Search */}
        <div className={s.searchWrap}>
          <Search size={15} className={s.searchIcon} />
          <input className={`input ${s.searchInput}`} placeholder="Rechercher un projet..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="page-loading"><div className="spinner" /></div>
        ) : (
          <div className={s.grid}>
            {filtered.map(p => (
              <div key={p.id} className={s.card} onClick={() => navigate(`/projects/${p.id}`)}>
                <div className={s.cardTop}>
                  <div className={s.icon}>{p.name[0].toUpperCase()}</div>
                  <div className={s.info}>
                    <div className={s.name}>{p.name}</div>
                    {p.is_overdue && <span className="badge badge-high">⚠️ En retard</span>}
                  </div>
                  <div className={s.arrow}><ArrowRight size={16} /></div>
                </div>

                {p.description && <p className={s.desc}>{p.description.length > 90 ? p.description.slice(0, 90) + '…' : p.description}</p>}

                <div className={s.meta}>
                  {p.deadline && <span className={s.metaItem}><Calendar size={11} /> {new Date(p.deadline).toLocaleDateString('fr-FR')}</span>}
                  <span className={s.metaItem}><Users size={11} /> {p.members_detail?.length || 0} membres</span>
                </div>

                <div className={s.progressArea}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text3)', fontWeight: 600 }}>PROGRESSION</span>
                    <span style={{ color: p.progress === 100 ? 'var(--done-color)' : 'var(--primary-light)', fontWeight: 700 }}>{p.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className={`progress-fill ${p.progress === 100 ? 'done' : ''}`} style={{ width: `${p.progress}%` }} />
                  </div>
                </div>

                <div className={s.members}>
                  {p.members_detail?.slice(0, 5).map(m => (
                    <div key={m.id} className="avatar avatar-sm" title={m.first_name || m.username}>
                      {m.initials || m.username?.[0]?.toUpperCase()}
                    </div>
                  ))}
                  {(p.members_detail?.length || 0) > 5 && (
                    <div className="avatar avatar-sm" style={{ background: 'var(--surface3)', fontSize: 9 }}>+{p.members_detail.length - 5}</div>
                  )}
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                <div style={{ fontSize: 48 }}>{search ? '🔍' : '📂'}</div>
                <h3>{search ? 'Aucun résultat' : 'Aucun projet'}</h3>
                <p>{search ? `Aucun projet ne correspond à "${search}"` : 'Créez votre premier projet pour commencer'}</p>
                {!isTeacher() && !search && (
                  <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={15} /> Créer un projet</button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && <CreateModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); loadProjects() }} />}
    </Layout>
  )
}

function CreateModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', deadline: '' })
  const [allUsers, setAllUsers] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const toast = useToastStore()
  const { user } = useAuthStore()

  useEffect(() => {
    authAPI.users().then(r => setAllUsers(r.data.filter(u => u.id !== user.id && u.role === 'student')))
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleMember = (u) => setMembers(m => m.find(x => x.id === u.id) ? m.filter(x => x.id !== u.id) : [...m, u])

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error('Le nom est obligatoire')
    setLoading(true)
    try {
      const res = await projectAPI.create(form)
      for (const m of members) await projectAPI.addMember(res.data.id, m.id)
      toast.success('✅ Projet créé !')
      onCreated()
    } catch { toast.error('Erreur lors de la création') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">🚀 Nouveau projet</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Nom du projet *</label>
            <input className="input" placeholder="Ex: Application E-commerce" value={form.name} onChange={e => set('name', e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="input" placeholder="Décrivez l'objectif du projet..." value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Deadline 📅</label>
            <input className="input" type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>La deadline est fixée à la création et ne peut plus être modifiée</span>
          </div>
          <div className="form-group">
            <label className="form-label">Membres de l'équipe</label>
            <div className={s.memberList}>
              {allUsers.length === 0 && <p style={{ fontSize: 13, color: 'var(--text3)', padding: '12px' }}>Aucun autre étudiant disponible</p>}
              {allUsers.map(u => {
                const sel = members.find(m => m.id === u.id)
                return (
                  <div key={u.id} className={`${s.memberItem} ${sel ? s.memberSel : ''}`} onClick={() => toggleMember(u)}>
                    <div className="avatar avatar-sm">{u.initials || u.username?.[0]?.toUpperCase()}</div>
                    <span>{u.first_name} {u.last_name || u.username}</span>
                    {sel && <span style={{ marginLeft: 'auto', color: 'var(--primary-light)', fontWeight: 700, fontSize: 14 }}>✓</span>}
                  </div>
                )
              })}
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={onClose}>Annuler</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading && <span className="spinner" style={{ width: 14, height: 14 }} />}
              Créer le projet
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
