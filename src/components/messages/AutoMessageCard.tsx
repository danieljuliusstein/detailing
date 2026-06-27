'use client'

import type { AutoMessageTemplate } from '@/lib/messages'
import { AUTO_MESSAGE_HINT, PREVIEW_CLIENT, mergeTemplateBody } from '@/lib/messages'

interface Props {
  template: AutoMessageTemplate
  expanded: boolean
  onToggleExpand: () => void
  onEnabledChange: (enabled: boolean) => void
}

export default function AutoMessageCard({
  template,
  expanded,
  onToggleExpand,
  onEnabledChange,
}: Props) {
  const previewBody = mergeTemplateBody(template.emailBody)

  return (
    <article className={`auto-message-card${expanded ? ' auto-message-card--expanded' : ''}`}>
      <div className="auto-message-card__head">
        <button type="button" className="auto-message-card__head-btn" onClick={onToggleExpand}>
          <p className="auto-message-card__name">{template.name}</p>
          <p className="auto-message-card__trigger">{template.trigger}</p>
        </button>
        <button
          type="button"
          className={`auto-message-toggle${template.enabled ? ' auto-message-toggle--on' : ''}`}
          role="switch"
          aria-checked={template.enabled}
          aria-label={`${template.enabled ? 'Disable' : 'Enable'} ${template.name}`}
          onClick={(e) => {
            e.stopPropagation()
            onEnabledChange(!template.enabled)
          }}
        >
          <span className="auto-message-toggle__knob" />
        </button>
      </div>

      {expanded && (
        <div className="auto-message-card__body">
          <p className="auto-message-hint">{AUTO_MESSAGE_HINT}</p>

          <div className="auto-message-preview">
            <span className="auto-message-preview__pill auto-message-preview__pill--email">
              Email
            </span>
            <p className="auto-message-preview__body">{previewBody}</p>
            <p className="auto-message-preview__meta">
              Preview · {PREVIEW_CLIENT.name} · {PREVIEW_CLIENT.package} · {PREVIEW_CLIENT.time} ·{' '}
              {PREVIEW_CLIENT.date}
            </p>
          </div>
        </div>
      )}
    </article>
  )
}
