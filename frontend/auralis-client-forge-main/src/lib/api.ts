// Auralis API client — all requests use VITE_API_URL. No hardcoded hosts.

const RAW_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
export const API_BASE = RAW_BASE.replace(/\/$/, "");

const TOKEN_KEY = "auralis_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string | null) {
  if (typeof window === "undefined") return;
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

type Options = {
  method?: string;
  body?: unknown;
  form?: FormData;
  auth?: boolean;
  signal?: AbortSignal;
};

export async function api<T = unknown>(path: string, opts: Options = {}): Promise<T> {
  if (!API_BASE) {
    throw new ApiError(
      "API is not configured. Set VITE_API_URL to your backend URL.",
      0,
    );
  }

  const headers: Record<string, string> = {};
  const auth = opts.auth !== false;
  if (auth) {
    const t = getToken();
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }

  let body: BodyInit | undefined;
  if (opts.form) {
    body = opts.form;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: opts.method ?? "GET",
      headers,
      body,
      signal: opts.signal,
      credentials: "include",
    });
  } catch (e) {
    throw new ApiError(
      "Couldn't reach the server. Check your connection and try again.",
      0,
    );
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : null) ??
      (data && typeof data === "object" && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : null) ??
      `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, data);
  }
  return data as T;
}

// Domain types ---------------------------------------------------------------

export type User = {
  id: string;
  username: string;
  email?: string;
  bio?: string | null;
  avatar_url?: string | null;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  is_following?: boolean;
};

export type Post = {
  id: string;
  user: User;
  content: string;
  captions?: string;
  image_url?: string | null;
  created_at: string;
  like_count: number;
  comment_count: number;
  liked_by_me?: boolean;
};

export type Comment = {
  id: string;
  user: User;
  content: string;
  created_at: string;
};

export type Notification = {
  id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
  actor?: User;
};
