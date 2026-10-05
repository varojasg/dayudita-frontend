function money(value) {
  return `S/ ${Number(value || 0).toFixed(2)}`
}

function date(value) {
  if (!value) return '—'
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-PE')
}

function percent(value) {
  return `${(Number(value || 0) * 100).toFixed(4)}%`
}

const TYPE_LABEL = {
  TOTAL: 'T',
  STANDARD: 'S'
}

const STATUS_LABEL = {
  GRACE_TOTAL: 'Gracia total',
  PENDING: 'Pendiente',
  PAID: 'Pagada',
  OVERDUE: 'Vencida'
}

function statusRowClass(estado) {
  if (estado === 'OVERDUE') return 'schedule-row-overdue'
  if (estado === 'PAID') return 'schedule-row-paid'
  return ''
}

export default function FrenchScheduleTable({ plan, showPaymentAction, onPay }) {
  const installments = plan.installments || []
  const firstPayableIndex = installments.findIndex(
    item => item.estado === 'PENDING' || item.estado === 'OVERDUE'
  )

  return (
    <div className="french-plan">
      <div className="schedule-heading">
        <h2>Tabla de método francés</h2>
        <p>
          Quincenal · {plan.paymentPeriodDays || 15} días · {plan.installmentCount} cuotas
          {' '}· TEA {percent(plan.teaPactada)} · TEQ {percent(plan.teq)}
        </p>
        <p>
          {plan.diasGraciaTotal > 0
            ? `Gracia total: ${plan.diasGraciaTotal} día${plan.diasGraciaTotal === 1 ? '' : 's'} hasta la primera fecha de corte pactada con el cliente`
            : 'Sin gracia total en este crédito'}
        </p>
      </div>

      <div className="table-wrap schedule-table-wrap">
        <table className="schedule-table">
          <thead>
            <tr>
              <th>N°</th>
              <th>Vencimiento</th>
              <th>Días</th>
              <th>Tasa periodo</th>
              <th>Tipo</th>
              <th>Saldo inicial</th>
              <th>Interés</th>
              <th>Cuota</th>
              <th>Amortización</th>
              <th>Saldo final</th>
              <th>Días mora</th>
              <th>Interés moratorio</th>
              <th>Pago total</th>
              <th>Estado</th>
              {showPaymentAction && <th></th>}
            </tr>
          </thead>
          <tbody>
            {installments.map((item, index) => (
              <tr key={item.id ?? index} className={statusRowClass(item.estado)}>
                <td>{item.installmentNumber}</td>
                <td>{date(item.dueDate)}</td>
                <td>{item.diasPeriodo}</td>
                <td>{percent(item.tasaPeriodo)}</td>
                <td>{TYPE_LABEL[item.type] || item.type}</td>
                <td>{money(item.openingBalance)}</td>
                <td>{money(item.interest)}</td>
                <td>({money(item.amount)})</td>
                <td>({money(item.amortization)})</td>
                <td>{money(item.remainingBalance)}</td>
                <td>{item.diasMora || 0}</td>
                <td>({money(item.interesMoratorio)})</td>
                <td>({money(item.pagoTotal)})</td>
                <td>{STATUS_LABEL[item.estado] || item.estado}</td>
                {showPaymentAction && (
                  <td>
                    {index === firstPayableIndex && (
                      <button className="text-button" type="button" onClick={() => onPay(item)}>Pagar</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="schedule-totals-row">
              <td colSpan={6}>Totales</td>
              <td>{money(plan.totalIntereses)}</td>
              <td>({money(plan.totalCuotas)})</td>
              <td>({money(plan.totalAmortizacion)})</td>
              <td></td>
              <td></td>
              <td>({money(plan.totalInteresMoratorio)})</td>
              <td>({money(plan.totalAPagarConMora)})</td>
              <td></td>
              {showPaymentAction && <td></td>}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
