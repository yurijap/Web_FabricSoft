type TeamAccount = { id: string; role: string | null };
type DirectoryPage<T> = { users: T[]; total: number };

// Source pages include Clerk identities that never belonged to the team.
// Collect assigned roles before paginating so hidden identities do not affect totals.
export async function loadTeamDirectory<T extends TeamAccount>(
  fetchPage: (offset: number) => Promise<DirectoryPage<T>>,
  isCurrent: () => boolean = () => true,
): Promise<T[]> {
  const members = new Map<string, T>();
  let offset = 0;
  while (isCurrent()) {
    const page = await fetchPage(offset);
    if (!isCurrent()) return [];
    if (!Array.isArray(page.users) || !Number.isInteger(page.total) || page.total < 0) {
      throw new Error('Invalid team directory page');
    }
    for (const user of page.users) {
      // Keep withdrawn or unverified members available for review and restoration.
      if (user.role === 'admin' || user.role === 'superadmin') members.set(user.id, user);
    }
    offset += page.users.length;
    if (!page.users.length || offset >= page.total) return [...members.values()];
  }
  return [];
}
