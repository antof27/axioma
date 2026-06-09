import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { query, initDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve static assets from public folder (where Vite will build the production files)
app.use(express.static(path.join(__dirname, 'public')));

// PREDEFINED ARTISTS DATABASE FOR THE MOCK SCRAPER
const predefinedArtists = {
  meshuggah: {
    name: 'Meshuggah',
    origin: 'Umeå, Sweden',
    bio: 'Meshuggah is a Swedish extreme metal band formed in Umeå in 1987. Known for their complex polyrhythmic structures, angular guitar work, and heavy syncopated riffs, they are widely regarded as the primary inspiration for the "djent" subgenre.',
    members: ['Jens Kidman', 'Fredrik Thordendal', 'Tomas Haake', 'Mårten Hagström', 'Dick Lövgren'],
    upcoming: ['European Arena Tour late 2026', 'Remastering early catalog items'],
    notes: 'The undisputed gods of polyrhythmic metal. Tomas Haake is arguably the most influential metal drummer of the last 30 years.',
    releases: [
      {
        title: 'obZen',
        type: 'album',
        release_year: 2008,
        artwork_url: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=500&auto=format&fit=crop&q=60',
        tracks: [
          { title: 'Combustion', duration: 249, lyrics: 'Fast forward the collapse. Burning through the gears. A perfect alignment of speed and calculation.' },
          { title: 'Bleed', duration: 442, lyrics: 'Omne primum cognitio. The horror of repetitive patterns. Blood flows in syncopated rhythms. Running down my spine. The heartbeat slows.' },
          { title: 'obZen', duration: 264, lyrics: 'A state of absolute peace through complete chaos. The balance of dissonance.' },
          { title: 'Pravus', duration: 310, lyrics: 'Dark structures built from heavy strings. We crawl inside the geometry.' }
        ]
      },
      {
        title: 'Immutable',
        type: 'album',
        release_year: 2022,
        artwork_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60',
        tracks: [
          { title: 'Broken Cog', duration: 335, lyrics: 'A quiet whisper before the engine turns. We are but teeth in a giant wheel.' },
          { title: 'The Abysmal Eye', duration: 295, lyrics: 'Looking into the void, the void looks back. We stare with wide, unblinking eyes.' }
        ]
      }
    ]
  },
  periphery: {
    name: 'Periphery',
    origin: 'Bethesda, Maryland, USA',
    bio: 'Periphery is an American progressive metal band formed in 2005. They are pioneers of the djent movement within progressive metal, known for their three-guitar setup, intricate polyphonic structures, and Spencer Sotelo\'s wide vocal range (shifting from soaring cleans to extreme screams).',
    members: ['Misha Mansoor', 'Spencer Sotelo', 'Jake Bowen', 'Matt Halpern', 'Mark Holcomb'],
    upcoming: ['Currently writing material for Periphery VI', 'Summer US Headliner tour'],
    notes: 'Excellent mixing of melodic pop hooks with extreme mechanical metal. Mark Holcomb\'s riffs are incredibly creative.',
    releases: [
      {
        title: 'Periphery II: This Time It\'s Personal',
        type: 'album',
        release_year: 2012,
        artwork_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=60',
        tracks: [
          { title: 'Muramasa', duration: 171, lyrics: 'We are the ones who make the world spin. We are the architects.' },
          { title: 'Have a Blast', duration: 355, lyrics: 'A violin intro giving way to blazing speed. Write your thoughts on the wind.' },
          { title: 'Scarlet', duration: 300, lyrics: 'Soaring clean hooks. Under the red sun we bleed. A memory of what we used to be.' },
          { title: 'Ragnarok', duration: 395, lyrics: 'The end of days. Heavy grooves, emotional bridge. Somewhere in time, we will meet again.' }
        ]
      },
      {
        title: 'Periphery V: Djent Is Not a Genre',
        type: 'album',
        release_year: 2023,
        artwork_url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=60',
        tracks: [
          { title: 'Wildfire', duration: 426, lyrics: 'Chaos in the streets. A jazzy piano break in the middle of absolute metal madness.' },
          { title: 'Atropos', duration: 503, lyrics: 'A cinematic journey. Glitch electronics fading into heavy syncopations.' },
          { title: 'Wax Wings', duration: 446, lyrics: 'Machines of gold. Soaring high, melting down. "The machines are calling me!"' }
        ]
      }
    ]
  },
  tesseract: {
    name: 'TesseracT',
    origin: 'Milton Keynes, England',
    bio: 'TesseracT is a British progressive metal band formed in 2003. They are widely regarded as one of the key bands that defined the sound of modern progressive metal and djent, focusing heavily on shifting atmospheres, clean polyrhythmic guitar lines, and emotional, soaring vocals.',
    members: ['Acle Kahney', 'Daniel Tompkins', 'Amos Williams', 'James Monteith', 'Jay Postones'],
    upcoming: ['War of Being World Tour Part II', 'Releasing acoustic versions EP'],
    notes: 'Incredible atmospheric depth. Daniel Tompkins\' clean high range is phenomenal, especially on the album Altered State (originally sung by Ashe O\'Hara) and War of Being.',
    releases: [
      {
        title: 'Altered State',
        type: 'album',
        release_year: 2013,
        artwork_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60',
        tracks: [
          { title: 'Of Matter - Proxy', duration: 244, lyrics: 'A silent plea. Do you remember when the light shone bright? We became proxies of our dreams.' },
          { title: 'Of Matter - Retrospect', duration: 332, lyrics: 'Looking back at the path. We built these walls to keep the outside out.' },
          { title: 'Of Mind - Nocturne', duration: 350, lyrics: 'Wake me up. Wake me up from this dream. The night is calling.' }
        ]
      },
      {
        title: 'War of Being',
        type: 'album',
        release_year: 2023,
        artwork_url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&auto=format&fit=crop&q=60',
        tracks: [
          { title: 'Natural Disaster', duration: 366, lyrics: 'Destruction in our wake. The ground shakes, the skies split open.' },
          { title: 'War of Being', duration: 677, lyrics: 'The title track masterpiece. An 11-minute journey through the ego, identity, and consciousness.' }
        ]
      }
    ]
  },
  sleeptoken: {
    name: 'Sleep Token',
    origin: 'London, England',
    bio: 'Sleep Token is a British alternative rock/metal band formed in London in 2016. The group is an anonymous, masked collective fronted by a lead vocalist known as "Vessel". Their music blends heavy progressive metal, ambient soundscapes, indie pop, and electronic R&B.',
    members: ['Vessel', 'II', 'III', 'IV'],
    upcoming: ['Sold-out UK/US Arena tour in winter 2026', 'Preparing next studio installment'],
    notes: 'Incredible emotional writing. Blending pop hooks with massive heavy breakdowns. Vessel\'s vocals are top tier.',
    releases: [
      {
        title: 'Take Me Back to Eden',
        type: 'album',
        release_year: 2023,
        artwork_url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500&auto=format&fit=crop&q=60',
        tracks: [
          { title: 'Chokehold', duration: 304, lyrics: 'You\'ve got me in a chokehold. I\'ve got a feeling you won\'t let go.' },
          { title: 'The Summoning', duration: 395, lyrics: 'Raise me up. A massive heavy djent groove that transitions into a 70s funk outro in the last 2 minutes.' },
          { title: 'Granite', duration: 225, lyrics: 'Sulfur on your breath. Heavy R&B beats with metal drops.' },
          { title: 'Ascensionism', duration: 431, lyrics: 'You make me wish I could disappear. Lip gloss on the collar. A beautiful piano rap turning into a heavy wall of sound.' }
        ]
      }
    ]
  }
};

// PROCEDURAL METAL METADATA GENERATOR
function generateProceduralArtist(name) {
  const cities = ['Gothenburg, Sweden', 'Helsinki, Finland', 'Austin, Texas, USA', 'Melbourne, Australia', 'Berlin, Germany', 'Tokyo, Japan', 'Oslo, Norway'];
  const themes = ['cosmic void', 'neural geometry', 'shattered illusions', 'fractal structures', 'infinite depth', 'digital decay', 'human echoes'];
  const genres = ['ambient math-metal', 'post-progressive metalcore', 'polyrythmic fusion', 'ethereal djent', 'cinematic post-rock'];
  const unsplashArt = [
    'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1604871000636-074fa5117945?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500&auto=format&fit=crop&q=60'
  ];

  const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
  
  const origin = randomItem(cities);
  const theme1 = randomItem(themes);
  let theme2 = randomItem(themes);
  while (theme1 === theme2) { theme2 = randomItem(themes); }
  
  const genre = randomItem(genres);
  const bio = `${name} is a progressive project hailing from ${origin}. Blending ${genre} with complex time signatures and emotional, ambient passages, the project explores the interplay between ${theme1} and ${theme2}. A signature sound composed of syncopated rhythms, lush synthesis, and intricate instrumentation.`;
  
  // Swedish/English style metal musician names
  const membersPool = ['Erik Lindqvist', 'Anders Sjöberg', 'Jesper Nilsson', 'Marcus Thorn', 'William Vane', 'Thomas Thorne', 'Soren Hald', 'Nils Larsson', 'Arthur Pendelton', 'Viktor Storm'];
  const members = [];
  const membersCount = 3 + Math.floor(Math.random() * 3); // 3-5 members
  while (members.length < membersCount) {
    const mem = randomItem(membersPool);
    if (!members.includes(mem)) members.push(mem);
  }

  const upcoming = [
    `Currently composing tracks for a new concept album about ${theme1}`,
    `Preparing a special livestream performance from ${origin.split(',')[0]}`
  ];

  const notes = `Fascinating approach to modern ${genre}. The drum programming is highly intricate, and the atmospheric layers feel extremely premium. Definitely keep an eye on their upcoming releases.`;

  // Procedural Releases
  const albumYear = 2020 + Math.floor(Math.random() * 5); // 2020-2024
  const albumTitle = `The Chronicles of ${theme1.charAt(0).toUpperCase() + theme1.slice(1)}`;
  const singleTitle = `${theme2.charAt(0).toUpperCase() + theme2.slice(1)}`;

  const albumTracks = [
    { title: 'Shattered Mirror', duration: 210 + Math.floor(Math.random() * 120), lyrics: `Reflections in the broken glass.\nWe watch the fragments fall.\nSearching for a shape we lost.\nThere is no sound at all.` },
    { title: 'Neural Path', duration: 180 + Math.floor(Math.random() * 120), lyrics: `Synapses firing in the dark.\nA code we cannot read.\nWe trace the wires to the heart.\nAnd follow where they lead.` },
    { title: 'The Void Whispers', duration: 250 + Math.floor(Math.random() * 200), lyrics: `Listen to the quiet hum.\nBetween the stars, the cold.\nA song of what we will become.\nA story yet untold.` },
    { title: 'Final Equation', duration: 200 + Math.floor(Math.random() * 150), lyrics: `Solve for the light.\nSubtract the shadows we create.\nThe math is always right.\nBut it is far too late.` }
  ];

  const singleTrack = {
    title: singleTitle,
    duration: 220 + Math.floor(Math.random() * 80),
    lyrics: `A single moment frozen.\nIsolated in the stream.\nWe are the ones chosen\nTo wake up from this dream.`
  };

  return {
    name,
    origin,
    bio,
    members,
    upcoming,
    notes,
    releases: [
      {
        title: albumTitle,
        type: 'album',
        release_year: albumYear,
        artwork_url: randomItem(unsplashArt),
        tracks: albumTracks
      },
      {
        title: singleTitle,
        type: 'single',
        release_year: albumYear + 1,
        artwork_url: randomItem(unsplashArt),
        tracks: [singleTrack]
      }
    ]
  };
}

// -------------------------------------------------------------
// ENDPOINTS
// -------------------------------------------------------------

// --- Users Routing ---
app.get('/api/users', async (req, res) => {
  try {
    const users = await query.all('SELECT * FROM users ORDER BY name ASC');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' });
  }
  try {
    const result = await query.run('INSERT INTO users (name) VALUES (?)', [name.trim()]);
    exportSnapshot().catch(console.error);
    res.status(201).json({ id: result.id, name: name.trim() });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'User already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Manually delete scores to guarantee cleanup, then delete user (which cascade will also cover)
    await query.run('DELETE FROM scores WHERE user_id = ?', [id]);
    await query.run('DELETE FROM users WHERE id = ?', [id]);
    exportSnapshot().catch(console.error);
    res.json({ success: true, message: `User ${id} removed successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Artists Routing ---
app.get('/api/artists', async (req, res) => {
  try {
    // Fetch all artists with their catalog average score
    const artists = await query.all(`
      SELECT a.*, 
        (
          SELECT AVG(tr_avg.avg_score)
          FROM tracks t
          JOIN releases r ON t.release_id = r.id
          LEFT JOIN (
            SELECT track_id, AVG(score_value) as avg_score 
            FROM scores 
            GROUP BY track_id
          ) tr_avg ON t.id = tr_avg.track_id
          WHERE r.artist_id = a.id AND tr_avg.avg_score IS NOT NULL
        ) as catalog_avg
      FROM artists a
      ORDER BY a.name ASC
    `);
    
    // Parse JSON members/releases arrays
    const formatted = artists.map(art => ({
      ...art,
      members: art.members ? JSON.parse(art.members) : [],
      upcoming_releases: art.upcoming_releases ? JSON.parse(art.upcoming_releases) : [],
      catalog_avg: art.catalog_avg !== null ? parseFloat(art.catalog_avg.toFixed(2)) : null
    }));
    
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add an artist (triggers scraping / mock engine)
app.post('/api/artists', async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Artist name is required' });
  }
  
  const formattedName = name.trim();
  const lowerName = formattedName.toLowerCase().replace(/\s+/g, '');
  
  try {
    // Check if artist already exists
    const existing = await query.get('SELECT id FROM artists WHERE LOWER(name) = ?', [formattedName.toLowerCase()]);
    if (existing) {
      return res.status(400).json({ error: 'Artist already exists in database.' });
    }

    // Scrape or Procedural Generation
    let artistData;
    if (predefinedArtists[lowerName]) {
      artistData = predefinedArtists[lowerName];
      console.log(`Loaded predefined data for: ${artistData.name}`);
    } else {
      artistData = generateProceduralArtist(formattedName);
      console.log(`Procedurally generated data for: ${formattedName}`);
    }

    // Insert artist
    const artistResult = await query.run(
      'INSERT INTO artists (name, bio, origin, members, upcoming_releases, personal_notes) VALUES (?, ?, ?, ?, ?, ?)',
      [
        artistData.name,
        artistData.bio,
        artistData.origin,
        JSON.stringify(artistData.members),
        JSON.stringify(artistData.upcoming),
        artistData.notes || ''
      ]
    );
    const artistId = artistResult.id;

    // Insert releases & tracks
    for (const rel of artistData.releases) {
      const relResult = await query.run(
        'INSERT INTO releases (artist_id, title, type, release_year, artwork_url) VALUES (?, ?, ?, ?, ?)',
        [artistId, rel.title, rel.type, rel.release_year, rel.artwork_url]
      );
      const releaseId = relResult.id;

      for (const tr of rel.tracks) {
        await query.run(
          'INSERT INTO tracks (release_id, title, duration, lyrics) VALUES (?, ?, ?, ?)',
          [releaseId, tr.title, tr.duration, tr.lyrics]
        );
      }
    }

    exportSnapshot().catch(console.error);
    res.status(201).json({ id: artistId, name: artistData.name, message: 'Artist successfully added.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get detailed artist profile
app.get('/api/artists/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const artist = await query.get('SELECT * FROM artists WHERE id = ?', [id]);
    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    // Fetch releases
    const releases = await query.all('SELECT * FROM releases WHERE artist_id = ? ORDER BY release_year DESC', [id]);

    const formattedReleases = [];
    for (const rel of releases) {
      // Fetch tracks with their overall average scores
      const tracks = await query.all(`
        SELECT t.*, 
          (SELECT AVG(score_value) FROM scores WHERE track_id = t.id) as avg_score
        FROM tracks t 
        WHERE t.release_id = ?
        ORDER BY t.id ASC
      `, [rel.id]);

      // Fetch specific user scores for each track
      const tracksWithScores = [];
      for (const track of tracks) {
        const scores = await query.all('SELECT user_id, score_value FROM scores WHERE track_id = ?', [track.id]);
        
        // Map scores as an object { user_id: score_value }
        const userScores = {};
        scores.forEach(s => {
          userScores[s.user_id] = s.score_value;
        });

        tracksWithScores.push({
          ...track,
          avg_score: track.avg_score !== null ? parseFloat(track.avg_score.toFixed(2)) : null,
          userScores
        });
      }

      // Calculate release average rating from track averages
      const ratedTracks = tracksWithScores.filter(t => t.avg_score !== null);
      const releaseAvg = ratedTracks.length > 0
        ? parseFloat((ratedTracks.reduce((sum, t) => sum + t.avg_score, 0) / ratedTracks.length).toFixed(2))
        : null;

      formattedReleases.push({
        ...rel,
        tracks: tracksWithScores,
        avg_score: releaseAvg
      });
    }

    res.json({
      ...artist,
      members: artist.members ? JSON.parse(artist.members) : [],
      upcoming_releases: artist.upcoming_releases ? JSON.parse(artist.upcoming_releases) : [],
      releases: formattedReleases
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update personal notes
app.put('/api/artists/:id/notes', async (req, res) => {
  const { id } = req.params;
  const { personal_notes } = req.body;
  try {
    await query.run('UPDATE artists SET personal_notes = ? WHERE id = ?', [personal_notes || '', id]);
    exportSnapshot().catch(console.error);
    res.json({ success: true, message: 'Notes updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Scores Routing ---
app.post('/api/scores', async (req, res) => {
  const { track_id, user_id, score_value } = req.body;
  if (track_id === undefined || user_id === undefined) {
    return res.status(400).json({ error: 'track_id and user_id are required' });
  }

  // Validate range 0-10 or null to delete
  if (score_value !== null && (isNaN(score_value) || score_value < 0 || score_value > 10)) {
    return res.status(400).json({ error: 'score_value must be between 0 and 10' });
  }

  try {
    if (score_value === null) {
      // Delete score
      await query.run('DELETE FROM scores WHERE track_id = ? AND user_id = ?', [track_id, user_id]);
      exportSnapshot().catch(console.error);
      res.json({ success: true, message: 'Score cleared successfully.' });
    } else {
      // Insert or replace score
      await query.run(`
        INSERT INTO scores (track_id, user_id, score_value) 
        VALUES (?, ?, ?)
        ON CONFLICT(track_id, user_id) DO UPDATE SET score_value = excluded.score_value
      `, [track_id, user_id, score_value]);
      
      // Return new track average
      const avgRow = await query.get('SELECT AVG(score_value) as avg_score FROM scores WHERE track_id = ?', [track_id]);
      exportSnapshot().catch(console.error);
      res.json({ 
        success: true, 
        message: 'Score saved successfully.', 
        avg_score: avgRow.avg_score !== null ? parseFloat(avgRow.avg_score.toFixed(2)) : null 
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Global Tracks Search (for nominations) ---
app.get('/api/tracks/search', async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim() === '') {
    return res.json([]);
  }
  try {
    const searchVal = `%${q.trim()}%`;
    const searchTracks = await query.all(`
      SELECT t.id, t.title as track_title, r.title as release_title, a.name as artist_name, r.artwork_url,
        (SELECT AVG(score_value) FROM scores WHERE track_id = t.id) as avg_score
      FROM tracks t
      JOIN releases r ON t.release_id = r.id
      JOIN artists a ON r.artist_id = a.id
      WHERE t.title LIKE ? OR a.name LIKE ? OR r.title LIKE ?
      LIMIT 15
    `, [searchVal, searchVal, searchVal]);
    
    const formatted = searchTracks.map(t => ({
      ...t,
      avg_score: t.avg_score !== null ? parseFloat(t.avg_score.toFixed(2)) : null
    }));
    
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- User Insights / Stats ---
app.get('/api/stats/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    // 1. Highest-rated Album
    // Calculated by averaging the scores of all tracks within that album for that specific user.
    const albumRating = await query.get(`
      SELECT r.id, r.title, r.artwork_url, a.name as artist_name, AVG(s.score_value) as user_avg
      FROM scores s
      JOIN tracks t ON s.track_id = t.id
      JOIN releases r ON t.release_id = r.id
      JOIN artists a ON r.artist_id = a.id
      WHERE s.user_id = ?
      GROUP BY r.id
      ORDER BY user_avg DESC
      LIMIT 1
    `, [userId]);

    // 2. Highest-rated Song(s)
    const topSongs = await query.all(`
      SELECT t.id, t.title, r.title as release_title, a.name as artist_name, s.score_value
      FROM scores s
      JOIN tracks t ON s.track_id = t.id
      JOIN releases r ON t.release_id = r.id
      JOIN artists a ON r.artist_id = a.id
      WHERE s.user_id = ?
      ORDER BY s.score_value DESC, t.title ASC
      LIMIT 5
    `, [userId]);

    // 3. Stats details
    const totalRated = await query.get('SELECT COUNT(*) as count FROM scores WHERE user_id = ?', [userId]);

    res.json({
      highestRatedAlbum: albumRating ? {
        ...albumRating,
        user_avg: parseFloat(albumRating.user_avg.toFixed(2))
      } : null,
      highestRatedSongs: topSongs,
      totalRated: totalRated.count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Artist catalog tier list mapping (S, A, B, C, D, F)
app.get('/api/artists/tier-list', async (req, res) => {
  try {
    // We get the average score of all tracks for each artist
    const list = await query.all(`
      SELECT a.id, a.name, 
        (
          SELECT AVG(tr_avg.avg_score)
          FROM tracks t
          JOIN releases r ON t.release_id = r.id
          LEFT JOIN (
            SELECT track_id, AVG(score_value) as avg_score 
            FROM scores 
            GROUP BY track_id
          ) tr_avg ON t.id = tr_avg.track_id
          WHERE r.artist_id = a.id AND tr_avg.avg_score IS NOT NULL
        ) as catalog_avg
      FROM artists a
    `);

    // Assign tiers based on catalog average:
    // S: >= 9.0
    // A: >= 8.0 and < 9.0
    // B: >= 7.0 and < 8.0
    // C: >= 6.0 and < 7.0
    // D: >= 5.0 and < 6.0
    // F: < 5.0 or Unrated
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

    res.json(tiers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 2K Awards Routing ---
app.get('/api/two-k-awards', async (req, res) => {
  try {
    const list = await query.all(`
      SELECT a.id as award_id, a.year, a.is_finalist, a.is_winner, 
             t.id as track_id, t.title as track_title, r.title as release_title, 
             r.artwork_url, art.name as artist_name,
             (SELECT AVG(score_value) FROM scores WHERE track_id = t.id) as avg_score
      FROM two_k_awards a
      JOIN tracks t ON a.track_id = t.id
      JOIN releases r ON t.release_id = r.id
      JOIN artists art ON r.artist_id = art.id
      ORDER BY a.year DESC, a.is_winner DESC, track_title ASC
    `);

    // Group by year
    const grouped = {};
    list.forEach(item => {
      const yr = item.year;
      if (!grouped[yr]) {
        grouped[yr] = [];
      }
      grouped[yr].push({
        id: item.award_id,
        year: item.year,
        is_finalist: !!item.is_finalist,
        is_winner: !!item.is_winner,
        track_id: item.track_id,
        track_title: item.track_title,
        release_title: item.release_title,
        artwork_url: item.artwork_url,
        artist_name: item.artist_name,
        avg_score: item.avg_score !== null ? parseFloat(item.avg_score.toFixed(2)) : null
      });
    });

    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a finalist
app.post('/api/two-k-awards/finalist', async (req, res) => {
  const { year, track_id } = req.body;
  if (!year || !track_id) {
    return res.status(400).json({ error: 'year and track_id are required' });
  }
  try {
    // Check if already finalist
    const existing = await query.get('SELECT id FROM two_k_awards WHERE year = ? AND track_id = ?', [year, track_id]);
    if (existing) {
      return res.status(400).json({ error: 'This track is already nominated for this year.' });
    }

    const result = await query.run(
      'INSERT INTO two_k_awards (year, track_id, is_finalist, is_winner) VALUES (?, ?, 1, 0)',
      [year, track_id]
    );
    exportSnapshot().catch(console.error);
    res.status(201).json({ id: result.id, success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crown Winner
app.put('/api/two-k-awards/:id/winner', async (req, res) => {
  const { id } = req.params;
  try {
    const nomination = await query.get('SELECT year FROM two_k_awards WHERE id = ?', [id]);
    if (!nomination) {
      return res.status(404).json({ error: 'Nomination not found' });
    }

    // Reset other winners for the same year
    await query.run('UPDATE two_k_awards SET is_winner = 0 WHERE year = ?', [nomination.year]);

    // Set this nomination as winner
    await query.run('UPDATE two_k_awards SET is_winner = 1 WHERE id = ?', [id]);

    exportSnapshot().catch(console.error);
    res.json({ success: true, message: 'Winner crowned successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Finalist / Winner nomination
app.delete('/api/two-k-awards/finalist/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query.run('DELETE FROM two_k_awards WHERE id = ?', [id]);
    exportSnapshot().catch(console.error);
    res.json({ success: true, message: 'Nomination removed successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Export Database Snapshot to JSON ---
async function exportSnapshot() {
  try {
    console.log('Exporting database snapshot...');
    
    // 1. Get users
    const users = await query.all('SELECT * FROM users ORDER BY name ASC');
    
    // 2. Get artists and details
    const artistsRaw = await query.all('SELECT * FROM artists ORDER BY name ASC');
    const artists = [];
    const artistDetails = {};
    
    for (const art of artistsRaw) {
      // Calculate catalog average
      const avgRow = await query.get(`
        SELECT AVG(tr_avg.avg_score) as catalog_avg
        FROM tracks t
        JOIN releases r ON t.release_id = r.id
        LEFT JOIN (
          SELECT track_id, AVG(score_value) as avg_score 
          FROM scores 
          GROUP BY track_id
        ) tr_avg ON t.id = tr_avg.track_id
        WHERE r.artist_id = ? AND tr_avg.avg_score IS NOT NULL
      `, [art.id]);
      
      const catalog_avg = avgRow?.catalog_avg !== undefined && avgRow.catalog_avg !== null
        ? parseFloat(avgRow.catalog_avg.toFixed(2)) 
        : null;
        
      const summary = {
        id: art.id,
        name: art.name,
        origin: art.origin,
        bio: art.bio,
        catalog_avg
      };
      artists.push(summary);
      
      // Fetch releases for this artist
      const releases = await query.all('SELECT * FROM releases WHERE artist_id = ? ORDER BY release_year DESC', [art.id]);
      const formattedReleases = [];
      for (const rel of releases) {
        const tracks = await query.all(`
          SELECT t.*, 
            (SELECT AVG(score_value) FROM scores WHERE track_id = t.id) as avg_score
          FROM tracks t 
          WHERE t.release_id = ?
          ORDER BY t.id ASC
        `, [rel.id]);
        
        const tracksWithScores = [];
        for (const track of tracks) {
          const scores = await query.all('SELECT user_id, score_value FROM scores WHERE track_id = ?', [track.id]);
          const userScores = {};
          scores.forEach(s => {
            userScores[s.user_id] = s.score_value;
          });
          tracksWithScores.push({
            ...track,
            avg_score: track.avg_score !== null ? parseFloat(track.avg_score.toFixed(2)) : null,
            userScores
          });
        }
        
        const ratedTracks = tracksWithScores.filter(t => t.avg_score !== null);
        const releaseAvg = ratedTracks.length > 0
          ? parseFloat((ratedTracks.reduce((sum, t) => sum + t.avg_score, 0) / ratedTracks.length).toFixed(2))
          : null;
          
        formattedReleases.push({
          ...rel,
          tracks: tracksWithScores,
          avg_score: releaseAvg
        });
      }
      
      artistDetails[art.id] = {
        ...art,
        members: art.members ? JSON.parse(art.members) : [],
        upcoming_releases: art.upcoming_releases ? JSON.parse(art.upcoming_releases) : [],
        releases: formattedReleases,
        catalog_avg
      };
    }
    
    // 3. Get 2K Awards
    const awardsList = await query.all(`
      SELECT a.id as award_id, a.year, a.is_finalist, a.is_winner, 
             t.id as track_id, t.title as track_title, r.title as release_title, 
             r.artwork_url, art.name as artist_name,
             (SELECT AVG(score_value) FROM scores WHERE track_id = t.id) as avg_score
      FROM two_k_awards a
      JOIN tracks t ON a.track_id = t.id
      JOIN releases r ON t.release_id = r.id
      JOIN artists art ON r.artist_id = art.id
      ORDER BY a.year DESC, a.is_winner DESC, track_title ASC
    `);
    
    const awards = {};
    awardsList.forEach(item => {
      const yr = item.year;
      if (!awards[yr]) {
        awards[yr] = [];
      }
      awards[yr].push({
        id: item.award_id,
        year: item.year,
        is_finalist: !!item.is_finalist,
        is_winner: !!item.is_winner,
        track_id: item.track_id,
        track_title: item.track_title,
        release_title: item.release_title,
        artwork_url: item.artwork_url,
        artist_name: item.artist_name,
        avg_score: item.avg_score !== null ? parseFloat(item.avg_score.toFixed(2)) : null
      });
    });
    
    const snapshot = {
      users,
      artists,
      artistDetails,
      awards,
      exportedAt: new Date().toISOString()
    };
    
    const snapshotString = JSON.stringify(snapshot, null, 2);
    
    // Write to frontend public directory if it exists
    const pathsToTry = [
      '/app/frontend_public',
      path.join(__dirname, '..', 'frontend', 'public')
    ];
    
    for (const p of pathsToTry) {
      if (fs.existsSync(p)) {
        try {
          fs.writeFileSync(path.join(p, 'db_snapshot.json'), snapshotString, 'utf8');
          console.log(`Successfully wrote snapshot to frontend public directory: ${p}`);
        } catch (e) {
          console.error(`Failed to write snapshot to ${p}:`, e);
        }
      }
    }
    
    // Fallback/Safety write to backend public so it is served on localhost:3000/db_snapshot.json
    const backendPublicPath = path.join(__dirname, 'public');
    if (fs.existsSync(backendPublicPath)) {
      fs.writeFileSync(path.join(backendPublicPath, 'db_snapshot.json'), snapshotString, 'utf8');
    }
  } catch (err) {
    console.error('Failed to export database snapshot:', err);
  }
}

// --- Fallback for Frontend Single Page App Router ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
initDb()
  .then(() => {
    // Perform initial export on startup
    return exportSnapshot();
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Music Hub Express server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
  });
