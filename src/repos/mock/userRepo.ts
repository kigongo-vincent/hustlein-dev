import type { User } from "../../types";

/** Profile picture URLs for sample users (Pexels) */
const SAMPLE_AVATARS: Record<string, string> = {
  u0: "https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=200",
  u1: "https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=200",
  u2: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200",
  u3: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200",
  u4: "https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=200",
  u5: "https://images.pexels.com/photos/712513/pexels-photo-712513.jpeg?auto=compress&cs=tinysrgb&w=200",
};

/** Test accounts for all user roles (password not required for demo login) */
const data: User[] = [
  {
    id: "u0",
    email: "super@acme.com",
    name: "Super Admin",
    role: "super_admin",
    companyId: "c1",
    avatarUrl: SAMPLE_AVATARS.u0,
    lastSeen: "online",
  },
  {
    id: "u1",
    email: "admin@acme.com",
    name: "Admin User",
    role: "company_admin",
    companyId: "c1",
    avatarUrl: SAMPLE_AVATARS.u1,
    lastSeen: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: "u2",
    email: "lead@acme.com",
    name: "Jane Lead",
    role: "project_lead",
    companyId: "c1",
    avatarUrl: SAMPLE_AVATARS.u2,
    lastSeen: "online",
  },
  {
    id: "u3",
    email: "consultant@acme.com",
    name: "Bob Consultant",
    role: "consultant",
    companyId: "c1",
    lastSeen: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "u4",
    email: "alice@acme.com",
    name: "Alice Dev",
    role: "consultant",
    companyId: "c1",
    lastSeen: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
];

/** Default store user (company admin) for demo */
export const defaultCompanyAdmin: User = data[1];

export const userRepo = {
  async getAll(): Promise<User[]> {
    return Promise.resolve([...data]);
  },
  async getById(id: string): Promise<User | null> {
    return Promise.resolve(data.find((u) => u.id === id) ?? null);
  },
  async getByCompany(companyId: string): Promise<User[]> {
    return Promise.resolve(data.filter((u) => u.companyId === companyId));
  },
  async getByEmail(email: string): Promise<User | null> {
    return Promise.resolve(data.find((u) => u.email === email) ?? null);
  },
  async create(user: Omit<User, "id">): Promise<User> {
    const next: User = { ...user, id: `u${Date.now()}` };
    data.push(next);
    return Promise.resolve(next);
  },
  async update(id: string, patch: Partial<User>): Promise<User | null> {
    const i = data.findIndex((u) => u.id === id);
    if (i === -1) return Promise.resolve(null);
    data[i] = { ...data[i], ...patch };
    return Promise.resolve(data[i]);
  },
  async delete(id: string): Promise<boolean> {
    const i = data.findIndex((u) => u.id === id);
    if (i === -1) return Promise.resolve(false);
    data.splice(i, 1);
    return Promise.resolve(true);
  },
};
