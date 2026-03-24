'use server'

import { cookies } from 'next/headers'
import { API_BASE } from '../config'

export async function loginAction(username: string, password: string) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    
    if (res.ok) {
      const cookieStore = await cookies();
      const maxAge = 60 * 60 * 24 * 30; // 30 days — industry standard persistent session
      cookieStore.set('crm_token', data.token, { path: '/', maxAge });
      cookieStore.set('crm_role', data.user.role, { path: '/', maxAge });
      
      if (data.user.must_change_password) {
        cookieStore.set('crm_must_change', 'true', { path: '/', maxAge });
      } else {
        cookieStore.delete('crm_must_change');
      }
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

export async function changePasswordAction(token: string, currentPassword: string, newPassword: string) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
    const data = await res.json();
    if (res.ok) return { success: true };
    return { success: false, error: data.error || 'Failed to change password' };
  } catch {
    return { success: false, error: 'Network error. Is backend running?' };
  }
}

