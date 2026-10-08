import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, CheckSquare, BookOpen, Users, LogOut, Zap } from 'lucide-react'
import useAuthStore from '../store/authStore'
import s from './Sidebar.module.css'

export default function Sidebar() {
  const { user, logout, isTeacher } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const studentLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/projects',  icon: FolderKanban,    label: 'Mes Projets' },
    { to: '/my-tasks',  icon: CheckSquare,      label: 'Mes Tâches' },
  ]

  const teacherLinks = [
    { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/projects',     icon: FolderKanban,    label: 'Tous les Projets' },
    { to: '/evaluations',  icon: BookOpen,         label: 'Évaluations' },
    { to: '/students',     icon: Users,            label: 'Étudiants' },
  ]

  const links = isTeacher() ? teacherLinks : studentLinks
  const initials = user?.first_name && user?.last_name
    ? user.first_name[0] + user.last_name[0]
    : user?.username?.[0]?.toUpperCase() || 'U'

  return (
    <aside className={s.sidebar}>
      {/* Brand */}
      <div className={s.brand}>
        <div className={s.brandIcon}>
          <Zap size={18} strokeWidth={2.5} />
        </div>
        <div>
          <div className={s.brandName}>Fil Rouge</div>
          <div className={s.brandSub}>Scrum Platform</div>
        </div>
      </div>

      {/* Role pill */}
      <div className={s.rolePill}>
        <div className={`${s.roleDot} ${isTeacher() ? s.roleDotTeacher : s.roleDotStudent}`} />
        {isTeacher() ? 'Espace Enseignant' : 'Espace Étudiant'}
      </div>

      {/* Nav */}
      <nav className={s.nav}>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `${s.link} ${isActive ? s.active : ''}`}>
            <div className={s.linkIcon}><Icon size={16} /></div>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className={s.footer}>
        <div className={s.userRow}>
          <div className={`avatar ${s.userAvatar}`}>{initials}</div>
          <div className={s.userInfo}>
            <div className={s.userName}>{user?.first_name || user?.username}</div>
            <div className={s.userRole}>{isTeacher() ? '👨‍🏫 Enseignant' : '🎓 Étudiant'}</div>
          </div>
        </div>
        <button className={`btn btn-ghost btn-sm ${s.logoutBtn}`} onClick={handleLogout}>
          <LogOut size={14} /> Déconnexion
        </button>
      </div>
    </aside>
  )
}
