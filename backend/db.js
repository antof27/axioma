import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define db path inside /app/data for persistence, fallback to ./data
const dbDir = process.env.DATABASE_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'music_hub.db');
console.log(`Database source path: ${dbPath}`);

const db = new sqlite3.Database(dbPath);
db.run('PRAGMA foreign_keys = ON;', (err) => {
  if (err) {
    console.error('Failed to enable foreign keys:', err);
  } else {
    console.log('Foreign key support enabled.');
  }
});

// Helper function to run SQL queries as promises
export const query = {
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  },
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  exec(sql) {
    return new Promise((resolve, reject) => {
      db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

export async function initDb() {
  // Create tables
  await query.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);

  await query.run(`
    CREATE TABLE IF NOT EXISTS artists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      bio TEXT,
      origin TEXT,
      members TEXT, -- JSON array of strings
      upcoming_releases TEXT, -- JSON array of strings
      personal_notes TEXT DEFAULT ''
    )
  `);

  await query.run(`
    CREATE TABLE IF NOT EXISTS releases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      artist_id INTEGER,
      title TEXT NOT NULL,
      type TEXT CHECK(type IN ('album', 'single')),
      release_year INTEGER,
      artwork_url TEXT,
      FOREIGN KEY(artist_id) REFERENCES artists(id) ON DELETE CASCADE
    )
  `);

  await query.run(`
    CREATE TABLE IF NOT EXISTS tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      release_id INTEGER,
      title TEXT NOT NULL,
      duration INTEGER, -- In seconds
      lyrics TEXT,
      FOREIGN KEY(release_id) REFERENCES releases(id) ON DELETE CASCADE
    )
  `);

  await query.run(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      track_id INTEGER,
      user_id INTEGER,
      score_value REAL CHECK(score_value >= 0 AND score_value <= 10),
      FOREIGN KEY(track_id) REFERENCES tracks(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(track_id, user_id)
    )
  `);

  await query.run(`
    CREATE TABLE IF NOT EXISTS two_k_awards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL,
      track_id INTEGER NOT NULL,
      is_finalist INTEGER DEFAULT 1 CHECK(is_finalist IN (0, 1)),
      is_winner INTEGER DEFAULT 0 CHECK(is_winner IN (0, 1)),
      FOREIGN KEY(track_id) REFERENCES tracks(id) ON DELETE CASCADE,
      UNIQUE(year, track_id)
    )
  `);

  // Check if DB is already seeded by checking if users exist
  const userCount = await query.get('SELECT COUNT(*) as count FROM users');
  const shouldSeed = process.env.SEED_DATABASE === 'true';
  if (userCount.count === 0) {
    if (shouldSeed) {
      console.log('Seeding initial data into Music Hub...');
    
    // Seed Users
    const users = ['Alice', 'Bob', 'Charlie'];
    const userIds = {};
    for (const name of users) {
      const result = await query.run('INSERT INTO users (name) VALUES (?)', [name]);
      userIds[name] = result.id;
    }

    // Seed Vildhjarta
    const vildhjartaBio = 'Vildhjarta is a Swedish progressive metal band formed in Hudiksvall in 2005. The group plays in a highly complex, dissonant, and ambient style that was instrumental in pioneering the "djent" and "thall" subgenres. Characterized by low-tuned multi-scale guitars, massive polyrhythmic grooves, and emotional soundscapes.';
    const vildhjartaMembers = JSON.stringify(['Daniel Bergström', 'Buster Odeholm', 'Calle Thomer', 'Vilhelm Bladin']);
    const vildhjartaUpcoming = JSON.stringify(['New single "+ y先进 +" in production', 'European festival tour planned next summer']);
    const vildhjartaNotes = 'Incredible mastery of dissonance and ambient textures. Their production by Buster Odeholm sets the absolute benchmark for modern metal tone. "thall" is not just a meme, it is a high-art form of modern dark classical music.';

    const vildhjartaResult = await query.run(
      'INSERT INTO artists (name, bio, origin, members, upcoming_releases, personal_notes) VALUES (?, ?, ?, ?, ?, ?)',
      ['Vildhjarta', vildhjartaBio, 'Hudiksvall, Sweden', vildhjartaMembers, vildhjartaUpcoming, vildhjartaNotes]
    );
    const vildhjartaId = vildhjartaResult.id;

    // Seed Karmanjakah
    const karmanjakahBio = 'Karmanjakah is a Stockholm-based progressive metal band. Combining ethereal, sparkling clean guitar melodies with intense, syncopated math-metal grooves, they create an incredibly emotive and atmospheric sound. Known for high-register soaring clean vocals and deeply evocative lyrical concepts.';
    const karmanjakahMembers = JSON.stringify(['Leo Lilja', 'Lukas Ohlsson', 'Viggo Östlund', 'Tajd Karmanjakah']);
    const karmanjakahUpcoming = JSON.stringify(['Highly anticipated second album in writing stage', 'Acoustic sessions EP coming soon']);
    const karmanjakahNotes = 'The perfect blend of heavy tech-metal polyrhythms and beautiful, emotional pop-like vocal melodies. The clean guitar tones sound like sparkling glass. Essential listening for fans of TesseracT and Plini.';

    const karmanjakahResult = await query.run(
      'INSERT INTO artists (name, bio, origin, members, upcoming_releases, personal_notes) VALUES (?, ?, ?, ?, ?, ?)',
      ['Karmanjakah', karmanjakahBio, 'Stockholm, Sweden', karmanjakahMembers, karmanjakahUpcoming, karmanjakahNotes]
    );
    const karmanjakahId = karmanjakahResult.id;

    // Seed Releases
    // Vildhjarta Releases
    const masstadenVatten = await query.run(
      'INSERT INTO releases (artist_id, title, type, release_year, artwork_url) VALUES (?, ?, ?, ?, ?)',
      [vildhjartaId, 'måsstaden under vatten', 'album', 2021, 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=500&auto=format&fit=crop&q=60']
    );
    const masstadenOriginal = await query.run(
      'INSERT INTO releases (artist_id, title, type, release_year, artwork_url) VALUES (?, ?, ?, ?, ?)',
      [vildhjartaId, 'måsstaden', 'album', 2011, 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60']
    );
    const kristallSingle = await query.run(
      'INSERT INTO releases (artist_id, title, type, release_year, artwork_url) VALUES (?, ?, ?, ?, ?)',
      [vildhjartaId, '+ kristall +', 'single', 2023, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=60']
    );

    // Karmanjakah Releases
    const bookAboutYou = await query.run(
      'INSERT INTO releases (artist_id, title, type, release_year, artwork_url) VALUES (?, ?, ?, ?, ?)',
      [karmanjakahId, 'A Book About You', 'album', 2021, 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&auto=format&fit=crop&q=60']
    );
    const karmanSelfTitled = await query.run(
      'INSERT INTO releases (artist_id, title, type, release_year, artwork_url) VALUES (?, ?, ?, ?, ?)',
      [karmanjakahId, 'Karmanjakah EP', 'album', 2016, 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=500&auto=format&fit=crop&q=60']
    );
    const onhwaSingle = await query.run(
      'INSERT INTO releases (artist_id, title, type, release_year, artwork_url) VALUES (?, ?, ?, ?, ?)',
      [karmanjakahId, 'Onhwa', 'single', 2024, 'https://images.unsplash.com/photo-1604871000636-074fa5117945?w=500&auto=format&fit=crop&q=60']
    );

    // Seed Tracks & Lyrics
    const tracksToInsert = [
      // måsstaden under vatten
      { release_id: masstadenVatten.id, title: 'totsen', duration: 174, lyrics: '[Instrumental Intro]\n\nUnder den frusna ytan väntar det.\nSkuggorna växer sig längre för varje minut.\nDet finns ingen väg tillbaka nu.\n\nthall.\n\n[Dissonant Breakdown]' },
      { release_id: masstadenVatten.id, title: 'den spanska känslan', duration: 245, lyrics: 'De viskande träden i måsstaden talar om ett fall.\nEn känsla av tyngdlöshet.\nEn plötslig värme, en avlägsen signal.\nVinden vänder.\nDet spanska slottet faller i gruset.\n\nDu kan inte fly från det du skapat.' },
      { release_id: masstadenVatten.id, title: 'brännmärkt', duration: 212, lyrics: 'Brännmärkt av elden.\nEtt evigt spår på din hud.\nTiden läker inga sår här.\nVattnet stiger.\nSanningen uppenbaras i djupet.\n\nthall.' },
      { release_id: masstadenVatten.id, title: 'mitt trötta hjärta', duration: 290, lyrics: 'Mitt trötta hjärta slår sitt sista slag.\nOmgivet av tystnad.\nEn sång om förlust, en sång om försoning.\nLåt mig sjunka ned.\nBland ruinerna av det som en gång var.' },

      // måsstaden (2011)
      { release_id: masstadenOriginal.id, title: 'shadow', duration: 248, lyrics: 'Walk in the shadow of the colossal trees.\nThey know your name.\nThey watch your steps.\nThere is no light that penetrates this deep.\nOnly the quiet hum of the ancient soil.' },
      { release_id: masstadenOriginal.id, title: 'dagger', duration: 266, lyrics: 'A silver blade slicing through the mist.\nThe first cut is the deepest, they say.\nBut here, every cut is the same.\nEndless repeating patterns.\nDissonance is our comfort.' },
      { release_id: masstadenOriginal.id, title: 'benblåst', duration: 234, lyrics: 'Scattered bones, cold dust.\nThe wind blows through the hollow ribcage.\nA symphony of decay.\nWe are the architects of our own ruin.' },

      // + kristall +
      { release_id: kristallSingle.id, title: '+ kristall +', duration: 205, lyrics: '[Ambient intro with rain sounds]\n\nKristaller som splittras mot stengolvet.\nEtt fruset ögonblick.\nLjuset bryts i tusen färger.\nMen mörkret tar alltid över.\n\nthall.' },

      // A Book About You
      { release_id: bookAboutYou.id, title: 'First Sun', duration: 251, lyrics: 'First sun rising above the ridge.\nChasing away the ghosts of yesterday.\nI saw you standing there, in the light.\nA fragile hope we chose to build.\nLet the warmth soak into your skin.\nWe are finally home.' },
      { release_id: bookAboutYou.id, title: 'Wildfire', duration: 280, lyrics: 'A spark in the dry brush.\nAnd now it is consuming everything we made.\nWildfire spreading through the valley.\nBeautiful, destructive, untamed.\nWill we burn with it,\nOr watch from the safety of the shore?' },
      { release_id: bookAboutYou.id, title: 'Duo', duration: 265, lyrics: 'We walk two separate lines\nThat intersect at the end of the page.\nA duo playing in discord,\nSearching for the harmony we lost.\nHold on to the thread\nBefore it snaps under the tension.' },
      { release_id: bookAboutYou.id, title: 'Paper Heart', duration: 230, lyrics: 'Folding, creasing, fragile things.\nA heart made of paper, easily torn.\nHandle with care, you said.\nBut the wind was too strong.\nAnd the rain began to fall.' },

      // Karmanjakah EP
      { release_id: karmanSelfTitled.id, title: 'Soma', duration: 245, lyrics: 'Drinking from the cup of temporary peace.\nSoma flowing through the veins.\nA beautiful delusion.\nWe shut our eyes to the burning world outside\nAnd sleep in comfort.' },
      { release_id: karmanSelfTitled.id, title: 'Ira', duration: 220, lyrics: 'The quiet anger that builds inside.\nA storm brewing behind calm eyes.\nWhen it breaks, it will sweep the dust away.\nBut for now, we wait\nIn the absolute silence.' },

      // Onhwa
      { release_id: onhwaSingle.id, title: 'Onhwa', duration: 275, lyrics: 'Onhwa.\nThe road we did not choose, but must walk.\nThrough the snow and the heavy fog.\nWe carry the memories like stone.\nHeavy but precious.\nWe are moving forward.' }
    ];

    const trackIds = [];
    for (const t of tracksToInsert) {
      const result = await query.run(
        'INSERT INTO tracks (release_id, title, duration, lyrics) VALUES (?, ?, ?, ?)',
        [t.release_id, t.title, t.duration, t.lyrics]
      );
      trackIds.push({ id: result.id, title: t.title });
    }

    // Seed Scores
    const aliceId = userIds['Alice'];
    const bobId = userIds['Bob'];
    const charlieId = userIds['Charlie'];

    const scoresToInsert = [
      // totsen
      { trackTitle: 'totsen', userId: aliceId, val: 9.5 },
      { trackTitle: 'totsen', userId: bobId, val: 9.0 },
      { trackTitle: 'totsen', userId: charlieId, val: 8.5 },
      // den spanska känslan
      { trackTitle: 'den spanska känslan', userId: aliceId, val: 10.0 },
      { trackTitle: 'den spanska känslan', userId: bobId, val: 9.5 },
      { trackTitle: 'den spanska känslan', userId: charlieId, val: 9.0 },
      // First Sun
      { trackTitle: 'First Sun', userId: aliceId, val: 9.0 },
      { trackTitle: 'First Sun', userId: bobId, val: 9.2 },
      { trackTitle: 'First Sun', userId: charlieId, val: 9.5 },
      // Wildfire
      { trackTitle: 'Wildfire', userId: aliceId, val: 9.5 },
      { trackTitle: 'Wildfire', userId: bobId, val: 8.8 },
      { trackTitle: 'Wildfire', userId: charlieId, val: 9.6 },
      // Paper Heart
      { trackTitle: 'Paper Heart', userId: aliceId, val: 8.5 },
      { trackTitle: 'Paper Heart', userId: bobId, val: 9.0 },
      { trackTitle: 'Paper Heart', userId: charlieId, val: 8.0 },
      // Soma
      { trackTitle: 'Soma', userId: aliceId, val: 9.2 },
      { trackTitle: 'Soma', userId: bobId, val: 9.1 },
      // + kristall +
      { trackTitle: '+ kristall +', userId: aliceId, val: 9.8 },
      { trackTitle: '+ kristall +', userId: bobId, val: 9.4 }
    ];

    for (const s of scoresToInsert) {
      const tr = trackIds.find(x => x.title === s.trackTitle);
      if (tr) {
        await query.run(
          'INSERT INTO scores (track_id, user_id, score_value) VALUES (?, ?, ?)',
          [tr.id, s.userId, s.val]
        );
      }
    }

    // Seed 2K Awards
    // Nominate 'den spanska känslan' as finalist & winner for 2021
    const spanskaTrack = trackIds.find(x => x.title === 'den spanska känslan');
    if (spanskaTrack) {
      await query.run(
        'INSERT INTO two_k_awards (year, track_id, is_finalist, is_winner) VALUES (?, ?, ?, ?)',
        [2021, spanskaTrack.id, 1, 1]
      );
    }

    // Nominate 'First Sun' as finalist for 2021
    const firstSunTrack = trackIds.find(x => x.title === 'First Sun');
    if (firstSunTrack) {
      await query.run(
        'INSERT INTO two_k_awards (year, track_id, is_finalist, is_winner) VALUES (?, ?, ?, ?)',
        [2021, firstSunTrack.id, 1, 0]
      );
    }

    // Nominate '+ kristall +' as finalist for 2023
    const kristallTrack = trackIds.find(x => x.title === '+ kristall +');
    if (kristallTrack) {
      await query.run(
        'INSERT INTO two_k_awards (year, track_id, is_finalist, is_winner) VALUES (?, ?, ?, ?)',
        [2023, kristallTrack.id, 1, 1]
      );
    }

    console.log('Database successfully seeded.');
    } else {
      console.log('Database initialized empty.');
    }
  } else {
    console.log('Database already has data.');
  }
}
export default db;
