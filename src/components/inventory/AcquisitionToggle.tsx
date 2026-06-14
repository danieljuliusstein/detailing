'use client'

export type AcquisitionMode = 'bought_new' | 'already_owned'

interface Props {
  value: AcquisitionMode
  onChange: (mode: AcquisitionMode) => void
}

export default function AcquisitionToggle({ value, onChange }: Props) {
  const includeExpense = value === 'bought_new'

  return (
    <div className="inv-acquisition">
      <p className="inv-field-label">INCLUDE IN EXPENSES?</p>
      <div className="inv-acquisition__toggle inv-tog-row">
        <button
          type="button"
          className={`inv-acquisition__opt inv-tog${includeExpense ? ' inv-acquisition__opt--active' : ''}`}
          onClick={() => onChange('bought_new')}
        >
          <span className="inv-acquisition__opt-title inv-tog__title">Yes</span>
          <span className="inv-acquisition__opt-sub inv-tog__sub">Log as business expense</span>
        </button>
        <button
          type="button"
          className={`inv-acquisition__opt inv-tog${!includeExpense ? ' inv-acquisition__opt--active' : ''}`}
          onClick={() => onChange('already_owned')}
        >
          <span className="inv-acquisition__opt-title inv-tog__title">No</span>
          <span className="inv-acquisition__opt-sub inv-tog__sub">Inventory only</span>
        </button>
      </div>
      <p className="inv-acquisition__hint">
        {includeExpense
          ? 'Amount paid will be logged to business expenses when you save'
          : 'Adds to inventory without creating an expense'}
      </p>
    </div>
  )
}
