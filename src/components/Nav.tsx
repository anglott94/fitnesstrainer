import { NavLink } from 'react-router-dom'
import { IconBook, IconChart, IconHistory, IconSettings, IconToday } from './icons'

const ITEMS = [
  { to: '/', label: 'Heute', Icon: IconToday, end: true },
  { to: '/fortschritt', label: 'Fortschritt', Icon: IconChart, end: false },
  { to: '/uebungen', label: 'Übungen', Icon: IconBook, end: false },
  { to: '/verlauf', label: 'Verlauf', Icon: IconHistory, end: false },
  { to: '/einstellungen', label: 'Mehr', Icon: IconSettings, end: false },
]

export function Nav() {
  return (
    <nav className="nav">
      {ITEMS.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end} className="nav-item">
          <Icon />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
