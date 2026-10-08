import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, CheckCircle2, Clock, AlertTriangle, TrendingUp, Plus, ArrowRight } from 'lucide-react'
import { projectAPI, taskAPI } from '../api'
import useAuthStore from '../store/authStore'
import Layout from '../components/Layout'
import s from './Dashboard.module.css'

export default function Dashboard() {
  const { user, isTeacher } = useAuthStore()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [myTasks, setMyTasks] = useState({ todo: [], in_progress: [], done: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      if (isTeacher()) {
        const res = await projectAPI.teacherDashboard()
        setProjects(res.data)
      } else {
        const [pRes, tRes] = await Promise.all([projectAPI.list(), taskAPI.myTasks()])
        setProjects(pRes.data)
        setMyTasks(tRes.data)
      }
    } finally { setLoading(false) }
  }

  if (loading) return <Layout><div className="page-loading"><div className="spinner" /></div></Layout>

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <Layout>
      <div className={s.page}>
        {/* Hero Header */}
        <div className={s.hero}>
          <div className={s.heroGlow} />
          <div className={s.heroContent}>
            <h1 className={s.heroTitle}>{greeting}, <span className={s.heroName}>{user?.first_name || user?.username}</span> 👋</h1>
            <p className={s.heroSub}>{isTeacher() ? `Vous supervisez ${projects.length} projet${projects.length !== 1 ? 's' : ''}` : 'Voici l\'état de vos projets et tâches'}</p>
          </div>
          {!isTeacher() && (
            <button className="btn btn-primary" onClick={() => navigate('/projects')}>
              <Plus size={16} /> Nouveau projet
            </button>
          )}
        </div>

        {/* Stats */}
        <div className={s.stats}>
          {isTeacher() ? <TeacherStats projects={projects} /> : <StudentStats projects={projects} tasks={myTasks} />}
        </div>

        {/* Projects */}
        <div className={s.section}>
          <div className={s.sectionHead}>
            <h2 className={s.sectionTitle}>{isTeacher() ? 'Tous les projets' : 'Mes projets'}</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>
              Voir tout <ArrowRight size={14} />
            </button>
          </div>
          <div className={s.projectGrid}>
            {projects.slice(0, 4).map(p => (
              <ProjectCard key={p.id} project={p} isTeacher={isTeacher()} onClick={() => navigate(`/projects/${p.id}`)} />
            ))}
            {projects.length === 0 && (
              <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                <div style={{ fontSize: 48 }}>📂</div>
                <h3>Aucun projet</h3>
                <p>Commencez par créer votre premier projet</p>
                {!isTeacher() && <button className="btn btn-primary" onClick={() => navigate('/projects')}><Plus size={15} /> Créer un projet</button>}
              </div>
            )}
          </div>
        </div>

        {/* My tasks (student) */}
        {!isTeacher() && (
          <div className={s.section}>
            <div className={s.sectionHead}>
              <h2 className={s.sectionTitle}>Mes tâches récentes</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/my-tasks')}>Voir tout <ArrowRight size={14} /></button>
            </div>
            <div className={s.taskList}>
              {[...myTasks.in_progress, ...myTasks.todo].slice(0, 5).map(t => (
                <div key={t.id} className={s.taskRow}>
                  <span className={`badge badge-${t.status}`}>{t.status === 'in_progress' ? '⚡ En cours' : '📋 À faire'}</span>
                  <span className={s.taskName}>{t.title}</span>
                  <span className={`badge badge-${t.priority}`}>{t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🟢'}</span>
                </div>
              ))}
              {myTasks.in_progress.length === 0 && myTasks.todo.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text3)', fontSize: 13 }}>
                  ✨ Aucune tâche assignée pour le moment
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

function StudentStats({ projects, tasks }) {
  return (
    <div className={s.statGrid}>
      {[
        { icon: FolderKanban, label: 'Projets', value: projects.length, color: '#7c3aed', glow: 'rgba(124,58,237,0.2)' },
        { icon: Clock, label: 'En cours', value: tasks.in_progress.length, color: '#f59e0b', glow: 'rgba(245,158,11,0.2)' },
        { icon: CheckCircle2, label: 'Terminées', value: tasks.done.length, color: '#10b981', glow: 'rgba(16,185,129,0.2)' },
        { icon: AlertTriangle, label: 'À faire', value: tasks.todo.length, color: '#64748b', glow: 'rgba(100,116,139,0.15)' },
      ].map(({ icon: Icon, label, value, color, glow }) => (
        <div key={label} className={s.statCard}>
          <div className={s.statIcon} style={{ background: glow, color }}><Icon size={22} /></div>
          <div className={s.statVal}>{value}</div>
          <div className={s.statLabel}>{label}</div>
        </div>
      ))}
    </div>
  )
}

function TeacherStats({ projects }) {
  const total = projects.reduce((a, p) => a + (p.tasks?.total || 0), 0)
  const done = projects.reduce((a, p) => a + (p.tasks?.done || 0), 0)
  const overdue = projects.filter(p => p.is_overdue).length
  const avg = projects.length ? Math.round(projects.reduce((a, p) => a + p.progress, 0) / projects.length) : 0
  return (
    <div className={s.statGrid}>
      {[
        { icon: FolderKanban, label: 'Projets', value: projects.length, color: '#7c3aed', glow: 'rgba(124,58,237,0.2)' },
        { icon: TrendingUp, label: 'Progression moy.', value: `${avg}%`, color: '#10b981', glow: 'rgba(16,185,129,0.2)' },
        { icon: CheckCircle2, label: 'Tâches terminées', value: done, color: '#06b6d4', glow: 'rgba(6,182,212,0.2)' },
        { icon: AlertTriangle, label: 'En retard', value: overdue, color: '#ef4444', glow: 'rgba(239,68,68,0.2)' },
      ].map(({ icon: Icon, label, value, color, glow }) => (
        <div key={label} className={s.statCard}>
          <div className={s.statIcon} style={{ background: glow, color }}><Icon size={22} /></div>
          <div className={s.statVal}>{value}</div>
          <div className={s.statLabel}>{label}</div>
        </div>
      ))}
    </div>
  )
}

function ProjectCard({ project, isTeacher, onClick }) {
  const p = project.progress ?? 0
  return (
    <div className={s.projectCard} onClick={onClick}>
      <div className={s.projectTop}>
        <div className={s.projectIcon}>{project.name[0].toUpperCase()}</div>
        <div className={s.projectMeta}>
          <div className={s.projectName}>{project.name}</div>
          {project.deadline && <div className={s.projectDate}>📅 {new Date(project.deadline).toLocaleDateString('fr-FR')}</div>}
        </div>
        {project.is_overdue && <span className="badge badge-high">Retard</span>}
      </div>

      {project.description && (
        <p className={s.projectDesc}>{project.description.length > 80 ? project.description.slice(0, 80) + '…' : project.description}</p>
      )}

      <div className={s.projectProgress}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
          <span style={{ color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progression</span>
          <span style={{ color: p === 100 ? 'var(--done-color)' : 'var(--primary-light)', fontWeight: 700 }}>{p}%</span>
        </div>
        <div className="progress-bar"><div className={`progress-fill ${p === 100 ? 'done' : ''}`} style={{ width: `${p}%` }} /></div>
      </div>

      <div className={s.projectFooter}>
        <div className={s.taskCounts}>
          <span style={{ color: 'var(--done-color)' }}>✓ {project.tasks_done ?? 0}</span>
          <span style={{ color: 'var(--progress-color)' }}>⟳ {project.tasks_in_progress ?? 0}</span>
        </div>
        <div className={s.arrowBtn}><ArrowRight size={14} /></div>
      </div>
    </div>
  )
}
