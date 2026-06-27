'use client'

import type { AutoMessageTemplate } from '@/lib/messages'
import AutoMessageCard from '@/components/messages/AutoMessageCard'

interface Props {
  templates: AutoMessageTemplate[]
  expandedId: string
  onExpandedChange: (id: string) => void
  onUpdate: (id: string, patch: Partial<Pick<AutoMessageTemplate, 'enabled'>>) => void
}

export default function AutoMessagesTab({ templates, expandedId, onExpandedChange, onUpdate }: Props) {
  return (
    <div className="auto-message-list">
      {templates.map((template) => (
        <AutoMessageCard
          key={template.id}
          template={template}
          expanded={expandedId === template.id}
          onToggleExpand={() =>
            onExpandedChange(expandedId === template.id ? '' : template.id)
          }
          onEnabledChange={(enabled) => onUpdate(template.id, { enabled })}
        />
      ))}
    </div>
  )
}
