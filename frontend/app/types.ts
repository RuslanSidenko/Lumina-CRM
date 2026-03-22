export interface Lead {
  id: number;
  name: string;
  phone: string;
  email: string;
  status: string;
  created_at?: string;
}

export interface Property {
  id: number;
  title: string;
  address: string;
  description: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  status: string;
  agent_id?: number;
  images: string[];
  created_at?: string;
}
export interface Interaction {
  id: number;
  lead_id: number;
  agent_id: number;
  type: 'call' | 'email' | 'meeting' | 'note';
  content: string;
  created_at: string;
}

export interface Task {
  id: number;
  lead_id?: number;
  property_id?: number;
  agent_id: number;
  title: string;
  description: string;
  due_at: string;
  status: 'pending' | 'completed';
  created_at: string;
}

export interface Deal {
  id: number;
  lead_id: number;
  property_id: number;
  agent_id: number;
  price: number;
  status: 'Offer' | 'Under Contract' | 'Escrow' | 'Closed' | 'Lost';
  close_date?: string;
  created_at: string;
}
