import { auth } from "../config/firebase";

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("No hay usuario autenticado");
  const idToken = await user.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${idToken}`,
  };
}

export async function syncWithBackend(idToken: string) {
  const res = await fetch(`${API_URL}/api/v1/auth/firebase-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token: idToken }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getPantry() {
  const res = await fetch(`${API_URL}/api/v1/pantry/`, {
    headers: await getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function addPantryItem(data: {
  ingrediente: string;
  cantidad: number;
  unidad: string;
  fecha_caducidad?: string;
}) {
  const res = await fetch(`${API_URL}/api/v1/pantry/`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deletePantryItem(id: string) {
  const res = await fetch(`${API_URL}/api/v1/pantry/${id}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
}