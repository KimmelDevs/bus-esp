'use client'
import { useEffect, useRef, useState } from 'react'
import mqtt from 'mqtt'

const BROKER = 'wss://broker.hivemq.com:8884/mqtt'
const SCAN_TOPIC = 'esp/rfid/scan'

/**
 * Hook that connects to the same HiveMQ broker the ESP32 uses
 * and returns the latest scanned RFID UID.
 *
 * Usage:
 *   const { lastScan, status, clearScan } = useMqttScan()
 *
 * status: 'connecting' | 'connected' | 'error' | 'disconnected'
 */
export function useMqttScan() {
  const [lastScan, setLastScan] = useState<string | null>(null)
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('connecting')
  const clientRef = useRef<mqtt.MqttClient | null>(null)

  useEffect(() => {
    const client = mqtt.connect(BROKER, {
      clientId: 'web_' + Math.random().toString(16).slice(2, 8),
      clean: true,
      reconnectPeriod: 3000,
    })
    clientRef.current = client

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

    return () => {
      client.end(true)
    }
  }, [])

  return {
    lastScan,
    status,
    clearScan: () => setLastScan(null),
  }
}
