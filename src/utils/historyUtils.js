import { HISTORY_STORAGE_KEY } from '../config/appConfig'

export function getStoredHistory() {
  const rawValue = localStorage.getItem(HISTORY_STORAGE_KEY)

  if (!rawValue) {
    return []
  }

  try {
    const parsed = JSON.parse(rawValue)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveHistory(historyList) {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyList))
}

export function recordProfileLoad(userId) {
  const newEntry = {
    userId,
    loadedAt: new Date().toISOString(),
  }

  const existing = getStoredHistory()
  const updated = [newEntry, ...existing].slice(0, 20)
  saveHistory(updated)

  return updated
}