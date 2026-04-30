'use client'
// Thin wrapper — delegates to MqttContext so the whole app shares one connection.
// Pages that need the scanner just call useMqttScan() as before.
export { useMqttContext as useMqttScan } from './MqttContext'
