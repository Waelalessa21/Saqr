const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

type AuthResponse = {
  token: string;
  user: { id: number; name: string; email: string; role: string; created_at?: string | null };
};

type SignupPendingResponse = {
  email: string;
  message: string;
};

export async function apiSignup(body: {
  name: string;
  email: string;
  password: string;
  referral?: string | null;
}): Promise<SignupPendingResponse> {
  const res = await fetch(`${API}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || "حدث خطأ، حاول مرة أخرى");
  }
  return res.json();
}

export async function apiVerifyOtp(body: {
  email: string;
  code: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || "رمز التحقق غير صحيح");
  }
  return res.json();
}

export async function apiResendOtp(email: string): Promise<{ message: string }> {
  const res = await fetch(`${API}/api/auth/resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || "حدث خطأ، حاول مرة أخرى");
  }
  return res.json();
}

export async function apiLogin(body: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || "حدث خطأ، حاول مرة أخرى");
  }
  return res.json();
}

export async function apiGetMe(token: string): Promise<AuthResponse["user"]> {
  const res = await fetch(`${API}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("unauthorized");
  return res.json();
}

export function saveToken(token: string) {
  localStorage.setItem("saqr_token", token);
}

export function getToken(): string | null {
  return localStorage.getItem("saqr_token");
}

export function saveUser(user: AuthResponse["user"]) {
  localStorage.setItem("saqr_user", JSON.stringify(user));
}

export function getUser(): AuthResponse["user"] | null {
  const raw = localStorage.getItem("saqr_user");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function clearAuth() {
  localStorage.removeItem("saqr_token");
  localStorage.removeItem("saqr_user");
}

export type GameSession = {
  game_id: number;
  categories: number[];
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  turn: number;
  answered: string[];
  results: Record<string, "correct" | "wrong">;
  used_power_ups: [string[], string[]];
};

export type GameEntry = {
  action: "none" | "new" | "resume";
  game_id?: number;
  game_title?: string;
  game_number?: number;
  total_games?: number;
  completed_games?: number;
  all_completed?: boolean;
  session?: GameSession;
};

type PublishedGame = { id: number; title: string };

export function sortPublishedGames(games: PublishedGame[]): PublishedGame[] {
  return [...games].sort((a, b) => a.id - b.id);
}

async function fetchGameEntryFallback(token: string): Promise<GameEntry> {
  const [publishedRes, resultsRes] = await Promise.all([
    fetch(`${API}/api/games/published`),
    fetch(`${API}/api/games/my/results`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  ]);
  const published = sortPublishedGames(await publishedRes.json());
  if (published.length === 0) return { action: "none", total_games: 0 };

  const results = resultsRes.ok ? await resultsRes.json() : [];
  const completed = new Set<number>(
    results
      .map((r: { game_id: number }) => r.game_id)
      .filter((id: number) => id > 0),
  );
  const next = published.find((g) => !completed.has(g.id)) ?? published[0];
  const gameNumber = published.findIndex((g) => g.id === next.id) + 1;

  return {
    action: "new",
    game_id: next.id,
    game_title: next.title,
    game_number: gameNumber,
    total_games: published.length,
    completed_games: completed.size,
    all_completed: published.every((g) => completed.has(g.id)),
  };
}

export async function fetchGameEntry(token: string): Promise<GameEntry> {
  const res = await fetch(`${API}/api/games/my/entry`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.ok) return res.json();
  if (res.status === 404 || res.status === 405) {
    return fetchGameEntryFallback(token);
  }
  throw new Error("entry failed");
}

export async function saveGameSession(token: string, body: GameSession): Promise<void> {
  await fetch(`${API}/api/games/my/session`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

export async function clearGameSession(token: string): Promise<void> {
  await fetch(`${API}/api/games/my/session`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}
