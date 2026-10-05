import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/api'
import FrenchScheduleTable from '../../components/FrenchScheduleTable'
import PageBanner from '../../components/PageBanner'

function money(value) {
  return `S/ ${Number(value || 0).toFixed(2)}`
}

function date(value) {
  if (!value) return '—'
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-PE')
}

export default function ClientCreditsPage() {
  const [plans, setPlans] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.getClientCreditPlans(),
      api.getClientPayments()
    ])
      .then(([planData, paymentData]) => {
        setPlans(planData || [])
        setPayments(paymentData || [])
      })
      .catch(loadError => setError(loadError.message))
      .finally(() => setLoading(false))
  }, [])

  const activePlan = useMemo(
    () => plans.find(plan => plan.status === 'ACTIVE'),
    [plans]
  )
  const nextInstallment = activePlan?.installments?.find(
    item => item.estado === 'PENDING' || item.estado === 'OVERDUE'
  )

  return (
    <section className="content-page">
      <PageBanner title="Mis créditos" />

      {error && <div className="alert-band">{error}</div>}
      {loading && <div className="screen-message compact">Cargando créditos...</div>}

      {!loading && (
        <>
          <div className="credit-summary-line">
            <div>
              <span>Crédito activo</span>
              <strong>{activePlan ? money(activePlan.principal) : '—'}</strong>
            </div>
            <div>
              <span>Próxima cuota a pagar</span>
              <strong>{nextInstallment ? money(nextInstallment.pagoTotal) : '—'}</strong>
              <small>
                {nextInstallment ? date(nextInstallment.dueDate) : 'Sin cuota pendiente'}
              </small>
            </div>
            <div>
              <span>Días de mora en la próxima cuota</span>
              <strong>{nextInstallment?.diasMora || 0}</strong>
            </div>
          </div>

          {plans.length === 0 ? (
            <p className="empty-state">Todavía no tienes créditos en cuotas.</p>
          ) : (
            plans.map(plan => (
              <section className="plain-section" key={plan.id}>
                <div className="section-title-row">
                  <h2>Deuda #{plan.id}</h2>
                  <span className="status-text">
                    {plan.status === 'ACTIVE' ? 'Activa' : 'Pagada'}
                  </span>
                </div>
                <FrenchScheduleTable plan={plan} />
              </section>
            ))
          )}

          {payments.length > 0 && (
            <section className="plain-section">
              <h2>Pagos realizados</h2>
              <div className="payment-list">
                {payments.map(payment => (
                  <div className="payment-row" key={payment.id}>
                    <div>
                      <strong>{money(payment.totalAmount)}</strong>
                      <span>{date(payment.paymentDate)}</span>
                    </div>
                    <span>{payment.diasMora > 0 ? `${payment.diasMora} días de mora` : 'Sin mora'}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </section>
  )
}
