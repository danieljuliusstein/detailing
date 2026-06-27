'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import BackButton from '@/components/BackButton'
import AllMessagesTab from '@/components/messages/AllMessagesTab'
import AutoMessagesTab from '@/components/messages/AutoMessagesTab'
import MessageDetailView from '@/components/messages/MessageDetailView'
import type { AutoMessageTemplate, SentMessage } from '@/lib/messages'
import {
  DEFAULT_AUTO_TEMPLATES,
  loadAutoMessageTemplatesAsync,
  loadSentMessagesAsync,
  saveAutoMessageTemplatesAsync,
} from '@/lib/messages'

type Tab = 'all' | 'auto'

export default function MessagesScreen() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') === 'auto' ? 'auto' : 'all'

  const [tab, setTab] = useState<Tab>(initialTab)
  const [templates, setTemplates] = useState<AutoMessageTemplate[]>(DEFAULT_AUTO_TEMPLATES)
  const [expandedId, setExpandedId] = useState('appointment_reminder')
  const [selected, setSelected] = useState<SentMessage | null>(null)
  const [sentMessages, setSentMessages] = useState<SentMessage[]>([])
  const [loadingSent, setLoadingSent] = useState(true)

  useEffect(() => {
    loadAutoMessageTemplatesAsync().then(setTemplates)
    loadSentMessagesAsync()
      .then(setSentMessages)
      .finally(() => setLoadingSent(false))
  }, [])

  const persistTemplates = useCallback((next: AutoMessageTemplate[]) => {
    setTemplates(next)
    void saveAutoMessageTemplatesAsync(next)
  }, [])

  const handleTemplateUpdate = useCallback(
    (id: string, patch: Partial<Pick<AutoMessageTemplate, 'enabled'>>) => {
      persistTemplates(
        templates.map((t) => (t.id === id ? { ...t, ...patch } : t))
      )
    },
    [templates, persistTemplates]
  )

  if (selected) {
    return <MessageDetailView message={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div className="messages-screen">
      <div className="messages-screen__header">
        <BackButton onClick={() => router.push('/')} />
        <h1 className="messages-screen__title">Messages</h1>
      </div>

      <div className="messages-tabs" role="tablist" aria-label="Messages views">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'all'}
          className={`messages-tabs__btn${tab === 'all' ? ' messages-tabs__btn--active' : ''}`}
          onClick={() => setTab('all')}
        >
          All Messages
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'auto'}
          className={`messages-tabs__btn${tab === 'auto' ? ' messages-tabs__btn--active' : ''}`}
          onClick={() => setTab('auto')}
        >
          Auto Messages
        </button>
      </div>

      {tab === 'all' ? (
        loadingSent ? (
          <p className="messages-empty">Loading messages…</p>
        ) : sentMessages.length === 0 ? (
          <p className="messages-empty">No messages sent yet. Enable auto messages to start texting clients.</p>
        ) : (
          <AllMessagesTab messages={sentMessages} onSelect={setSelected} />
        )
      ) : (
        <AutoMessagesTab
          templates={templates}
          expandedId={expandedId}
          onExpandedChange={setExpandedId}
          onUpdate={handleTemplateUpdate}
        />
      )}
    </div>
  )
}
