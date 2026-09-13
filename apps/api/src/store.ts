import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  ResearchSessionSchema,
  type DecisionLogEntry,
  type ResearchSession,
} from "@scout/schemas";
import verifiedSessionData from "./verified-session.json" with { type: "json" };

const DATA_DIR = join(process.cwd(), ".scout-data");
const SESSIONS_FILE = join(DATA_DIR, "sessions.json");

type SessionStore = Record<string, ResearchSession>;

const verifiedSession = ResearchSessionSchema.parse(verifiedSessionData);
const VERIFIED_SESSIONS: SessionStore = {
  [verifiedSession.researchId]: verifiedSession,
};

let cachedStore: SessionStore | null = null;

function loadStore(): SessionStore {
  if (cachedStore) return cachedStore;
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(SESSIONS_FILE)) {
    cachedStore = { ...VERIFIED_SESSIONS };
    return cachedStore;
  }
  try {
    cachedStore = {
      ...VERIFIED_SESSIONS,
      ...(JSON.parse(readFileSync(SESSIONS_FILE, "utf8")) as SessionStore),
    };
  } catch {
    cachedStore = { ...VERIFIED_SESSIONS };
  }
  return cachedStore;
}

function saveStore(store: SessionStore): void {
  cachedStore = store;
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(SESSIONS_FILE, JSON.stringify(store, null, 2), "utf8");
}

export function saveSession(session: ResearchSession): void {
  const store = loadStore();
  store[session.researchId] = session;
  saveStore(store);
}

export function getSession(researchId: string): ResearchSession | null {
  const store = loadStore();
  return store[researchId] ?? null;
}

export function listSessions(filter?: { status?: ResearchSession["status"] }): ResearchSession[] {
  const store = loadStore();
  let sessions = Object.values(store);
  if (filter?.status) {
    sessions = sessions.filter((s) => s.status === filter.status);
  }
  return sessions.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

const liveStreams = new Map<string, Set<(entry: DecisionLogEntry) => void>>();

export function subscribeToLogs(
  researchId: string,
  callback: (entry: DecisionLogEntry) => void,
): () => void {
  if (!liveStreams.has(researchId)) {
    liveStreams.set(researchId, new Set());
  }
  liveStreams.get(researchId)!.add(callback);
  return () => liveStreams.get(researchId)?.delete(callback);
}

export function emitLog(researchId: string, entry: DecisionLogEntry): void {
  liveStreams.get(researchId)?.forEach((cb) => cb(entry));
}
