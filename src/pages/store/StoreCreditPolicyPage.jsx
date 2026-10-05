import { useEffect, useState } from 'react'
import { api } from '../../api/api'
import { useAuth } from '../../context/AuthContext'
import PageBanner from '../../components/PageBanner'

function asPercent(value) {
  return (Number(value || 0) * 100).toFixed(4)
}

function asDecimal(value) {
  return Number(value || 0) / 100
}

export default function StoreCreditPolicyPage() {
  const { user } = useAuth()
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    api.getStoreCreditPolicy(user.storeId)
      .then(data => setForm({
        ...data,
        teaMinima: asPercent(data.teaMinima),
        teaMaxima: asPercent(data.teaMaxima)
      }))
      .catch(loadError => setError(loadError.message))
  }, [])

  function updateField(field, value) {
    setForm(current => ({ ...current, [field]: value }))
  }

  async function save(event) {
    event.preventDefault()
    setError('')
    setNotice('')

    try {
      const updated = await api.updateStoreCreditPolicy(user.storeId, {
        capitalMinimo: Number(form.capitalMinimo),
        capitalMaximo: Number(form.capitalMaximo),
        teaMinima: asDecimal(form.teaMinima),
        teaMaxima: asDecimal(form.teaMaxima),
        plazoMaximoMeses: Number(form.plazoMaximoMeses),
        otorgaGracia: form.otorgaGracia
      })

      setForm({
        ...updated,
        teaMinima: asPercent(updated.teaMinima),
        teaMaxima: asPercent(updated.teaMaxima)
      })
      setNotice('Política de crédito guardada.')
    } catch (saveError) {
      setError(saveError.message)
    }
  }

  if (!form && error) {
    return (
      <section className="content-page">
        <PageBanner title="Política de crédito" />
        <div className="alert-band">{error}</div>
      </section>
    )
  }

  if (!form) {
    return <div className="screen-message">Cargando política de crédito...</div>
  }

  return (
    <section className="content-page">
      <PageBanner title="Política de crédito" />

      {error && <div className="alert-band">{error}</div>}
      {notice && <div className="success-band">{notice}</div>}

      <div className="finance-fixed-line">
        <span>Moneda <strong>{form.currency}</strong></span>
        <span>Año comercial <strong>{form.commercialYearDays} días</strong></span>
        <span>Cuotas <strong>cada {form.paymentPeriodDays} días</strong></span>
        <span>Fechas de corte <strong>15 y 30 de cada mes</strong></span>
      </div>

      <form className="finance-form" onSubmit={save}>
        <div className="form-grid">
          <label>
            Capital mínimo (S/)
            <input
              type="number"
              step="0.01"
              value={form.capitalMinimo}
              onChange={event => updateField('capitalMinimo', event.target.value)}
              required
            />
          </label>
          <label>
            Capital máximo (S/)
            <input
              type="number"
              step="0.01"
              value={form.capitalMaximo}
              onChange={event => updateField('capitalMaximo', event.target.value)}
              required
            />
          </label>
          <label>
            TEA mínima (%)
            <input
              type="number"
              step="0.0001"
              value={form.teaMinima}
              onChange={event => updateField('teaMinima', event.target.value)}
              required
            />
          </label>
          <label>
            TEA máxima (%)
            <input
              type="number"
              step="0.0001"
              value={form.teaMaxima}
              onChange={event => updateField('teaMaxima', event.target.value)}
              required
            />
          </label>
          <label>
            Plazo máximo (meses)
            <select
              value={form.plazoMaximoMeses}
              onChange={event => updateField('plazoMaximoMeses', event.target.value)}
            >
              {[1, 2, 3, 4].map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={Boolean(form.otorgaGracia)}
              onChange={event => updateField('otorgaGracia', event.target.checked)}
            />
            Otorga gracia total por fecha de corte (15 y 30 de cada mes)
          </label>
        </div>
        <button className="primary-button" type="submit">Guardar</button>
      </form>
    </section>
  )
}
