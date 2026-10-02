/**
 * Cliente do catálogo público de livros (ver server/). Ler/baixar não exige
 * conta; publicar exige (o autor precisa ser identificável). O app continua
 * funcionando sem esse servidor — só o catálogo público fica indisponível.
 */
import { getToken } from "../auth/client";

export interface PublicBook {
  id: string;
  title: string;
  authorName: string;
  system: string;
  coverUrl: string;
  fileUrl: string;
  priceType: "gratuita" | "paga";
  priceValue: number;
  description: string;
  createdAt: string;
  ownerId: string;
}

export interface PublishBookInput {
  title: string;
  authorName?: string;
  system?: string;
  coverUrl?: string;
  fileUrl: string;
  priceType?: "gratuita" | "paga";
  priceValue?: number;
  description?: string;
  declaresOriginal: boolean;
}

const API_BASE = (import.meta.env?.VITE_API_BASE as string | undefined) || "http://localhost:4000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(options.headers as Record<string, string> | undefined) };
  if (token) headers.Authorization = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error("Não foi possível falar com o servidor. Ele está rodando (`npm run server`)?");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `Erro ${res.status}`);
  return body as T;
}

export interface ListBooksParams {
  q?: string;
  system?: string;
  priceType?: string;
  page?: number;
}

export async function listPublicBooks(params: ListBooksParams = {}): Promise<{ books: PublicBook[]; total: number; hasMore: boolean }> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== "") qs.set(k, String(v)); });
  return request(`/api/books?${qs.toString()}`);
}

export async function listMyPublishedBooks(): Promise<PublicBook[]> {
  const { books } = await request<{ books: PublicBook[] }>("/api/books/mine");
  return books;
}

export async function publishBook(input: PublishBookInput): Promise<PublicBook> {
  const { book } = await request<{ book: PublicBook }>("/api/books", { method: "POST", body: JSON.stringify(input) });
  return book;
}

export async function deletePublicBook(id: string): Promise<void> {
  await request(`/api/books/${id}`, { method: "DELETE" });
}
