'use server'

import { cookies } from 'next/headers'

export async function loginAction(email: string, password: string) {
  try {
    const res = await fetch('http://localhost:8080/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    
    if (res.ok) {
      const cookieStore = await cookies();
      cookieStore.set('crm_token', data.token, { path: '/' });
      cookieStore.set('crm_role', data.user.role, { path: '/' });
      return { success: true };
    }
    return { success: false, error: data.error || "Login failed" };
  } catch (error) {
    return { success: false, error: "Network error. Is backend running?" };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('crm_token');
  cookieStore.delete('crm_role');
}
