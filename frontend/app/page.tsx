import { cookies } from 'next/headers';
import LoginForm from './components/LoginForm';
import DashboardClient from '@/app/components/DashboardClient';
import { API_BASE } from './config';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('crm_token')?.value;
  const role = cookieStore.get('crm_role')?.value;

  if (!token) {
    return <LoginForm />;
  }

  // Fetch initial SSR Data
  let initialLeads = [];
  let initialProperties = [];

  try {
    const [leadsRes, propsRes] = await Promise.all([
      fetch(`${API_BASE}/api/v1/leads`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      }),
      fetch(`${API_BASE}/api/v1/properties`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      })
    ]);

    if (leadsRes.ok) initialLeads = await leadsRes.json();
    if (propsRes.ok) initialProperties = await propsRes.json();
  } catch (error) {
    console.error("Failed to fetch initial data", error);
  }

  return (
    <DashboardClient
      initialLeads={initialLeads}
      initialProperties={initialProperties}
      token={token}
      role={role || 'agent'}
    />
  );
}
