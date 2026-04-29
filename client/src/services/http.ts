const TOKEN_KEY = "skycast_token";
export const authToken = {
    get(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    },
    set(token: string | null): void {
        if (token)
            localStorage.setItem(TOKEN_KEY, token);
        else
            localStorage.removeItem(TOKEN_KEY);
    },
};
export async function requestJson<T>(path: string, opts: RequestInit = {}): Promise<T> {
    const headers = new Headers(opts.headers || {});
    headers.set("Content-Type", "application/json");
    const token = authToken.get();
    if (token)
        headers.set("Authorization", `Bearer ${token}`);
    const res = await fetch(path, { ...opts, headers });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok)
        throw new Error(data.error || `Request failed (${res.status})`);
    return data as T;
}
