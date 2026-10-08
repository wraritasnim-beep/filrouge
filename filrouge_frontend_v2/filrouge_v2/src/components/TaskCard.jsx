import { useState } from 'react'
import { Clock, User, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import s from './TaskCard.module.css'

const P_ICON = { high: '🔴', medium: '🟡', low: '🟢' }
const P_LABEL = { high: 'Haute', medium: 'Moyenne', low: 'Faible' }

export default function TaskCard({ task, onClick, onDelete, canEdit, provided }) {
  const [menu, setMenu] = useState(false)

  return (
    <div
      ref={provided?.innerRef}
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      className={s.card}
      onClick={() => canEdit && onClick?.(task)}
    >
      {/* Top row */}
      <div className={s.top}>
        <span className={`badge badge-${task.priority}`}>
          {P_ICON[task.priority]} {P_LABEL[task.priority]}
        </span>
        {canEdit && (
          <div className={s.menuWrap} onClick={e => e.stopPropagation()}>
            <button className={`btn btn-ghost btn-icon btn-sm ${s.menuBtn}`} onClick={() => setMenu(m => !m)}>
              <MoreVertical size={13} />
            </button>
            {menu && (
              <div className={s.menu}>
                <button onClick={() => { setMenu(false); onClick?.(task) }}>
                  <Pencil size={12} /> Modifier
                </button>
                <button className={s.menuDel} onClick={() => { setMenu(false); onDelete?.(task.id) }}>
                  <Trash2 size={12} /> Supprimer
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <div className={s.title}>{task.title}</div>

      {/* Desc */}
      {task.description && (
        <div className={s.desc}>
          {task.description.length > 75 ? task.description.slice(0, 75) + '…' : task.description}
        </div>
      )}

      {/* Sprint tag */}
      {task.sprint_name && (
        <div className={s.sprintTag}>⚡ {task.sprint_name}</div>
      )}

      {/* Footer */}
      <div className={s.footer}>
        {task.assignee_detail ? (
          <div className={s.assignee}>
            <div className="avatar avatar-sm">
              {task.assignee_detail.initials || task.assignee_detail.username?.[0]?.toUpperCase()}
            </div>
            <span>{task.assignee_detail.first_name || task.assignee_detail.username}</span>
          </div>
        ) : (
          <div className={s.unassigned}><User size={11} /> Non assigné</div>
        )}
        {task.estimated_time && (
          <div className={s.time}><Clock size={11} /> {task.estimated_time}h</div>
        )}
      </div>
    </div>
  )
}
