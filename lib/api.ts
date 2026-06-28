import { API_BASE_URL, CHATBOT_API_URL } from './config';
import { supabase } from './supabase/client';

export interface ApiOptions extends RequestInit {
  useChatbot?: boolean;
  returnRaw?: boolean;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T & { ok: boolean; status: number; json: () => Promise<T>; text: () => Promise<string> }> {
  const { useChatbot, returnRaw, ...initOptions } = options;
  const baseUrl = useChatbot ? CHATBOT_API_URL : API_BASE_URL;

  let url = endpoint;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    url = `${baseUrl}${formattedEndpoint}`;
  }

  const headers = initOptions.headers ? { ...initOptions.headers } as Record<string, string> : {};

  // Attach Supabase access token automatically if present
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);
    if (token && !headers['Authorization'] && !headers['authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn('[API] Failed to get Supabase session token:', err);
  }

  // Auto set Content-Type to application/json for non-FormData bodies
  if (initOptions.body && !(initOptions.body instanceof FormData)) {
    if (!headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json';
    }
  }

  const finalOptions: RequestInit = {
    ...initOptions,
    headers,
  };

  const response = await fetch(url, finalOptions);

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      const text = await response.text();
      if (text) errorMessage = text;
    }

    const error: any = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  if (returnRaw) {
    return response as any;
  }

  // Handle empty or non-JSON responses
  const contentType = response.headers.get('content-type');
  let data: any = {};
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  // Create a Proxy that mimics both the parsed JSON data AND the Response object!
  const proxy = new Proxy(data, {
    get(target, prop, receiver) {
      if (prop === 'ok') return response.ok;
      if (prop === 'status') return response.status;
      if (prop === 'headers') return response.headers;
      if (prop === 'json') return async () => target;
      if (prop === 'text') return async () => JSON.stringify(target);
      return Reflect.get(target, prop, receiver);
    }
  });

  return proxy as any;
}
