import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, X, Star } from 'lucide-react'
import { projectAPI, evaluationAPI } from '../api'
import useAuthStore from '../store/authStore'
import useToastStore from '../store/toastStore'
import Layout from '../components/Layout'

export default function Evaluations() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalProject, setModalProject] = useState(null) // projet sélectionné pour évaluation
  const navigate = useNavigate()
  const { isTeacher } = useAuthStore()

  useEffect(() => {
    if (!isTeacher()) { navigate('/dashboard'); return }
    projectAPI.list().then(r => { setProjects(r.data); setLoading(false) })
  }, [])

  const handleEvaluated = (projectId, newEvals) => {
    // Met à jour localement les évaluations sans recharger toute la page
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, _evals: newEvals } : p))
    setModalProject(null)
  }

  if (loading) return <Layout><div className="page-loading"><div className="spinner" /></div></Layout>

  return (
    <Layout>
      <div style={{ padding: '32px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Évaluations</h1>
          <p style={{ color: 'var(--text3)', fontSize: 14 }}>{projects.length} projet(s) à évaluer</p>
        </div>

        {projects.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 48 }}>📋</div>
            <h3>Aucun projet</h3>
            <p>Il n'y a pas encore de projets à évaluer</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {projects.map(p => (
              <ProjectEvalCard
                key={p.id}
                project={p}
                navigate={navigate}
                onEvaluate={() => setModalProject(p)}
              />
            ))}
          </div>
        )}
      </div>

      {modalProject && (
        <EvalModal
          project={modalProject}
          onClose={() => setModalProject(null)}
          onSaved={(newEvals) => handleEvaluated(modalProject.id, newEvals)}
        />
      )}
    </Layout>
  )
}

// ─── Carte projet ───────────────────────────────────────────────────────────

function ProjectEvalCard({ project, navigate, onEvaluate }) {
  const [evals, setEvals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    evaluationAPI.list(project.id).then(r => { setEvals(r.data); setLoading(false) })
  }, [project.id])

  const avg = evals.length
    ? (evals.reduce((a, e) => a + parseFloat(e.grade || 0), 0) / evals.length).toFixed(1)
    : null

  const membersCount = project.members_detail?.length || 0
  const evaluatedCount = evals.length

  return (
    <div style={{ background: 'var(--surface1)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate(`/projects/${project.id}`)}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, flexShrink: 0 }}>
            {project.name[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
              {project.name}
              <ArrowRight size={14} color="var(--text3)" />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
              {membersCount} membre{membersCount !== 1 ? 's' : ''} • {project.progress}% terminé
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {!loading && avg && (
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary-light)' }}>⭐ {avg}/20</span>
          )}
          <button
            className="btn btn-primary"
            style={{ fontSize: 13, padding: '8px 16px' }}
            onClick={onEvaluate}
          >
            <Star size={14} />
            Évaluer le projet
          </button>
        </div>
      </div>

      {/* Barre de progression */}
      <div style={{ marginBottom: evals.length > 0 ? 16 : 0 }}>
        <div className="progress-bar">
          <div className={`progress-fill ${project.progress === 100 ? 'done' : ''}`} style={{ width: `${project.progress}%` }} />
        </div>
      </div>

      {/* Liste des évaluations existantes */}
      {!loading && evals.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 4 }}>
            NOTES ATTRIBUÉES ({evaluatedCount}/{membersCount})
          </div>
          {evals.map(e => (
            <div key={e.id} style={{ background: 'var(--surface2)', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="avatar avatar-sm">{e.student_detail?.initials || e.student_detail?.username?.[0]?.toUpperCase()}</div>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{e.student_detail?.first_name} {e.student_detail?.last_name}</span>
              </div>
              <span style={{ fontWeight: 800, color: 'var(--primary-light)', fontSize: 15 }}>
                ⭐ {e.grade}/20
              </span>
            </div>
          ))}
        </div>
      )}

      {!loading && evals.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>
          Aucune évaluation pour ce projet
        </div>
      )}
    </div>
  )
}

