/**
 * Server-side MQTT publish helper.
 * Connects via plain TCP (port 1883) — works from Node.js API routes.
 * The frontend uses WSS (port 8884) which is browser-only.
 *
 * Uses the same `mqtt` npm package already in the project.
 */
import mqtt from 'mqtt'

const BROKER_TCP = 'mqtt://broker.hivemq.com:1883'

export async function mqttPublish(topic: string, payload: string): Promise<void> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn('[mqtt-publish] timeout waiting for publish:', topic)
      try { client.end(true) } catch {}
      resolve()
    }, 5000)

    const client = mqtt.connect(BROKER_TCP, {
      clientId: 'web_server_' + Math.random().toString(16).slice(2, 8),
      clean: true,
      connectTimeout: 4000,
    })

    client.on('connect', () => {
      client.publish(topic, payload, { qos: 1 }, (err) => {
        clearTimeout(timeout)
        if (err) console.warn('[mqtt-publish] publish error:', err)
        client.end()
        resolve()
      })
    })

    client.on('error', (err) => {
      clearTimeout(timeout)
      console.warn('[mqtt-publish] connection error:', err.message)
      try { client.end(true) } catch {}
      resolve() // non-fatal — payment already processed
    })
  })
}
