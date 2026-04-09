import AsyncStorage from '@react-native-async-storage/async-storage'
import Toast from 'react-native-toast-message'

export interface QueuedOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  endpoint: string
  method: 'POST' | 'PUT' | 'DELETE'
  body?: any
  timestamp: number
}

const QUEUE_KEY = 'gash-offline-queue'

export class OfflineQueue {
  static async add(operation: Omit<QueuedOperation, 'id' | 'timestamp'>): Promise<string> {
    const id = `${Date.now()}-${Math.random()}`
    const queued: QueuedOperation = {
      ...operation,
      id,
      timestamp: Date.now(),
    }

    const existing = await this.getAll()
    const updated = [...existing, queued]
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated))

    console.log(`[OfflineQueue] Added operation: ${operation.type} ${operation.endpoint}`)
    return id
  }

  static async getAll(): Promise<QueuedOperation[]> {
    try {
      const data = await AsyncStorage.getItem(QUEUE_KEY)
      return data ? JSON.parse(data) : []
    } catch (err) {
      console.error('[OfflineQueue] Failed to get queue:', err)
      return []
    }
  }

  static async remove(id: string): Promise<void> {
    const operations = await this.getAll()
    const filtered = operations.filter((op) => op.id !== id)
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered))
    console.log(`[OfflineQueue] Removed operation: ${id}`)
  }

  static async clear(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY)
    console.log('[OfflineQueue] Cleared all operations')
  }

  static async processQueue(
    client: any,
    options?: {
      onProgress?: (completed: number, total: number) => void
      onError?: (op: QueuedOperation, error: Error) => void
    }
  ): Promise<{ success: number; failed: number }> {
    const operations = await this.getAll()
    if (operations.length === 0) {
      console.log('[OfflineQueue] Queue is empty')
      return { success: 0, failed: 0 }
    }

    let success = 0
    let failed = 0

    console.log(`[OfflineQueue] Processing ${operations.length} operations...`)

    for (let i = 0; i < operations.length; i++) {
      const op = operations[i]
      try {
        // Route to appropriate client method
        if (op.endpoint.includes('approaches')) {
          if (op.method === 'POST') {
            await client.approaches.create(op.body)
          } else if (op.method === 'PUT') {
            const id = op.endpoint.split('/').pop()
            await client.approaches.update(id, op.body)
          } else if (op.method === 'DELETE') {
            const id = op.endpoint.split('/').pop()
            await client.approaches.delete(id)
          }
        }

        await this.remove(op.id)
        success++
        options?.onProgress?.(i + 1, operations.length)
      } catch (err) {
        failed++
        const error = err instanceof Error ? err : new Error(String(err))
        options?.onError?.(op, error)
        console.error(`[OfflineQueue] Failed to process operation ${op.id}:`, error.message)
      }
    }

    Toast.show({
      type: 'success',
      text1: 'סינכרון הושלם',
      text2: `${success} פעולות עודכנו`,
    })

    console.log(`[OfflineQueue] Processing complete: ${success} success, ${failed} failed`)
    return { success, failed }
  }
}
