import { createClerkClient } from '@clerk/clerk-sdk-node';

// The secret never leaves the server. No client-controlled role claims are trusted.
export function createIdentityProvider(secretKey) {
  const client = createClerkClient({ secretKey });
  async function request(path, { method = 'GET', body } = {}) {
    const response = await fetch(`https://api.clerk.com/v1${path}`, {
      method,
      headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      // Never propagate provider responses, credentials or invitation tickets to the browser/logs.
      const error = new Error('No se pudo completar la operación con el proveedor de identidad.');
      error.status = response.status === 404 ? 404 : response.status === 422 || response.status === 409 ? 409 : 503;
      throw error;
    }
    return response.json();
  }
  return {
    verifyToken: (token, authorizedParties) => client.verifyToken(token, { authorizedParties }),
    getUser: id => request(`/users/${encodeURIComponent(id)}`),
    deleteUser: id => request(`/users/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    getSession: id => request(`/sessions/${encodeURIComponent(id)}`),
    listUsers: (limit, offset, query = '') => request(`/users?${new URLSearchParams({ limit: String(limit), offset: String(offset), order_by: '-created_at', ...(query ? { query } : {}) })}`),
    countUsers: (query = '') => request(`/users/count${query ? `?${new URLSearchParams({ query })}` : ''}`),
    listInvitations: (limit, offset) => request(`/invitations?status=pending&limit=${limit}&offset=${offset}`),
    listAcceptedInvitations: (email, limit, offset) => request(`/invitations?${new URLSearchParams({ status: 'accepted', query: email, limit: String(limit), offset: String(offset), order_by: '-created_at' })}`),
    invite: body => request('/invitations', { method: 'POST', body }),
    revokeInvitation: id => request(`/invitations/${encodeURIComponent(id)}/revoke`, { method: 'POST' }),
    setAccess: (id, access) => request(`/users/${encodeURIComponent(id)}/metadata`, {
      method: 'PATCH', body: { private_metadata: { fabricAccess: access } },
    }),
    setInvitationAccess: (id, access) => request(`/users/${encodeURIComponent(id)}/metadata`, {
      method: 'PATCH', body: { private_metadata: { fabricInvitationAccess: access } },
    }),
  };
}
