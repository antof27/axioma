const API_BASE = '/api';

async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export const api = {
  // Users
  getUsers: () => fetch(`${API_BASE}/users`).then(handleResponse),
  addUser: (name) => fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  }).then(handleResponse),
  deleteUser: (id) => fetch(`${API_BASE}/users/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),

  // Artists
  getArtists: () => fetch(`${API_BASE}/artists`).then(handleResponse),
  addArtist: (name) => fetch(`${API_BASE}/artists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  }).then(handleResponse),
  getArtistDetails: (id) => fetch(`${API_BASE}/artists/${id}`).then(handleResponse),
  updateArtistNotes: (id, personal_notes) => fetch(`${API_BASE}/artists/${id}/notes`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ personal_notes })
  }).then(handleResponse),

  // Tracks & Scores
  saveScore: (track_id, user_id, score_value) => fetch(`${API_BASE}/scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ track_id, user_id, score_value })
  }).then(handleResponse),
  searchTracks: (q) => fetch(`${API_BASE}/tracks/search?q=${encodeURIComponent(q)}`).then(handleResponse),

  // Stats
  getUserStats: (userId) => fetch(`${API_BASE}/stats/${userId}`).then(handleResponse),
  getArtistTierList: () => fetch(`${API_BASE}/artists/tier-list`).then(handleResponse),

  // 2K Awards
  getTwoKAwards: () => fetch(`${API_BASE}/two-k-awards`).then(handleResponse),
  nominateFinalist: (year, track_id) => fetch(`${API_BASE}/two-k-awards/finalist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ year, track_id })
  }).then(handleResponse),
  crownWinner: (id) => fetch(`${API_BASE}/two-k-awards/${id}/winner`, {
    method: 'PUT'
  }).then(handleResponse),
  removeFinalist: (id) => fetch(`${API_BASE}/two-k-awards/finalist/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),
};
