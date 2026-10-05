import { useAuth } from '../../context/AuthContext'
import PageBanner from '../../components/PageBanner'

export default function SystemProfilePage() {
  const { user } = useAuth()

  return (
    <section className="content-page">
      <PageBanner title="Mi perfil" />
      <div className="profile-card-grid profile-card-grid-single">
        <section className="profile-card profile-card-main">
          <h2>Mis datos</h2>
          <dl className="detail-list">
            <div><dt>Nombre</dt><dd>{user.firstName} {user.lastName}</dd></div>
            <div><dt>Correo</dt><dd>{user.email}</dd></div>
            <div><dt>Cuenta</dt><dd>Administradora del sistema</dd></div>
          </dl>
        </section>
      </div>
    </section>
  )
}
