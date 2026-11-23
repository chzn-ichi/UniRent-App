import { API_URL } from "./config";

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setToken(t: string | null) {
  token = t;
}
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T = any>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(API_URL + "/api" + path, {
      method: options.method ?? (options.body ? "POST" : "GET"),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      // the server sent no JSON
    }

    if (!res.ok) {
      // An expired token logs the student out (a wrong password at login is not a logout)
      if (res.status === 401 && token && onUnauthorized) onUnauthorized();
      throw new ApiError(data?.error ?? "Something went wrong.", res.status);
    }
    return data as T;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    if (err?.name === "AbortError") {
      throw new ApiError(
        "The server took too long to answer. Check your Wi-Fi and try again.",
        0,
      );
    }
    throw new ApiError(
      "Can't reach the server. Check that your phone and laptop are on the same Wi-Fi.",
      0,
    );
  } finally {
    clearTimeout(timer);
  }
}
