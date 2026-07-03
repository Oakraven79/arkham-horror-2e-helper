interface ControllerCrypto {
  getRandomValues?: (array: Uint8Array) => Uint8Array
  randomUUID?: () => string
}

let fallbackSequence = 0

function uuidFromRandomBytes(source: ControllerCrypto) {
  const bytes = new Uint8Array(16)
  source.getRandomValues!(bytes)

  // RFC 4122 version 4 and variant bits.
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, '0'))
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10).join(''),
  ].join('-')
}

export function createControllerCommandID(
  source: ControllerCrypto | undefined = globalThis.crypto,
) {
  if (typeof source?.randomUUID === 'function') {
    return source.randomUUID()
  }

  if (typeof source?.getRandomValues === 'function') {
    return uuidFromRandomBytes(source)
  }

  // Idempotency keys are not secrets. This final fallback keeps commands usable
  // in older browsers that expose neither Web Crypto method.
  fallbackSequence += 1
  return [
    'command',
    Date.now().toString(36),
    fallbackSequence.toString(36),
    Math.random().toString(36).slice(2),
  ].join('-')
}
