const dummyUser = { id: 'u1', name: 'Dummy Admin', role: 'admin' };

export function useAuth() {
  return { user: dummyUser };
}
