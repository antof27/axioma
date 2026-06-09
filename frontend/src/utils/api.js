const API_BASE = '/api';

export const isStaticMode = window.location.hostname.endsWith('github.io') || new URLSearchParams(window.location.search).get('static') === 'true';

let snapshotData = null;
let snapshotPromise = null;

function ensureSnapshotLoaded() {
  if (snapshotData) return Promise.resolve(snapshotData);
  if (!snapshotPromise) {
    snapshotPromise = fetch('db_snapshot.json')
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch db_snapshot.json: ${res.status}`);
        return res.json();
      })
      .then(data => {
        snapshotData = data;
        return data;
      })
      .catch(err => {
        console.error("Failed to load static database snapshot:", err);
        // Fallback structure
        snapshotData = { users: [], artists: [], artistDetails: {}, awards: {} };
        return snapshotData;
      });
  }
  return snapshotPromise;
}

async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

const rejectWrite = () => {
  return Promise.reject(new Error('Action disabled: Application is running in read-only showcase mode. Run locally to add, remove or rate entries.'));
};

export const api = {
  // Users
  getUsers: () => {
    if (isStaticMode) {
      return ensureSnapshotLoaded().then(data => data.users);
    }
    return fetch(`${API_BASE}/users`).then(handleResponse);
  },
  addUser: (name) => {
    if (isStaticMode) return rejectWrite();
    return fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    }).then(handleResponse);
  },
  deleteUser: (id) => {
    if (isStaticMode) return rejectWrite();
    return fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE'
    }).then(handleResponse);
  },

  // Artists
  getArtists: () => {
    if (isStaticMode) {
      return ensureSnapshotLoaded().then(data => data.artists);
    }
    return fetch(`${API_BASE}/artists`).then(handleResponse);
  },
  addArtist: (name) => {
    if (isStaticMode) return rejectWrite();
    return fetch(`${API_BASE}/artists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    }).then(handleResponse);
  },
  getArtistDetails: (id) => {
    if (isStaticMode) {
      return ensureSnapshotLoaded().then(data => data.artistDetails[id] || { name: 'Unknown', releases: [], members: [], upcoming_releases: [] });
    }
    return fetch(`${API_BASE}/artists/${id}`).then(handleResponse);
  },
  updateArtistNotes: (id, personal_notes) => {
    if (isStaticMode) return rejectWrite();
    return fetch(`${API_BASE}/artists/${id}/notes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personal_notes })
    }).then(handleResponse);
  },

  // Tracks & Scores
  saveScore: (track_id, user_id, score_value) => {
    if (isStaticMode) return rejectWrite();
    return fetch(`${API_BASE}/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track_id, user_id, score_value })
    }).then(handleResponse);
  },
  searchTracks: (q) => {
    if (isStaticMode) {
      if (!q || q.trim() === '') return Promise.resolve([]);
      return ensureSnapshotLoaded().then(data => {
        const queryVal = q.toLowerCase();
        const results = [];
        
        Object.values(data.artistDetails).forEach(detail => {
          detail.releases.forEach(rel => {
            rel.tracks.forEach(tr => {
              const matchesTrack = tr.title.toLowerCase().includes(queryVal);
              const matchesArtist = detail.name.toLowerCase().includes(queryVal);
              const matchesRelease = rel.title.toLowerCase().includes(queryVal);
              
              if (matchesTrack || matchesArtist || matchesRelease) {
                results.push({
                  id: tr.id,
                  track_title: tr.title,
                  release_title: rel.title,
                  artist_name: detail.name,
                  artwork_url: rel.artwork_url,
                  avg_score: tr.avg_score
                });
              }
            });
          });
        });
        
        return results.slice(0, 15);
      });
    }
    return fetch(`${API_BASE}/tracks/search?q=${encodeURIComponent(q)}`).then(handleResponse);
  },

  // Stats
  getUserStats: (userId) => {
    if (isStaticMode) {
      return ensureSnapshotLoaded().then(data => {
        const uId = parseInt(userId);
        let totalRated = 0;
        const allSongs = [];
        const albumScores = {}; 
        
        Object.values(data.artistDetails).forEach(detail => {
          detail.releases.forEach(rel => {
            let relSum = 0;
            let relCount = 0;
            rel.tracks.forEach(tr => {
              const score = tr.userScores?.[uId];
              if (score !== undefined && score !== null) {
                totalRated++;
                allSongs.push({
                  id: tr.id,
                  title: tr.title,
                  release_title: rel.title,
                  artist_name: detail.name,
                  score_value: score
                });
                relSum += score;
                relCount++;
              }
            });
            if (relCount > 0) {
              albumScores[rel.id] = {
                id: rel.id,
                title: rel.title,
                artwork_url: rel.artwork_url,
                artist_name: detail.name,
                user_avg: relSum / relCount
              };
            }
          });
        });
        
        allSongs.sort((a, b) => b.score_value - a.score_value || a.title.localeCompare(b.title));
        const topSongs = allSongs.slice(0, 5);
        
        let highestRatedAlbum = null;
        Object.values(albumScores).forEach(alb => {
          if (!highestRatedAlbum || alb.user_avg > highestRatedAlbum.user_avg) {
            highestRatedAlbum = alb;
          }
        });
        
        if (highestRatedAlbum) {
          highestRatedAlbum.user_avg = parseFloat(highestRatedAlbum.user_avg.toFixed(2));
        }
        
        return {
          highestRatedAlbum,
          highestRatedSongs: topSongs,
          totalRated
        };
      });
    }
    return fetch(`${API_BASE}/stats/${userId}`).then(handleResponse);
  },
  getArtistTierList: () => {
    if (isStaticMode) {
      return ensureSnapshotLoaded().then(data => {
        const list = data.artists;
        const tiers = { S: [], A: [], B: [], C: [], D: [], F: [], Unrated: [] };
        
        list.forEach(item => {
          if (item.catalog_avg === null) {
            tiers.Unrated.push({ id: item.id, name: item.name, rating: null });
          } else {
            const rating = parseFloat(item.catalog_avg.toFixed(2));
            const formattedItem = { id: item.id, name: item.name, rating };
            if (rating >= 9.0) tiers.S.push(formattedItem);
            else if (rating >= 8.0) tiers.A.push(formattedItem);
            else if (rating >= 7.0) tiers.B.push(formattedItem);
            else if (rating >= 6.0) tiers.C.push(formattedItem);
            else if (rating >= 5.0) tiers.D.push(formattedItem);
            else tiers.F.push(formattedItem);
          }
        });
        
        return tiers;
      });
    }
    return fetch(`${API_BASE}/artists/tier-list`).then(handleResponse);
  },

  // 2K Awards
  getTwoKAwards: () => {
    if (isStaticMode) {
      return ensureSnapshotLoaded().then(data => data.awards);
    }
    return fetch(`${API_BASE}/two-k-awards`).then(handleResponse);
  },
  nominateFinalist: (year, track_id) => {
    if (isStaticMode) return rejectWrite();
    return fetch(`${API_BASE}/two-k-awards/finalist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, track_id })
    }).then(handleResponse);
  },
  crownWinner: (id) => {
    if (isStaticMode) return rejectWrite();
    return fetch(`${API_BASE}/two-k-awards/${id}/winner`, {
      method: 'PUT'
    }).then(handleResponse);
  },
  removeFinalist: (id) => {
    if (isStaticMode) return rejectWrite();
    return fetch(`${API_BASE}/two-k-awards/finalist/${id}`, {
      method: 'DELETE'
    }).then(handleResponse);
  },
};
