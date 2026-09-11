import type { ResearchSession } from "@scout/schemas";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface ResearchListItem {
  researchId: string;
  status: ResearchSession["status"];
  request: string;
  chain?: string;
  category?: string;
  winner?: string;
  score?: number;
  confidence?: number;
  spent: number;
  createdAt: string;
  updatedAt: string;
  candidateCount: number;
}

export async function startResearch(body: {
  request: string;
  budget?: number;
  chain?: string;
  category?: string;
}, accessToken?: string | null): Promise<{ researchId: string; status: string }> {
  const res = await fetch(`${API_URL}/research`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to start research");
  return res.json();
}

export async function fetchSession(id: string): Promise<ResearchSession> {
  const res = await fetch(`${API_URL}/research/${id}`);
  if (!res.ok) throw new Error("Session not found");
  return res.json();
}

export async function fetchReports(status?: string): Promise<ResearchListItem[]> {
  const url = status ? `${API_URL}/research?status=${status}` : `${API_URL}/research`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch reports");
  const data = await res.json();
  return data.sessions;
}

export async function authorizePayment(id: string, accessToken?: string | null): Promise<ResearchSession> {
  const res = await fetch(`${API_URL}/research/${id}/authorize-payment`, {
    method: "POST",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  if (!res.ok) throw new Error("Payment authorization failed");
  return res.json();
}

export async function denyPayment(id: string, accessToken?: string | null): Promise<ResearchSession> {
  const res = await fetch(`${API_URL}/research/${id}/deny-payment`, {
    method: "POST",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  if (!res.ok) throw new Error("Failed to skip payment");
  return res.json();
}
