// Firma di JWT con WebCrypto (ES256 per Apple, RS256 per Google).
const b64url = (data: ArrayBuffer | Uint8Array | string) => {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

function pemToDer(pem: string): ArrayBuffer {
  const body = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const raw = atob(body);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out.buffer;
}

export async function signJwt(
  alg: 'ES256' | 'RS256',
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
  pemPrivateKey: string,
): Promise<string> {
  const algo = alg === 'ES256' ? { name: 'ECDSA', namedCurve: 'P-256' } : { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' };
  const key = await crypto.subtle.importKey('pkcs8', pemToDer(pemPrivateKey), algo, false, ['sign']);
  const input = `${b64url(JSON.stringify({ alg, typ: 'JWT', ...header }))}.${b64url(JSON.stringify(payload))}`;
  const sig = await crypto.subtle.sign(
    alg === 'ES256' ? { name: 'ECDSA', hash: 'SHA-256' } : { name: 'RSASSA-PKCS1-v1_5' },
    key,
    new TextEncoder().encode(input),
  );
  // WebCrypto restituisce già la firma ECDSA nel formato r||s richiesto da JWS.
  return `${input}.${b64url(sig)}`;
}

/** Legge il payload di un JWS senza verificarlo (usare solo su dati ottenuti direttamente dalle API dello store). */
export function decodeJws<T>(jws: string): T {
  const part = jws.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/');
  const padded = part + '='.repeat((4 - (part.length % 4)) % 4);
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(padded), (c) => c.charCodeAt(0)))) as T;
}
