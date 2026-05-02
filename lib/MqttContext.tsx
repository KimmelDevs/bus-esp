'use client'
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import mqtt from 'mqtt'

const BROKER = 'wss://broker.hivemq.com:8884/mqtt'
const SCAN_TOPIC = 'esp/rfid/scan'

type MqttStatus = 'connecting' | 'connected' | 'error' | 'disconnected'

// Who currently owns the scanner.
// 'dashboard' = dashboard processes scans (default)
// 'add-user' | 'topup' = those pages own it; dashboard ignores scans
type ScanOwner = 'dashboard' | 'add-user' | 'topup' | 'resident-register'

interface MqttContextValue {
  lastScan: string | null
  status: MqttStatus
  clearScan: () => void
  scanOwner: ScanOwner
  claimScanner: (owner: Exclude<ScanOwner, 'dashboard'>) => void
  releaseScanner: () => void
}

const MqttContext = createContext<MqttContextValue | null>(null)

export function MqttProvider({ children }: { children: React.ReactNode }) {
  const [lastScan, setLastScan] = useState<string | null>(null)
  const [status, setStatus] = useState<MqttStatus>('connecting')
  const [scanOwner, setScanOwner] = useState<ScanOwner>('dashboard')

  useEffect(() => {
    const client = mqtt.connect(BROKER, {
      clientId: 'web_' + Math.random().toString(16).slice(2, 8),
      clean: true,
      reconnectPeriod: 3000,
    })

    client.on('connect', () => {
      setStatus('connected')
      client.subscribe(SCAN_TOPIC)
    })
    client.on('message', (_topic: string, payload: Buffer) => {
      const uid = payload.toString().trim()
      if (uid) setLastScan(uid)
    })
    client.on('error', () => setStatus('error'))
    client.on('offline', () => setStatus('disconnected'))
    client.on('reconnect', () => setStatus('connecting'))

    return () => { client.end(true) }
  }, [])

  const claimScanner = useCallback((owner: Exclude<ScanOwner, 'dashboard'>) => {
    setScanOwner(owner)
    setLastScan(null) // discard any pending scan from dashboard
  }, [])

  const releaseScanner = useCallback(() => {
    setScanOwner('dashboard')
    setLastScan(null)
  }, [])

  return (
    <MqttContext.Provider value={{
      lastScan, status,
      clearScan: () => setLastScan(null),
      scanOwner, claimScanner, releaseScanner,
    }}>
      {children}
    </MqttContext.Provider>
  )
}

export function useMqttContext() {
  const ctx = useContext(MqttContext)
  if (!ctx) throw new Error('useMqttContext must be used inside MqttProvider')
  return ctx
}