import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16
const TAG_LENGTH = 16
const KEY_LENGTH = 32

function getMasterKey(): Buffer {
  const key = process.env.MASTER_ENCRYPTION_KEY

  if (!key) {
    throw new Error("MASTER_ENCRYPTION_KEY is not set")
  }

  // Convert to exactly 32 bytes
  return Buffer.from(key.padEnd(KEY_LENGTH).slice(0, KEY_LENGTH))
}

export function encryptKey(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const masterKey = getMasterKey()

  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv)

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final()
  ])

  const tag = cipher.getAuthTag()

  // Store as: iv:tag:encrypted (all hex)
  return [
    iv.toString("hex"),
    tag.toString("hex"),
    encrypted.toString("hex")
  ].join(":")
}

export function decryptKey(ciphertext: string): string {
  const [ivHex, tagHex, encryptedHex] = ciphertext.split(":")

  if (!ivHex || !tagHex || !encryptedHex) {
    throw new Error("Invalid ciphertext format")
  }

  const iv = Buffer.from(ivHex, "hex")
  const tag = Buffer.from(tagHex, "hex")
  const encrypted = Buffer.from(encryptedHex, "hex")
  const masterKey = getMasterKey()

  const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv)
  decipher.setAuthTag(tag)

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ])

  return decrypted.toString("utf8")
}

export function validateKeyFormat(
  provider: string, 
  key: string
): boolean {
  const patterns: Record<string, RegExp> = {
    openai: /^sk-[a-zA-Z0-9]{32,}$/,
    anthropic: /^sk-ant-[a-zA-Z0-9-]{32,}$/,
    groq: /^gsk_[a-zA-Z0-9]{32,}$/,
    gemini: /^AIza[a-zA-Z0-9-_]{32,}$/,
    mistral: /^[a-zA-Z0-9]{32,}$/,
  }

  const pattern = patterns[provider.toLowerCase()]
  if (!pattern) return true // Unknown provider, skip validation
  return pattern.test(key)
}