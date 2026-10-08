import Sidebar from './Sidebar'
import s from './Layout.module.css'

export default function Layout({ children }) {
  return (
    <div className={s.layout}>
      <Sidebar />
      <main className={s.main}>{children}</main>
    </div>
  )
}
