import { validatePlan } from './model'
import type { Plan } from './model'
const ITERATIONS = 310000
const encode = (bytes: Uint8Array) => btoa(Array.from(bytes, n => String.fromCharCode(n)).join(''))
function decode(value: unknown, size?: number): Uint8Array<ArrayBuffer> {
  if (typeof value !== 'string' || value.length > 750000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) throw new Error('Invalid file')
  const bytes = Uint8Array.from(atob(value), c => c.charCodeAt(0))
  if (size && bytes.length !== size) throw new Error('Invalid file')
  return bytes
}
async function keyFor(passphrase: string, salt: Uint8Array<ArrayBuffer>) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}
export async function encryptPlan(plan: Plan, passphrase: string): Promise<string> {
  if (passphrase.length < 12 || passphrase.length > 256) throw new Error('Use a passphrase between 12 and 256 characters.')
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await keyFor(passphrase, salt)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(validatePlan(plan))))
  return JSON.stringify({ format: 'untangle-private-plan', version: 1, cipher: 'AES-GCM', kdf: 'PBKDF2-SHA256', iterations: ITERATIONS, salt: encode(salt), iv: encode(iv), data: encode(new Uint8Array(ciphertext)) })
}
export async function decryptPlan(file: string, passphrase: string): Promise<Plan> {
  if (file.length > 1000000 || passphrase.length > 256) throw new Error('This file or passphrase is too large.')
  try {
    const e = JSON.parse(file)
    if (e.format !== 'untangle-private-plan' || e.version !== 1 || e.cipher !== 'AES-GCM' || e.kdf !== 'PBKDF2-SHA256' || e.iterations !== ITERATIONS) throw new Error('Invalid format')
    const salt = decode(e.salt, 16), iv = decode(e.iv, 12), data = decode(e.data)
    const key = await keyFor(passphrase, salt)
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
    return validatePlan(JSON.parse(new TextDecoder().decode(plaintext)))
  } catch { throw new Error('Could not open this plan. Check the passphrase and that this is an unmodified Untangle file.') }
}
