import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/dayudita-logo.png'
import sidebarBunny from '../assets/bunny-sidebar.png'
import star from '../assets/star-red-mini.png'

const menuByRole = {
  CLIENT: [
    { to: '/client/products', label: 'PRODUCTOS' },
    { to: '/client/credits', label: 'CRÉDITOS' },
    { to: '/client/profile', label: 'PERFIL' }
  ],
  STORE_ADMIN: [
    { to: '/store/clients', label: 'CLIENTES' },
    { to: '/store/credits', label: 'CRÉDITOS' },
    { to: '/store/credit-policy', label: 'POLÍTICA DE CRÉDITO' },
    { to: '/store/profile', label: 'PERFIL' }
  ],
  SYSTEM_ADMIN: [
    { to: '/system/stores', label: 'TIENDAS' },
    { to: '/system/profile', label: 'PERFIL' }
  ]
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const menu = menuByRole[user.role] || []

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src={logo} alt="Dayudita Piñatería" />
        </div>

        <nav className="sidebar-menu">
          {menu.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <img className="sidebar-star" src={star} alt="" aria-hidden="true" />
        <img className="sidebar-bunny" src={sidebarBunny} alt="" aria-hidden="true" />
      </aside>

      <main className="page-area">
        <header className="topbar">
          <div className="topbar-user">
            <div>
              <strong>{user.firstName} {user.lastName}</strong>
              {user.storeName && <span>{user.storeName}</span>}
            </div>
            <button className="text-button" type="button" onClick={logout}>Salir</button>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  )
}
