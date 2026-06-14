'use client'

import type { AutoMessageTemplate, MessageChannel } from '@/lib/messages'
import {
  PREVIEW_CLIENT,
  channelHint,
  mergeTemplateBody,
  resolvePreviewChannel,
} from '@/lib/messages'

interface Props {
  template: AutoMessageTemplate
  expanded: boolean
  onToggleExpand: () => void
  onEnabledChange: (enabled: boolean) => void
  onChannelChange: (channel: MessageChannel) => void
}

const CHANNELS: MessageChannel[] = ['auto', 'sms', 'email']

export default function AutoMessageCard({
  template,
  expanded,
  onToggleExpand,
  onEnabledChange,
  onChannelChange,
}: Props) {
  const previewChannel = resolvePreviewChannel(template.channel)
  const previewBody = mergeTemplateBody(
    previewChannel === 'sms' ? template.smsBody : template.emailBody
  )

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
          <div className="auto-message-channel__label">Sends via</div>
          <div className="auto-message-channel" role="group" aria-label="Message channel">
            {CHANNELS.map((ch) => (
              <button
                key={ch}
                type="button"
                className={`auto-message-channel__opt${template.channel === ch ? ' auto-message-channel__opt--active' : ''}`}
                onClick={() => onChannelChange(ch)}
              >
                {ch === 'auto' ? 'Auto' : ch === 'sms' ? 'SMS' : 'Email'}
              </button>
            ))}
          </div>
          <p className="auto-message-hint">{channelHint(template.channel)}</p>

          <div className="auto-message-preview">
            <span
              className={`auto-message-preview__pill auto-message-preview__pill--${previewChannel}`}
            >
              {previewChannel}
            </span>
            <p
              className={`auto-message-preview__body${previewChannel === 'sms' ? ' auto-message-preview__body--sms' : ''}`}
            >
              {previewBody}
            </p>
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
