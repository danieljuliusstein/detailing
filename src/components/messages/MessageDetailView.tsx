'use client'

import BackButton from '@/components/BackButton'
import type { SentMessage } from '@/lib/messages'
import { formatMessageTimestamp } from '@/lib/messages'

interface Props {
  message: SentMessage
  onBack: () => void
}

export default function MessageDetailView({ message, onBack }: Props) {
  return (
    <div className="messages-screen">
      <div className="messages-screen__header">
        <BackButton onClick={onBack} />
        <h1 className="messages-screen__title">Message</h1>
      </div>

      <div className="message-detail__photo-wrap">
        <div className="message-detail__channel-row">
          <span className={`all-message-pill all-message-pill--${message.channel}`}>
            {message.channel}
          </span>
          <span className={`all-message-pill all-message-pill--${message.status}`}>
            {message.status}
          </span>
        </div>
        <p className="message-detail__body">{message.body}</p>
      </div>

      <div className="message-detail__meta-card">
        <div className="message-detail__meta-row">
          <span className="message-detail__meta-key">Client</span>
          <span>{message.client_name}</span>
        </div>
        <div className="message-detail__meta-row">
          <span className="message-detail__meta-key">Sent</span>
          <span>{formatMessageTimestamp(message.sent_at)}</span>
        </div>
        <div className="message-detail__meta-row">
          <span className="message-detail__meta-key">Channel</span>
          <span style={{ textTransform: 'uppercase' }}>{message.channel}</span>
        </div>
      </div>
    </div>
  )
}
