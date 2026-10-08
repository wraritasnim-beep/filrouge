import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Toast from './components/Toast'
import { Login, Register } from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import MyTasks from './pages/MyTasks'
import Evaluations from './pages/Evaluations'
import Students from './pages/Students'

function Private({ children }) {
  const { user } = useAuthStore()
  return user ? children : <Navigate to="/login" replace />
}

function Public({ children }) {
  const { user } = useAuthStore()
  return !user ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login"        element={<Public><Login /></Public>} />
        <Route path="/register"     element={<Public><Register /></Public>} />
        <Route path="/dashboard"    element={<Private><Dashboard /></Private>} />
        <Route path="/projects"     element={<Private><Projects /></Private>} />
        <Route path="/projects/:id" element={<Private><ProjectDetail /></Private>} />
        <Route path="/my-tasks"     element={<Private><MyTasks /></Private>} />
        <Route path="/evaluations"  element={<Private><Evaluations /></Private>} />
        <Route path="/students"     element={<Private><Students /></Private>} />
        <Route path="*"             element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toast />
    </>
  )
}
