import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, ArrowRight } from 'lucide-react'
import useAuthStore from '../store/authStore'
import s from './Auth.module.css'

export function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const { login, loading, error } = useAuthStore()
  const navigate = useNavigate()
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = await login(form.username, form.password)
    if (res.success) navigate('/dashboard')
  }

  return (
    <div className={s.page}>
      <AuthLeft />
      <div className={s.right}>
        <div className={s.card}>
          <div className={s.cardHeader}>
            <h1 className={s.title}>Bon retour 👋</h1>
            <p className={s.sub}>Connectez-vous à votre espace</p>
          </div>
          <form onSubmit={handleSubmit} className={s.form}>
            {error && <div className={s.error}>{error}</div>}
            <div className="form-group">
              <label className="form-label">Nom d'utilisateur</label>
              <input className="input" placeholder="votre_username" value={form.username} onChange={e => set('username', e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required />
            </div>
            <button type="submit" className={`btn btn-primary ${s.submitBtn}`} disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <><span>Se connecter</span><ArrowRight size={16} /></>}
            </button>
          </form>
          <p className={s.switch}>Pas de compte ? <Link to="/register">Créer un compte</Link></p>
        </div>
      </div>
    </div>
  )
}

export function Register() {
  const [form, setForm] = useState({ username: '', email: '', first_name: '', last_name: '', role: 'student', password: '', password2: '' })
  const { register, loading, error } = useAuthStore()
  const navigate = useNavigate()
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = await register(form)
    if (res.success) navigate('/dashboard')
  }

  return (
    <div className={s.page}>
      <AuthLeft />
      <div className={s.right}>
        <div className={s.card}>
          <div className={s.cardHeader}>
            <h1 className={s.title}>Créer un compte</h1>
            <p className={s.sub}>Rejoignez Fil Rouge dès maintenant</p>
          </div>
          <form onSubmit={handleSubmit} className={s.form}>
            {error && <div className={s.error}>{error}</div>}
            <div className="form-row">
              <div className="form-group"><label className="form-label">Prénom</label><input className="input" placeholder="Prénom" value={form.first_name} onChange={e => set('first_name', e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Nom</label><input className="input" placeholder="Nom" value={form.last_name} onChange={e => set('last_name', e.target.value)} required /></div>
            </div>
            <div className="form-group"><label className="form-label">Nom d'utilisateur</label><input className="input" placeholder="username" value={form.username} onChange={e => set('username', e.target.value)} required /></div>
            <div className="form-group"><label className="form-label">Email</label><input className="input" type="email" placeholder="email@exemple.com" value={form.email} onChange={e => set('email', e.target.value)} required /></div>

            <div className="form-group">
              <label className="form-label">Je suis</label>
              <div className={s.roleRow}>
                {[{ val: 'student', emoji: '🎓', label: 'Étudiant' }, { val: 'teacher', emoji: '👨‍🏫', label: 'Enseignant' }].map(r => (
                  <button key={r.val} type="button" className={`${s.roleBtn} ${form.role === r.val ? s.roleBtnActive : ''}`} onClick={() => set('role', r.val)}>
                    <span style={{ fontSize: 20 }}>{r.emoji}</span>
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group"><label className="form-label">Mot de passe</label><input className="input" type="password" placeholder="••••••" value={form.password} onChange={e => set('password', e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Confirmer</label><input className="input" type="password" placeholder="••••••" value={form.password2} onChange={e => set('password2', e.target.value)} required /></div>
            </div>

            <button type="submit" className={`btn btn-primary ${s.submitBtn}`} disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <><span>Créer mon compte</span><ArrowRight size={16} /></>}
            </button>
          </form>
          <p className={s.switch}>Déjà un compte ? <Link to="/login">Se connecter</Link></p>
        </div>
      </div>
    </div>
  )
}

function AuthLeft() {
  return (
    <div className={s.left}>
      <div className={s.leftInner}>
        <div className={s.leftBrand}>
          <div className={s.leftIcon}><Zap size={22} /></div>
          <span>Fil Rouge</span>
        </div>
        <div className={s.leftHero}>
          <h2>Gérez vos projets<br />comme un pro 🚀</h2>
          <p>Plateforme Scrum collaborative pour étudiants et enseignants</p>
        </div>
        <div className={s.features}>
          {[
            { icon: '📋', title: 'Scrum Board', desc: 'Kanban drag & drop fluide' },
            { icon: '⚡', title: 'Sprints', desc: 'Organisez vos cycles de dev' },
            { icon: '💬', title: 'Chat d\'équipe', desc: 'Communication en temps réel' },
            { icon: '📊', title: 'Dashboard', desc: 'Suivi de progression visuel' },
          ].map(f => (
            <div key={f.title} className={s.feature}>
              <span className={s.featureIcon}>{f.icon}</span>
              <div>
                <div className={s.featureTitle}>{f.title}</div>
                <div className={s.featureDesc}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
