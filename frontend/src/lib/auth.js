const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

export function getToken() {
  return getCookie("mwt_token");
}

export function setAuthSession(token, user, remember = false) {
  if (typeof document === "undefined") return;
  const maxAge = remember ? 60 * 60 * 24 * 7 : undefined; // 7 días
  const cookie = [`mwt_token=${encodeURIComponent(token)}`, "Path=/", "SameSite=Lax"];
  if (maxAge) cookie.push(`Max-Age=${maxAge}`);
  document.cookie = cookie.join("; ");

  if (user) localStorage.setItem("mwt_user", JSON.stringify(user));
}

export function clearAuthSession() {
  if (typeof document === "undefined") return;
  document.cookie = "mwt_token=; Path=/; Max-Age=0; SameSite=Lax";
  localStorage.removeItem("mwt_user");
}

export async function loginRequest({ username, password }) {
  const endpoints = ["/api/auth/login"];

  let lastError = "No se pudo iniciar sesión.";
  for (const path of endpoints) {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        usuario: username,
        email: username,
        password,
      }),
    });

    if (res.status === 404) continue;

    let data = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) {
      lastError = data?.message || "Credenciales inválidas.";
      throw new Error(lastError);
    }

    const token =
      data?.token ||
      data?.accessToken ||
      data?.jwt ||
      data?.data?.token ||
      data?.data?.accessToken;

    if (!token) {
      throw new Error("El backend respondió sin token.");
    }

    const user = data?.user || data?.usuario || data?.data?.user || data?.data?.usuario || null;
    const roles = data?.roles || data?.data?.roles || user?.roles || null;

    // Asegurar que el rol(es) queden dentro del objeto de usuario para el RBAC.
    if (user && roles && !user.roles) user.roles = roles;

    return { token, user };
  }

  throw new Error(lastError);
}

export async function registerRequest(payload) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    throw new Error(data?.message || "No se pudo crear la cuenta.");
  }

  return data;
}

export async function getMe() {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok) {
    throw new Error(data?.message || "No se pudo obtener el perfil.");
  }
  return data;
}

export async function updateProfile(payload) {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/auth/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok) {
    throw new Error(data?.message || "No se pudo actualizar el perfil.");
  }
  // Refrescar el usuario guardado para mantener el RBAC actualizado
  const current = JSON.parse(localStorage.getItem("mwt_user") || "null");
  if (current) {
    localStorage.setItem(
      "mwt_user",
      JSON.stringify({ ...current, nombre: data.nombre ?? current.nombre, apellido: data.apellido ?? current.apellido })
    );
  }
  return data;
}