// ─── Modal d'évaluation ──────────────────────────────────────────────────────

function EvalModal({ project, onClose, onSaved }) {
  const members = project.members_detail?.filter(m => m.role === 'student') || []
  const toast = useToastStore()

  // grades[userId] = string (ex: "15")
  const [grades, setGrades] = useState(() => {
    const init = {}
    members.forEach(m => { init[m.id] = '' })
    return init
  })
  const [loading, setLoading] = useState(false)
  // Charger les évaluations existantes pour pré-remplir
  const [existingEvals, setExistingEvals] = useState([])

  useEffect(() => {
    evaluationAPI.list(project.id).then(r => {
      setExistingEvals(r.data)
      // Pré-remplir les notes existantes
      const prefill = {}
      members.forEach(m => {
        const found = r.data.find(e => e.student === m.id)
        prefill[m.id] = found ? String(found.grade) : ''
      })
      setGrades(prefill)
    })
  }, [project.id])

  const setGrade = (userId, val) => {
    // Autoriser uniquement des valeurs entre 0 et 20
    if (val === '' || (Number(val) >= 0 && Number(val) <= 20)) {
      setGrades(g => ({ ...g, [userId]: val }))
    }
  }

  const handleSave = async () => {
    // Vérifier que toutes les notes sont remplies et valides
    for (const m of members) {
      const g = grades[m.id]
      if (g === '' || g === null || g === undefined) {
        toast.error(`Veuillez saisir une note pour ${m.first_name || m.username}`)
        return
      }
      const num = Number(g)
      if (isNaN(num) || num < 0 || num > 20) {
        toast.error(`Note invalide pour ${m.first_name || m.username} (0-20)`)
        return
      }
    }

    setLoading(true)
    try {
      const results = []
      for (const m of members) {
        const grade = Number(grades[m.id])
        const existing = existingEvals.find(e => e.student === m.id)

        if (existing) {
          // Mettre à jour la note existante
          const res = await evaluationAPI.update(existing.id, { grade })
          results.push(res.data)
        } else {
          // Créer une nouvelle évaluation
          const res = await evaluationAPI.create(project.id, { student: m.id, grade })
          results.push(res.data)
        }
      }
      toast.success('✅ Notes enregistrées !')
      onSaved(results)
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors de l\'enregistrement des notes')
    } finally {
      setLoading(false)
    }
  }

  const allFilled = members.every(m => grades[m.id] !== '')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">⭐ Évaluer le projet</h2>
            <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>{project.name}</p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {members.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '24px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>👥</div>
              <p>Aucun étudiant dans ce projet</p>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
                Attribuez une note sur 20 à chaque membre du projet.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {members.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--surface2)', borderRadius: 12, padding: '12px 16px' }}>
                    <div className="avatar avatar-sm" style={{ flexShrink: 0 }}>
                      {m.initials || m.username?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
                        {m.first_name} {m.last_name || m.username}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>@{m.username}</div>
                    </div>
                    {/* Input note */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.5"
                        value={grades[m.id]}
                        onChange={e => setGrade(m.id, e.target.value)}
                        placeholder="—"
                        style={{
                          width: 64,
                          textAlign: 'center',
                          fontWeight: 700,
                          fontSize: 16,
                          padding: '6px 8px',
                          borderRadius: 8,
                          border: '2px solid var(--border)',
                          background: 'var(--surface1)',
                          color: grades[m.id] !== '' ? 'var(--primary-light)' : 'var(--text3)',
                          outline: 'none',
                        }}
                        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                      />
                      <span style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 600 }}>/20</span>
                    </div>
                  </div>
                ))}
              </div>

              {!allFilled && (
                <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16, fontStyle: 'italic' }}>
                  ⚠️ Veuillez saisir une note pour chaque étudiant avant d'enregistrer.
                </p>
              )}

              <div className="form-actions">
                <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
                  Annuler
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={loading || !allFilled}
                >
                  {loading
                    ? <span className="spinner" style={{ width: 14, height: 14 }} />
                    : '✅ Enregistrer les notes'
                  }
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
