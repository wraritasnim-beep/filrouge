import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Plus, LayoutGrid, List, Zap, MessageSquare, ArrowLeft, Eye } from 'lucide-react'
import { projectAPI, taskAPI, sprintAPI, messageAPI } from '../api'
import useAuthStore from '../store/authStore'
import useToastStore from '../store/toastStore'
import Layout from '../components/Layout'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'
import s from './ProjectDetail.module.css'

const COLS = ['todo', 'in_progress', 'done']
const COL_LABEL = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' }
const COL_COLOR = { todo: 'var(--todo-color)', in_progress: 'var(--progress-color)', done: 'var(--done-color)' }
const COL_EMOJI = { todo: '📋', in_progress: '⚡', done: '✅' }

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isTeacher, isStudent } = useAuthStore()
  const toast = useToastStore()
  const canEdit = isStudent() // ✅ Seul l'étudiant peut modifier

  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [sprints, setSprints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('board')
  const [taskModal, setTaskModal] = useState(null)

  useEffect(() => { loadAll() }, [id])

  const loadAll = async () => {
    setLoading(true); setError(null)
    try {
      const [pR, tR, sR] = await Promise.all([projectAPI.get(id), taskAPI.list(id), sprintAPI.list(id)])
      setProject(pR.data); setTasks(tR.data); setSprints(sR.data)
    } catch { setError(true) }
    finally { setLoading(false) }
  }

  const handleDragEnd = async ({ destination, source, draggableId }) => {
    if (!destination || !canEdit) return
    const newStatus = destination.droppableId
    if (newStatus === source.droppableId && destination.index === source.index) return
    setTasks(prev => prev.map(t => t.id === parseInt(draggableId) ? { ...t, status: newStatus } : t))
    try {
      await taskAPI.updateStatus(draggableId, newStatus, destination.index)
      toast.success(`Tâche déplacée vers ${COL_LABEL[newStatus]} ✓`)
    } catch { toast.error('Erreur'); loadAll() }
  }

  const handleDelete = async (taskId) => {
    if (!window.confirm('Supprimer cette tâche ?')) return
    await taskAPI.delete(taskId)
    setTasks(p => p.filter(t => t.id !== taskId))
    toast.success('Tâche supprimée')
  }

  if (loading) return <Layout><div className="page-loading"><div className="spinner" /></div></Layout>

  if (error) return (
    <Layout>
      <div className={s.errorPage}>
        <div className={s.errorIcon}>🔒</div>
        <h2>Accès refusé</h2>
        <p>Tu n'as pas accès à ce projet ou il n'existe pas.</p>
        <button className="btn btn-primary" onClick={() => navigate('/projects')}><ArrowLeft size={15} /> Retour aux projets</button>
      </div>
    </Layout>
  )

  const members = project?.members_detail || []
  const tabs = [
    { key: 'board', label: 'Board', icon: LayoutGrid },
    { key: 'list',  label: 'Liste', icon: List },
    { key: 'sprints', label: 'Sprints', icon: Zap },
    // Chat visible uniquement aux étudiants
    ...(isStudent() ? [{ key: 'chat', label: 'Chat Équipe', icon: MessageSquare }] : []),
  ]

  return (
    <Layout>
      <div className={s.page}>
        {/* Header */}
        <div className={s.header}>
          <div className={s.headerLeft}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}><ArrowLeft size={15} /> Retour</button>
            <div className={s.projectBadge}>{project.name[0].toUpperCase()}</div>
            <div>
              <h1 className={s.title}>{project.name}</h1>
              <div className={s.meta}>
                {project.deadline && <span>📅 {new Date(project.deadline).toLocaleDateString('fr-FR')}</span>}
                <span>👥 {members.length} membres</span>
                <span className={s.progress}>{project.progress}% terminé</span>
                {isTeacher() && <span className={s.viewOnlyBadge}><Eye size={11} /> Lecture seule</span>}
              </div>
            </div>
          </div>
          {/* ✅ Bouton UNIQUEMENT pour les étudiants */}
          {canEdit && (
            <button className="btn btn-primary" onClick={() => setTaskModal('new')}>
              <Plus size={16} /> Nouvelle tâche
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className={s.progressBar}>
          <div className="progress-bar" style={{ height: 3 }}>
            <div className={`progress-fill ${project.progress === 100 ? 'done' : ''}`} style={{ width: `${project.progress}%` }} />
          </div>
        </div>

        {/* Tabs */}
        <div className={s.tabs}>
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} className={`${s.tab} ${tab === key ? s.tabActive : ''}`} onClick={() => setTab(key)}>
              <Icon size={14} /> {label}
              {key === 'board' && <span className={s.tabCount}>{tasks.length}</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={s.content}>
          {tab === 'board'   && <BoardView   tasks={tasks} onDragEnd={handleDragEnd} onTaskClick={setTaskModal} onDelete={handleDelete} canEdit={canEdit} />}
          {tab === 'list'    && <ListView    tasks={tasks} onTaskClick={setTaskModal} onDelete={handleDelete} canEdit={canEdit} />}
          {tab === 'sprints' && <SprintsView projectId={id} sprints={sprints} tasks={tasks} onRefresh={loadAll} canEdit={canEdit} />}
          {tab === 'chat'    && <ChatView    projectId={id} user={user} members={members} />}
        </div>
      </div>

      {canEdit && taskModal && (
        <TaskModal
          task={taskModal === 'new' ? null : taskModal}
          projectId={parseInt(id)}
          members={members}
          sprints={sprints}
          onClose={() => setTaskModal(null)}
          onSaved={() => { setTaskModal(null); loadAll() }}
        />
      )}
    </Layout>
  )
}

/* ═══════════════ BOARD ═══════════════ */
function BoardView({ tasks, onDragEnd, onTaskClick, onDelete, canEdit }) {
  const grouped = COLS.reduce((acc, c) => { acc[c] = tasks.filter(t => t.status === c); return acc }, {})
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className={s.board}>
        {COLS.map(col => (
          <div key={col} className={s.column}>
            <div className={s.colHeader}>
              <div className={s.colDot} style={{ background: COL_COLOR[col] }} />
              <span className={s.colTitle}>{COL_LABEL[col]}</span>
              <span className={s.colCount}>{grouped[col].length}</span>
            </div>
            <Droppable droppableId={col} isDropDisabled={!canEdit}>
              {(provided, snapshot) => (
                <div ref={provided.innerRef} {...provided.droppableProps}
                  className={`${s.colBody} ${snapshot.isDraggingOver ? s.dragOver : ''}`}>
                  {grouped[col].map((task, i) => (
                    <Draggable key={task.id} draggableId={String(task.id)} index={i} isDragDisabled={!canEdit}>
                      {(p) => <TaskCard task={task} provided={p} onClick={onTaskClick} onDelete={onDelete} canEdit={canEdit} />}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {grouped[col].length === 0 && (
                    <div className={s.emptyCol}>
                      <span style={{ fontSize: 28 }}>{COL_EMOJI[col]}</span>
                      <span>{canEdit ? 'Glisse une tâche ici' : 'Aucune tâche'}</span>
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  )
}

/* ═══════════════ LIST ═══════════════ */
function ListView({ tasks, onTaskClick, onDelete, canEdit }) {
  if (!tasks.length) return (
    <div className="empty-state" style={{ marginTop: 60 }}>
      <div style={{ fontSize: 48 }}>📋</div>
      <h3>Aucune tâche</h3>
      <p>{canEdit ? 'Crée ta première tâche avec le bouton en haut' : 'Aucune tâche dans ce projet'}</p>
    </div>
  )
  return (
    <div className={s.listView}>
      <div className={s.listHead}>
        <span>Tâche</span><span>Statut</span><span>Priorité</span><span>Assigné à</span><span>Temps est.</span>{canEdit && <span></span>}
      </div>
      {tasks.map(t => (
        <div key={t.id} className={s.listRow} onClick={() => canEdit && onTaskClick(t)} style={{ cursor: canEdit ? 'pointer' : 'default' }}>
          <div>
            <div className={s.listTitle}>{t.title}</div>
            {t.description && <div className={s.listDesc}>{t.description.slice(0, 60)}{t.description.length > 60 ? '…' : ''}</div>}
          </div>
          <span><span className={`badge badge-${t.status}`}>{t.status === 'todo' ? 'To Do' : t.status === 'in_progress' ? 'En cours' : 'Terminé'}</span></span>
          <span><span className={`badge badge-${t.priority}`}>{t.priority === 'high' ? '🔴 Haute' : t.priority === 'medium' ? '🟡 Moy.' : '🟢 Faible'}</span></span>
          <span>
            {t.assignee_detail
              ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div className="avatar avatar-sm">{t.assignee_detail.initials || t.assignee_detail.username?.[0]?.toUpperCase()}</div><span style={{ fontSize: 12 }}>{t.assignee_detail.first_name || t.assignee_detail.username}</span></div>
              : <span style={{ color: 'var(--text3)', fontSize: 12 }}>Non assigné</span>}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'monospace' }}>{t.estimated_time ? `${t.estimated_time}h` : '—'}</span>
          {canEdit && <span onClick={e => { e.stopPropagation(); onDelete(t.id) }} style={{ cursor: 'pointer', color: 'var(--text3)', fontSize: 20 }} title="Supprimer">×</span>}
        </div>
      ))}
    </div>
  )
}

/* ═══════════════ SPRINTS ═══════════════ */
function SprintsView({ projectId, sprints, tasks, onRefresh, canEdit }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', start_date: '', end_date: '', goal: '' })
  const toast = useToastStore()
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const create = async () => {
    if (!form.name || !form.start_date || !form.end_date) return toast.error('Nom et dates obligatoires')
    try {
      await sprintAPI.create(projectId, form)
      toast.success('✅ Sprint créé !')
      setShowForm(false); setForm({ name: '', start_date: '', end_date: '', goal: '' })
      onRefresh()
    } catch { toast.error('Erreur') }
  }

  const backlog = tasks.filter(t => !t.sprint)

  return (
    <div className={s.sprintsView}>
      <div className={s.sprintTop}>
        <h3>Sprints du projet</h3>
        {canEdit && <button className="btn btn-primary btn-sm" onClick={() => setShowForm(v => !v)}><Plus size={14} /> Nouveau sprint</button>}
      </div>

      {canEdit && showForm && (
        <div className={s.sprintForm}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Nom *</label><input className="input" placeholder="Sprint 1" value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Objectif</label><input className="input" placeholder="Ex: Authentification" value={form.goal} onChange={e => set('goal', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Début *</label><input className="input" type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Fin *</label><input className="input" type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} /></div>
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>Annuler</button>
            <button className="btn btn-primary btn-sm" onClick={create}>Créer le sprint</button>
          </div>
        </div>
      )}

      {sprints.length === 0 && !showForm && (
        <div className="empty-state"><div style={{ fontSize: 40 }}>⚡</div><h3>Aucun sprint</h3><p>{canEdit ? 'Crée ton premier sprint pour organiser les tâches' : 'Aucun sprint créé'}</p></div>
      )}

      {sprints.map(sprint => {
        const st = tasks.filter(t => t.sprint === sprint.id)
        const done = st.filter(t => t.status === 'done').length
        const pct = st.length ? Math.round((done / st.length) * 100) : 0
        return (
          <div key={sprint.id} className={s.sprintCard}>
            <div className={s.sprintCardTop}>
              <div>
                <div className={s.sprintName}>{sprint.name}{sprint.is_active && <span className={s.activeBadge}>● Actif</span>}</div>
                <div className={s.sprintDates}>📅 {sprint.start_date} → {sprint.end_date}{sprint.goal && <> &middot; 🎯 {sprint.goal}</>}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: pct === 100 ? 'var(--done-color)' : 'var(--text)' }}>{pct}%</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{done}/{st.length} tâches</div>
              </div>
            </div>
            {st.length > 0 && <div className="progress-bar" style={{ marginTop: 10 }}><div className={`progress-fill ${pct === 100 ? 'done' : ''}`} style={{ width: `${pct}%` }} /></div>}
            {st.length > 0 && (
              <div className={s.sprintTasks}>
                {st.map(t => (
                  <div key={t.id} className={s.sprintTask}>
                    <span className={`badge badge-${t.status}`}>{t.status === 'todo' ? 'To Do' : t.status === 'in_progress' ? 'En cours' : 'Terminé'}</span>
                    <span style={{ flex: 1, fontSize: 13 }}>{t.title}</span>
                    {t.assignee_detail && <div className="avatar avatar-sm">{t.assignee_detail.initials}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Backlog */}
      <div className={`${s.sprintCard} ${s.backlogCard}`}>
        <div className={s.sprintCardTop}>
          <div className={s.sprintName}>📌 Backlog</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>{backlog.length} tâche{backlog.length !== 1 ? 's' : ''}</div>
        </div>
        {backlog.length > 0 ? (
          <div className={s.sprintTasks}>
            {backlog.map(t => (
              <div key={t.id} className={s.sprintTask}>
                <span className={`badge badge-${t.status}`}>{t.status === 'todo' ? 'To Do' : t.status === 'in_progress' ? 'En cours' : 'Terminé'}</span>
                <span style={{ flex: 1, fontSize: 13 }}>{t.title}</span>
              </div>
            ))}
          </div>
        ) : <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 10 }}>✅ Toutes les tâches sont dans un sprint</p>}
      </div>
    </div>
  )
}

/* ═══════════════ CHAT (étudiants seulement) ═══════════════ */
function ChatView({ projectId, user, members }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const toast = useToastStore()

  useEffect(() => {
    messageAPI.list(projectId).then(r => {
      setMessages(r.data); setLoading(false)
      setTimeout(() => document.getElementById('chat-end')?.scrollIntoView(), 80)
    })
  }, [projectId])

 const send = async () => {
  if (!text.trim()) return
  try {
    const r = await messageAPI.create(projectId, text.trim())
    setMessages(m => [...m, r.data])
    setText('')
    setTimeout(() => document.getElementById('chat-end')?.scrollIntoView({ behavior: 'smooth' }), 40)
  } catch (err) {
    const errMsg = JSON.stringify(err.response?.data || 'erreur inconnue')
    toast.error('Erreur: ' + errMsg)
  }
}

  return (
    <div className={s.chat}>
      <div className={s.chatSidebar}>
        <div className={s.chatSidebarTitle}>Membres ({members.length})</div>
        {members.map(m => (
          <div key={m.id} className={s.chatMember}>
            <div className="avatar avatar-sm">{m.initials || m.username?.[0]?.toUpperCase()}</div>
            <span>{m.first_name || m.username}</span>
          </div>
        ))}
      </div>
      <div className={s.chatMain}>
        <div className={s.chatMessages}>
          {loading && <div className="page-loading"><div className="spinner" /></div>}
          {!loading && messages.length === 0 && (
            <div className="empty-state"><div style={{ fontSize: 40 }}>💬</div><h3>Aucun message</h3><p>Lancez la conversation avec votre équipe !</p></div>
          )}
          {messages.map(msg => {
            const isMe = msg.author === user?.id
            return (
              <div key={msg.id} className={`${s.msg} ${isMe ? s.msgMe : s.msgOther}`}>
                {!isMe && <div className="avatar avatar-sm">{msg.author_detail?.initials || msg.author_detail?.username?.[0]?.toUpperCase()}</div>}
                <div className={s.msgBubble}>
                  {!isMe && <div className={s.msgAuthor}>{msg.author_detail?.first_name || msg.author_detail?.username}</div>}
                  <div className={s.msgContent}>{msg.content}</div>
                  <div className={s.msgTime}>{new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            )
          })}
          <div id="chat-end" />
        </div>
        <div className={s.chatInput}>
          <input
            className="input"
            placeholder="Écrire un message... (Entrée pour envoyer)"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            autoFocus
          />
          <button className="btn btn-primary" onClick={send} disabled={!text.trim()}>Envoyer</button>
        </div>
      </div>
    </div>
  )
}
