import { useState, useEffect } from 'react'
import { taskAPI } from '../api'
import Layout from '../components/Layout'
import s from './MyTasks.module.css'

const LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' }

export default function MyTasks() {
  const [tasks, setTasks] = useState({ todo: [], in_progress: [], done: [] })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => { taskAPI.myTasks().then(r => { setTasks(r.data); setLoading(false) }) }, [])

  const all = [...tasks.todo, ...tasks.in_progress, ...tasks.done]
  const shown = filter === 'all' ? all : tasks[filter] || []

  return (
    <Layout>
      <div className={s.page}>
        <div className={s.header}>
          <div>
            <h1 className={s.title}>Mes tâches</h1>
            <p className={s.sub}>{all.length} tâche{all.length !== 1 ? 's' : ''} assignée{all.length !== 1 ? 's' : ''}</p>
          </div>
          <div className={s.filters}>
            {[
              { key: 'all', label: 'Toutes', count: all.length },
              { key: 'todo', label: 'To Do', count: tasks.todo.length },
              { key: 'in_progress', label: 'En cours', count: tasks.in_progress.length },
              { key: 'done', label: 'Terminées', count: tasks.done.length },
            ].map(f => (
              <button key={f.key} className={`${s.filterBtn} ${filter === f.key ? s.filterActive : ''}`} onClick={() => setFilter(f.key)}>
                {f.label} <span className={s.filterCount}>{f.count}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="page-loading"><div className="spinner" /></div>
        ) : shown.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 48 }}>✅</div>
            <h3>Aucune tâche</h3>
            <p>Vous n'avez aucune tâche dans cette catégorie</p>
          </div>
        ) : (
          <div className={s.list}>
            {shown.map(t => (
              <div key={t.id} className={s.taskCard}>
                <div className={s.taskLeft}>
                  <div className={`${s.statusDot} ${s['dot_' + t.status]}`} />
                  <div>
                    <div className={s.taskTitle}>{t.title}</div>
                    {t.description && <div className={s.taskDesc}>{t.description.slice(0, 100)}{t.description.length > 100 ? '…' : ''}</div>}
                  </div>
                </div>
                <div className={s.taskRight}>
                  {t.sprint_name && <span className={s.sprintTag}>⚡ {t.sprint_name}</span>}
                  <span className={`badge badge-${t.status}`}>{LABELS[t.status]}</span>
                  <span className={`badge badge-${t.priority}`}>{t.priority === 'high' ? '🔴 Haute' : t.priority === 'medium' ? '🟡 Moy.' : '🟢 Faible'}</span>
                  {t.estimated_time && <span className={s.time}>⏱ {t.estimated_time}h</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
