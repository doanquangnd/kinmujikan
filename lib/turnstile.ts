/**
 * Server-side verify Cloudflare Turnstile token.
 * POST https://challenges.cloudflare.com/turnstile/v0/siteverify
 */
interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
}

function is_localhost(req: { headers?: Record<string, string | string[] | undefined> }): boolean {
  const host = req.headers?.host;
  const origin = req.headers?.origin;
  const h = typeof host === 'string' ? host : (Array.isArray(host) ? host[0] : '');
  const o = typeof origin === 'string' ? origin : (Array.isArray(origin) ? origin[0] : '');
  return /^localhost(:\d+)?$/i.test(h) || /^127\.0\.0\.1(:\d+)?$/i.test(h) ||
    /^https?:\/\/localhost(:\d+)?/i.test(o) || /^https?:\/\/127\.0\.0\.1(:\d+)?/i.test(o);
}

export async function verify_turnstile(
  token: string,
  req: { headers?: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn('[Turnstile] TURNSTILE_SECRET_KEY chưa cấu hình, bỏ qua verify');
    return true;
  }
  if (is_localhost(req)) {
    return true;
  }
  if (!token || token.length > 2048) {
    return false;
  }

  const remoteip = req.socket?.remoteAddress || undefined;

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret,
        response: token,
        ...(remoteip && { remoteip }),
      }),
    });
    const data = (await res.json()) as TurnstileVerifyResponse;
    return data.success === true;
  } catch (err) {
    console.error('[Turnstile] Verify error:', err);
    return false;
  }
}
