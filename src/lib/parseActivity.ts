export interface ActivityEntry {
  id: string
  time: string
  type: 'status_change' | 'file_edit' | 'command' | 'note' | 'heartbeat'
  description: string
}

const TYPE_PATTERNS: [RegExp, ActivityEntry['type']][] = [
  [/moved.*(?:to|→)|status.*changed|backlog|in.progress|review|done/i, 'status_change'],
  [/heartbeat|HEARTBEAT_OK|cron|routine/i, 'heartbeat'],
  [/edited|created|wrote|modified|updated.*file|commit|push|PR|pull.request/i, 'file_edit'],
  [/ran|executed|running|command|deploy|build|install/i, 'command'],
]

function detectType(line: string): ActivityEntry['type'] {
  for (const [pattern, type] of TYPE_PATTERNS) {
    if (pattern.test(line)) return type
  }
  return 'note'
}

/**
 * Parse memory file content into structured activity entries.
 * Expects markdown-style content with timestamps like:
 *   ## 14:32 — Did something
 *   - bullet point detail
 *   **14:32** some action
 *   [14:32] some action
 */
export function parseActivity(content: string): ActivityEntry[] {
  const entries: ActivityEntry[] = []
  const lines = content.split('\n')

  // Match common timestamp patterns in memory logs
  const timePatterns = [
    /^#{1,3}\s+(\d{1,2}:\d{2})\s*[—–-]\s*(.+)/,       // ## 14:32 — description
    /^\*{0,2}(\d{1,2}:\d{2})\*{0,2}\s*[—–:\-]\s*(.+)/, // **14:32** — description or 14:32 - description
    /^\[(\d{1,2}:\d{2})\]\s*(.+)/,                       // [14:32] description
    /^[-*]\s+(\d{1,2}:\d{2})\s*[—–:\-]\s*(.+)/,         // - 14:32 — description
  ]

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    for (const pattern of timePatterns) {
      const match = line.match(pattern)
      if (match) {
        const [, time, description] = match
        entries.push({
          id: `${time}-${i}`,
          time,
          type: detectType(description),
          description: description.trim(),
        })
        break
      }
    }
  }

  // If no timestamped entries found, fall back to bullet points as generic entries
  if (entries.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line || line.startsWith('#')) continue
      const bullet = line.match(/^[-*]\s+(.+)/)
      if (bullet) {
        entries.push({
          id: `line-${i}`,
          time: '',
          type: detectType(bullet[1]),
          description: bullet[1].trim(),
        })
      }
    }
  }

  return entries
}

/** Get today's date string in YYYY-MM-DD format */
export function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}
