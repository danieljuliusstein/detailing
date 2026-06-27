'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { loadSettingsAsync, saveSettingsAsync, type AppSettings } from '@/lib/settings'

interface SettingsDraftContextValue {
  settings: AppSettings | null
  ready: boolean
  dirty: boolean
  savedFlash: boolean
  logoFile: File | null
  setLogoFile: (file: File | null) => void
  update: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
  save: () => Promise<boolean>
  reload: () => Promise<void>
}

const SettingsDraftContext = createContext<SettingsDraftContextValue | null>(null)

export function SettingsDraftProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [ready, setReady] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [logoFile, setLogoFileState] = useState<File | null>(null)

  const reload = useCallback(async () => {
    const loaded = await loadSettingsAsync()
    setSettings(loaded)
    setReady(true)
    setDirty(false)
    setLogoFileState(null)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const setLogoFile = useCallback((file: File | null) => {
    setLogoFileState(file)
    setDirty(true)
  }, [])

  const update = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((current) => (current ? { ...current, [key]: value } : current))
    setDirty(true)
  }, [])

  const save = useCallback(async () => {
    if (!settings) return false
    try {
      const savedSettings = await saveSettingsAsync(settings, logoFile)
      setSettings(savedSettings)
      setLogoFileState(null)
      setDirty(false)
      setSavedFlash(true)
      window.setTimeout(() => setSavedFlash(false), 2000)
      return true
    } catch (error) {
      throw error
    }
  }, [settings, logoFile])

  const value = useMemo(
    () => ({
      settings,
      ready,
      dirty,
      savedFlash,
      logoFile,
      setLogoFile,
      update,
      save,
      reload,
    }),
    [settings, ready, dirty, savedFlash, logoFile, setLogoFile, update, save, reload]
  )

  return <SettingsDraftContext.Provider value={value}>{children}</SettingsDraftContext.Provider>
}

export function useSettingsDraft() {
  const ctx = useContext(SettingsDraftContext)
  if (!ctx) throw new Error('useSettingsDraft must be used within SettingsDraftProvider')
  return ctx
}
