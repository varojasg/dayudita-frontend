import { useAuth } from '../../context/AuthContext'
import PageBanner from '../../components/PageBanner'

export default function StoreProfilePage() {
  const { user } = useAuth()

  return (
    <section className="content-page">
      <PageBanner title="Mi perfil" />
      <div className="profile-card-grid">
        <section className="profile-card profile-card-main">
          <h2>Mis datos</h2>
          <dl className="detail-list">
            <div><dt>Nombre</dt><dd>{user.firstName} {user.lastName}</dd></div>
            <div><dt>Correo</dt><dd>{user.email}</dd></div>
            <div><dt>Cuenta</dt><dd>Administradora de tienda</dd></div>
          </dl>
        </section>
        <section className="profile-card profile-card-accent">
          <h2>Mi tienda</h2>
          <div className="big-store-name">{user.storeName}</div>
        </section>
      </div>
    </section>
  )
}
