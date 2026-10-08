import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../api'
import useAuthStore from '../store/authStore'
import Layout from '../components/Layout'

export default function Students() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const { isTeacher } = useAuthStore()

  useEffect(() => {
    if (!isTeacher()) { navigate('/dashboard'); return }
    authAPI.users().then(r => {
      setStudents(r.data.filter(u => u.role === 'student'))
      setLoading(false)
    })
  }, [])

  const filtered = students.filter(s =>
    `${s.first_name} ${s.last_name} ${s.username} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <Layout><div className="page-loading"><div className="spinner" /></div></Layout>

  return (
    <Layout>
      <div style={{ padding: '32px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Etudiants</h1>
          <p style={{ color: 'var(--text3)', fontSize: 14 }}>{students.length} etudiant(s) inscrits</p>
        </div>

        <input
          className="input"
          placeholder="Rechercher un etudiant..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 24 }}
        />

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 48 }}>👥</div>
            <h3>Aucun etudiant</h3>
            <p>{search ? `Aucun resultat pour "${search}"` : 'Aucun etudiant inscrit'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(s => (
              <div key={s.id} style={{ background: 'var(--surface1)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div className="avatar" style={{ width: 48, height: 48, fontSize: 18, flexShrink: 0 }}>
                  {s.initials || s.username?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                    {s.first_name || s.username} {s.last_name || ''}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                    @{s.username} {s.email && `• ${s.email}`}
                  </div>
                </div>
                <span style={{ fontSize: 12, background: 'var(--surface2)', color: 'var(--primary-light)', padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>
                  Etudiant
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
