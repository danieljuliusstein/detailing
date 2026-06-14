'use client'

import { ChatCircle } from '@phosphor-icons/react'
import type { SentMessage } from '@/lib/messages'
import { formatMessageTimestamp } from '@/lib/messages'

interface Props {
  messages: SentMessage[]
  onSelect: (message: SentMessage) => void
}

export default function AllMessagesTab({ messages, onSelect }: Props) {
  if (messages.length === 0) {
    return (
      <div className="all-messages-empty">
        <ChatCircle className="all-messages-empty__icon" size={32} weight="duotone" aria-hidden="true" />
        <p className="all-messages-empty__title">No messages sent yet</p>
        <p className="all-messages-empty__sub">Automated and manual messages will appear here</p>
      </div>
    )
  }

  return (
    <div>
      {messages.map((msg) => (
        <button
          key={msg.id}
          type="button"
          className="all-message-row"
          onClick={() => onSelect(msg)}
        >
          <div className="all-message-row__body">
            <div className="all-message-row__top">
              <p className="all-message-row__name">{msg.client_name}</p>
              <span className="all-message-row__time">{formatMessageTimestamp(msg.sent_at)}</span>
            </div>
            <p className="all-message-row__preview">{msg.preview}</p>
            <div className="all-message-row__meta">
              <span className={`all-message-pill all-message-pill--${msg.channel}`}>{msg.channel}</span>
              <span className={`all-message-pill all-message-pill--${msg.status}`}>{msg.status}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
