export function getToken(): string | null {
  return localStorage.getItem('authToken');
}

export function setToken(token: string): void {
  localStorage.setItem('authToken', token);
}

export function removeToken(): void {
  localStorage.removeItem('authToken');
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  
  try {
    // Verificar se o token não está expirado
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}
