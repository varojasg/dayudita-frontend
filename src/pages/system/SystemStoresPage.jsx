import { useEffect, useState } from 'react'
import { api } from '../../api/api'
import Modal from '../../components/Modal'
import PageBanner from '../../components/PageBanner'

const emptyStore = {
  name: '',
  address: '',
  phone: '',
  adminFirstName: '',
  adminLastName: '',
  adminEmail: '',
  adminPassword: ''
}

export default function SystemStoresPage() {
  const [stores, setStores] = useState([])
  const [form, setForm] = useState(emptyStore)
  const [editing, setEditing] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')

  async function loadStores() {
    try {
      setStores(await api.getStores())
    } catch (loadError) {
      setError(loadError.message)
    }
  }

  useEffect(() => { loadStores() }, [])

  function openCreate() {
    setEditing(null)
    setForm(emptyStore)
    setShowModal(true)
  }

  function openEdit(store) {
    setEditing(store)
    setForm({
      name: store.name,
      address: store.address,
      phone: store.phone || ''
    })
    setShowModal(true)
  }

  async function save(event) {
    event.preventDefault()
    try {
      if (editing) {
        await api.updateStore(editing.id, form)
      } else {
        await api.createStore(form)
      }
      setShowModal(false)
      await loadStores()
    } catch (saveError) {
      setError(saveError.message)
    }
  }

  async function toggle(store) {
    try {
      await api.updateStoreStatus(store.id, !store.active)
      await loadStores()
    } catch (statusError) {
      setError(statusError.message)
    }
  }

  return (
    <section className="content-page">
      <PageBanner
        title="Tiendas"
        actions={<button className="primary-button" type="button" onClick={openCreate}>Nueva tienda</button>}
      />

      {error && <div className="alert-band">{error}</div>}

      <section className="paper-section no-pad">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tienda</th>
                <th>Dirección</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {stores.map(store => (
                <tr key={store.id}>
                  <td><strong>{store.name}</strong></td>
                  <td>{store.address}</td>
                  <td>{store.phone || '—'}</td>
                  <td>
                    <span className={`status-tag ${store.active ? 'paid' : 'inactive'}`}>
                      {store.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="row-actions">
                    <button className="text-button" type="button" onClick={() => openEdit(store)}>Editar</button>
                    <button className="text-button" type="button" onClick={() => toggle(store)}>
                      {store.active ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showModal && (
        <Modal title={editing ? 'Editar tienda' : 'Nueva tienda'} onClose={() => setShowModal(false)} wide>
          <form className="form-grid" onSubmit={save}>
            <label>
              Nombre
              <input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required />
            </label>
            <label>
              Teléfono
              <input value={form.phone || ''} onChange={event => setForm({ ...form, phone: event.target.value })} />
            </label>
            <label className="full-span">
              Dirección
              <input value={form.address} onChange={event => setForm({ ...form, address: event.target.value })} required />
            </label>

            {!editing && (
              <>
                <label>
                  Nombre del admin
                  <input value={form.adminFirstName} onChange={event => setForm({ ...form, adminFirstName: event.target.value })} required />
                </label>
                <label>
                  Apellido del admin
                  <input value={form.adminLastName} onChange={event => setForm({ ...form, adminLastName: event.target.value })} required />
                </label>
                <label>
                  Correo del admin
                  <input type="email" value={form.adminEmail} onChange={event => setForm({ ...form, adminEmail: event.target.value })} required />
                </label>
                <label>
                  Contraseña
                  <input type="password" minLength="6" value={form.adminPassword} onChange={event => setForm({ ...form, adminPassword: event.target.value })} required />
                </label>
              </>
            )}

            <div className="form-actions full-span">
              <button className="primary-button" type="submit">Guardar</button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  )
}
