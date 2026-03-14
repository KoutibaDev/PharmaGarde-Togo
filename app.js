// ═══════════════════════════════════════
// CONNEXION SUPABASE
// ═══════════════════════════════════════
const SUPABASE_URL = 'https://secjfgzzmsvatsmaxbud.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlY2pmZ3p6bXN2YXRzbWF4YnVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTQ5MzYsImV4cCI6MjA4OTA3MDkzNn0.2EYq4WZtth5QBlEr3GRoUcrHtyw3kR3brRkQEhzFqIo';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ═══════════════════════════════════════
// ÉTAT GLOBAL
// ═══════════════════════════════════════
let villeActive = 'Lomé';
let toutesPharmacies = [];
let zoneActive = 'tous';
let villeToutes = 'Lomé';
let carteLeaflet = null;
let userLat = null;
let userLng = null;
let deferredPrompt;
let donneesPharmacies = [];
let darkMode = false;

// ═══════════════════════════════════════
// COORDONNÉES DES VILLES
// ═══════════════════════════════════════
const coordsVilles = {
  'Lomé': { lat: 6.1375, lng: 1.2123 },
  'Kara': { lat: 9.5511, lng: 1.1864 },
  'Kpalimé': { lat: 6.9006, lng: 0.6241 },
  'Sokodé': { lat: 8.9833, lng: 1.1333 },
  'Dapaong': { lat: 10.8667, lng: 0.2167 },
  'Tsévié': { lat: 6.4264, lng: 1.2136 },
  'Atakpamé': { lat: 7.5333, lng: 1.1333 }
};

// ═══════════════════════════════════════
// URGENCES
// ═══════════════════════════════════════
const urgences = [
  { nom: "SAMU", numero: "15", numeroAffiche: "15", emoji: "🚑", couleur: "r" },
  { nom: "Police", numero: "117", numeroAffiche: "117", emoji: "👮", couleur: "b" },
  { nom: "Pompiers", numero: "118", numeroAffiche: "118", emoji: "🚒", couleur: "o" },
  { nom: "CHU Sylvanus", numero: "+22822212501", numeroAffiche: "+228 22 21 25 01", emoji: "🏥", couleur: "g" }
];

// ═══════════════════════════════════════
// VILLES BASE
// ═══════════════════════════════════════
const toutesVillesBase = [
  { nom: "Lomé", emoji: "🏙️" },
  { nom: "Kpalimé", emoji: "🌳" },
  { nom: "Kara", emoji: "⛰️" },
  { nom: "Sokodé", emoji: "🌾" },
  { nom: "Dapaong", emoji: "🏜️" },
  { nom: "Tsévié", emoji: "🌊" },
  { nom: "Atakpamé", emoji: "🌴" }
];

// ═══════════════════════════════════════
// SPLASH SCREEN
// ═══════════════════════════════════════
function cacherSplash() {
  setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.classList.add('hide');
      setTimeout(() => splash.remove(), 500);
    }
  }, 2200);
}

// ═══════════════════════════════════════
// MODE SOMBRE
// ═══════════════════════════════════════
function toggleDark() {
  darkMode = !darkMode;
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : '');
  document.getElementById('dark-btn').textContent = darkMode ? '☀️' : '🌙';
  localStorage.setItem('darkMode', darkMode);
}

function initDarkMode() {
  const saved = localStorage.getItem('darkMode');
  if (saved === 'true') {
    darkMode = true;
    document.documentElement.setAttribute('data-theme', 'dark');
    const btn = document.getElementById('dark-btn');
    if (btn) btn.textContent = '☀️';
  }
}

// ═══════════════════════════════════════
// NAVIGATION AVEC TRANSITIONS
// ═══════════════════════════════════════
function afficherPage(pageId, slideForward = true) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  const page = document.getElementById(pageId);
  page.style.display = 'block';
  page.classList.remove('slide-in', 'slide-back');
  void page.offsetWidth;
  page.classList.add(slideForward ? 'slide-in' : 'slide-back');
  window.scrollTo(0, 0);

  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('on'));
  const map = {
    'page-home': 'nav-home',
    'page-urgences': 'nav-urgences',
    'page-contact': 'nav-contact'
  };
  if (map[pageId]) document.getElementById(map[pageId])?.classList.add('on');

  if (pageId === 'page-toutes') {
    villeToutes = villeActive;
    const select = document.getElementById('select-ville');
    if (select) select.value = villeActive;
    chargerToutesPharmacies();
  }
}

// ═══════════════════════════════════════
// CHARGER PHARMACIES
// ═══════════════════════════════════════
async function chargerPharmacies(ville) {
  try {
    let query = db.from('pharmacies').select('*').eq('actif', true);
    if (ville) query = query.eq('ville', ville);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('Erreur:', e);
    return [];
  }
}

// ═══════════════════════════════════════
// RECHERCHE RAPIDE
// ═══════════════════════════════════════
function rechercherPharmacie(terme) {
  if (!terme.trim()) {
    const apercu = donneesPharmacies.slice(0, 3);
    document.getElementById('liste-pharmacies').innerHTML = apercu.map(p => afficherPharmacie(p)).join('');
    document.getElementById('count-badge').textContent = donneesPharmacies.length + ' trouvée' + (donneesPharmacies.length > 1 ? 's' : '');
    return;
  }

  const t = terme.toLowerCase();
  const resultats = donneesPharmacies.filter(p =>
    p.nom?.toLowerCase().includes(t) ||
    p.adresse?.toLowerCase().includes(t) ||
    p.zone?.toLowerCase().includes(t)
  );

  document.getElementById('liste-pharmacies').innerHTML = resultats.length > 0
    ? resultats.map(p => afficherPharmacie(p)).join('')
    : `<div style="text-align:center;padding:32px;color:var(--sub);">
        <div style="font-size:36px;margin-bottom:10px;">🔍</div>
        <div style="font-weight:700;">Aucun résultat pour "${terme}"</div>
      </div>`;

  document.getElementById('count-badge').textContent = resultats.length + ' trouvée' + (resultats.length > 1 ? 's' : '');
}

// ═══════════════════════════════════════
// DISTANCE GPS
// ═══════════════════════════════════════
function calculerDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ═══════════════════════════════════════
// PARTAGE WHATSAPP
// ═══════════════════════════════════════
function partagerWhatsApp(p) {
  const tel = (p.tel || '').replace(/\s/g, '');
  const texte = `💊 *${p.nom}*\n📍 ${p.adresse || ''}, ${p.ville}\n📞 ${p.tel_affiche || p.tel || 'Non précisé'}\n\n_Trouvé sur PharmaGarde Togo_ 🇹🇬\n👉 pharma-garde-togo.vercel.app`;
  window.open(`https://wa.me/?text=${encodeURIComponent(texte)}`, '_blank');
}

// ═══════════════════════════════════════
// SIGNALER UNE ERREUR
// ═══════════════════════════════════════
function signalerErreur(nom) {
  const texte = `Bonjour PharmaGarde 👋\n\nJe souhaite signaler une erreur concernant :\n*${nom}*\n\nDétails : `;
  window.open(`https://wa.me/22800000000?text=${encodeURIComponent(texte)}`, '_blank');
}

// ═══════════════════════════════════════
// POPUP PHARMACIE
// ═══════════════════════════════════════
function ouvrirPopup(p) {
  const assurances = (p.assurances || '').split(',').filter(a => a.trim());
  const assurancesHtml = assurances.length
    ? assurances.map(a => `<span class="assur-tag">${a.trim()}</span>`).join('')
    : '<span style="color:var(--sub);font-size:12px;">Aucune précisée</span>';

  const telPropre = (p.tel || '').replace(/\s/g, '');
  const chipClass = p.garde === '24h/24' ? 'h24' : 'soir';
  const chipLabel = p.garde === '24h/24' ? '🌛 24h/24' : '🌆 Ce soir';
  const coords = coordsVilles[p.ville] || coordsVilles['Lomé'];

  document.getElementById('popup-content').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
      <div style="flex:1;padding-right:12px;">
        <div style="font-family:'Fraunces',serif;font-size:20px;font-weight:700;color:var(--text);margin-bottom:8px;line-height:1.2;">${p.nom}</div>
        <div class="garde-chip ${chipClass}">${chipLabel}</div>
      </div>
      <button onclick="fermerPopup()" style="background:var(--bg);border:none;width:32px;height:32px;border-radius:50%;font-size:18px;cursor:pointer;flex-shrink:0;">✕</button>
    </div>

    <div style="background:var(--bg);border-radius:14px;padding:14px;margin-bottom:14px;">
      <div class="meta-row" style="margin-bottom:8px;font-size:14px;"><span>📍</span><span style="color:var(--text)">${p.adresse || 'Non précisée'}</span></div>
      <div class="meta-row" style="margin-bottom:8px;font-size:14px;"><span>🏙️</span><span style="color:var(--text)">${p.ville} — Zone ${p.zone || '—'}</span></div>
      <div class="meta-row" style="font-size:14px;"><span>📞</span><span style="color:var(--text);font-weight:600;">${p.tel_affiche || p.tel || 'Non précisé'}</span></div>
    </div>

    <div style="margin-bottom:14px;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--sub);margin-bottom:8px;">Assurances</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">${assurancesHtml}</div>
    </div>

    <div style="border-radius:16px;overflow:hidden;margin-bottom:14px;border:1.5px solid var(--border);">
      <div id="popup-map" style="height:180px;width:100%;"></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
      <button onclick="lancerItineraire('${p.nom.replace(/'/g,"\\'")}','${(p.adresse||'').replace(/'/g,"\\'")}','${p.ville}')"
        style="background:var(--g1);color:white;border:none;border-radius:14px;padding:13px;font-family:'Outfit',sans-serif;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
        🧭 Itinéraire
      </button>
      ${telPropre ? `
        <a href="tel:${telPropre}" style="background:#EEF3FF;color:#3B5BDB;border-radius:14px;padding:13px;font-family:'Outfit',sans-serif;font-size:13px;font-weight:700;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px;">
          📞 Appeler
        </a>` : '<div></div>'}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      ${telPropre ? `
        <a href="https://wa.me/${telPropre.replace('+','')}" target="_blank"
          style="background:#25D366;color:white;border-radius:14px;padding:13px;font-family:'Outfit',sans-serif;font-size:13px;font-weight:700;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px;">
          💬 WhatsApp
        </a>` : '<div></div>'}
      <button onclick="partagerWhatsApp(JSON.parse(this.closest('[data-p]')?.dataset.p || '{}'))" 
        onclick="partagerWhatsApp(${JSON.stringify(p).replace(/"/g,'&quot;')})"
        style="background:var(--bg);border:1.5px solid var(--border);border-radius:14px;padding:13px;font-family:'Outfit',sans-serif;font-size:13px;font-weight:700;cursor:pointer;color:var(--text);display:flex;align-items:center;justify-content:center;gap:6px;"
        onclick="partagerWhatsApp(${JSON.stringify(p).replace(/"/g,"'").replace(/'/g,'\x27')})">
        📤 Partager
      </button>
    </div>

    <button onclick="signalerErreur('${p.nom.replace(/'/g,"\\'")}');"
      style="width:100%;margin-top:10px;background:none;border:1.5px solid var(--border);border-radius:14px;padding:11px;font-family:'Outfit',sans-serif;font-size:12px;font-weight:600;cursor:pointer;color:var(--sub);display:flex;align-items:center;justify-content:center;gap:6px;">
      ⚠️ Signaler une erreur
    </button>
  `;

  document.getElementById('popup-overlay').style.display = 'block';
  document.getElementById('popup-pharmacie').style.display = 'block';

  setTimeout(() => {
    const popupMap = L.map('popup-map', { zoomControl: false, dragging: false }).setView([coords.lat, coords.lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(popupMap);

    const iconPharmacie = L.divIcon({
      html: '<div style="background:#005C32;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">💊</div>',
      iconSize: [32, 32], iconAnchor: [16, 16], className: ''
    });

    L.marker([coords.lat, coords.lng], { icon: iconPharmacie })
      .addTo(popupMap)
      .bindPopup(`<b>${p.nom}</b><br>${p.adresse || ''}`).openPopup();

    if (userLat && userLng) {
      const iconUser = L.divIcon({
        html: '<div style="background:#3B5BDB;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">📍</div>',
        iconSize: [28, 28], iconAnchor: [14, 14], className: ''
      });
      L.marker([userLat, userLng], { icon: iconUser }).addTo(popupMap);
      L.polyline([[userLat, userLng], [coords.lat, coords.lng]], {
        color: '#005C32', weight: 3, dashArray: '8,8', opacity: 0.7
      }).addTo(popupMap);
      popupMap.fitBounds([[userLat, userLng], [coords.lat, coords.lng]], { padding: [20, 20] });
    }
  }, 200);
}

function fermerPopup() {
  document.getElementById('popup-overlay').style.display = 'none';
  document.getElementById('popup-pharmacie').style.display = 'none';
}

// ═══════════════════════════════════════
// ITINÉRAIRE
// ═══════════════════════════════════════
function lancerItineraire(nom, adresse, ville) {
  const coords = coordsVilles[ville] || coordsVilles['Lomé'];

  document.getElementById('popup-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
      <button onclick="fermerPopup()" style="background:var(--bg);border:none;width:36px;height:36px;border-radius:50%;font-size:20px;cursor:pointer;">‹</button>
      <div>
        <div style="font-family:'Fraunces',serif;font-size:18px;font-weight:700;color:var(--text);">${nom}</div>
        <div style="font-size:12px;color:var(--sub);">${adresse}</div>
      </div>
    </div>

    ${userLat && userLng ? `
      <div style="background:#EEF3FF;border-radius:14px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:20px;">📍</span>
        <div><div style="font-size:13px;font-weight:700;color:#3B5BDB;">GPS actif</div>
        <div style="font-size:11px;color:var(--sub);">Itinéraire depuis votre position</div></div>
      </div>` : `
      <div style="background:#FFF8EE;border-radius:14px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:20px;">⚠️</span>
        <div><div style="font-size:13px;font-weight:700;color:#E67700;">GPS non activé</div>
        <div style="font-size:11px;color:var(--sub);">Activez votre GPS pour l'itinéraire</div></div>
      </div>`}

    <div id="carte-itineraire" style="height:320px;border-radius:16px;overflow:hidden;border:1.5px solid var(--border);margin-bottom:14px;"></div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div style="background:var(--bg);border-radius:12px;padding:14px;text-align:center;">
        <div style="font-size:22px;font-weight:900;color:var(--g1);" id="distance-val">--</div>
        <div style="font-size:11px;color:var(--sub);margin-top:2px;">Distance</div>
      </div>
      <div style="background:var(--bg);border-radius:12px;padding:14px;text-align:center;">
        <div style="font-size:22px;font-weight:900;color:var(--g1);" id="temps-val">--</div>
        <div style="font-size:11px;color:var(--sub);margin-top:2px;">À pied (~5km/h)</div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const carteItin = L.map('carte-itineraire').setView([coords.lat, coords.lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(carteItin);

    const iconPharmacie = L.divIcon({
      html: '<div style="background:#005C32;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">💊</div>',
      iconSize: [36, 36], iconAnchor: [18, 18], className: ''
    });

    L.marker([coords.lat, coords.lng], { icon: iconPharmacie }).addTo(carteItin).bindPopup(`<b>${nom}</b>`).openPopup();

    if (userLat && userLng) {
      const iconUser = L.divIcon({
        html: '<div style="background:#3B5BDB;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🧑</div>',
        iconSize: [32, 32], iconAnchor: [16, 16], className: ''
      });

      L.marker([userLat, userLng], { icon: iconUser }).addTo(carteItin).bindPopup('Vous êtes ici');
      L.polyline([[userLat, userLng], [coords.lat, coords.lng]], {
        color: '#005C32', weight: 4, dashArray: '10,8', opacity: 0.9
      }).addTo(carteItin);
      carteItin.fitBounds([[userLat, userLng], [coords.lat, coords.lng]], { padding: [30, 30] });

      const dist = calculerDistance(userLat, userLng, coords.lat, coords.lng);
      document.getElementById('distance-val').textContent = dist < 1 ? Math.round(dist * 1000) + ' m' : dist.toFixed(1) + ' km';
      const mins = Math.round(dist * 12);
      document.getElementById('temps-val').textContent = mins < 60 ? mins + ' min' : Math.floor(mins/60) + 'h' + (mins % 60) + 'min';
    }
  }, 200);
}

// ═══════════════════════════════════════
// AFFICHER UNE PHARMACIE
// ═══════════════════════════════════════
function afficherPharmacie(p, estLaPlusProche = false) {
  const assurances = (p.assurances || '').split(',').filter(a => a.trim());
  const chipClass = p.garde === '24h/24' ? 'h24' : 'soir';
  const chipLabel = p.garde === '24h/24' ? '🌛 24h/24' : '🌆 Ce soir';
  const assurancesHtml = assurances.map(a => `<span class="assur-tag">${a.trim()}</span>`).join('');
  const telPropre = (p.tel || '').replace(/\s/g, '');
  const badgeProche = estLaPlusProche ? '<span style="background:var(--gold);color:#1a1a1a;border-radius:8px;padding:3px 8px;font-size:10px;font-weight:700;margin-left:6px;">📍 La plus proche</span>' : '';
  const pStr = JSON.stringify(p).replace(/"/g, '&quot;');

  return `
    <div class="pharm-card ${p.garde === '24h/24' ? 'h24' : ''}"
      onclick="ouvrirPopup(JSON.parse(this.dataset.p.replace(/&quot;/g,'\"')))"
      data-p="${pStr}" style="cursor:pointer;">
      <div class="card-head">
        <div class="pharm-name">${p.nom}${badgeProche}</div>
        <div class="garde-chip ${chipClass}">${chipLabel}</div>
      </div>
      <div class="card-meta">
        <div class="meta-row"><span>📍</span>${p.adresse || ''}</div>
        <div class="meta-row"><span>📞</span>${p.tel_affiche || p.tel || 'Non précisé'}</div>
        ${assurancesHtml ? `<div class="assurance-row">${assurancesHtml}</div>` : ''}
      </div>
      <div class="card-actions">
        ${telPropre
          ? `<a href="tel:${telPropre}" class="btn-call" onclick="event.stopPropagation()">📞 Appeler</a>`
          : '<div class="btn-call" style="background:#ccc;cursor:not-allowed;flex:1;display:flex;align-items:center;justify-content:center;">Non précisé</div>'}
        ${telPropre ? `<a href="https://wa.me/${telPropre.replace('+','')}" target="_blank" class="btn-icon" onclick="event.stopPropagation()">💬</a>` : ''}
        <div class="btn-icon" title="Partager" onclick="event.stopPropagation();partagerWhatsApp(JSON.parse(this.closest('[data-p]').dataset.p.replace(/&quot;/g,'\"')))">📤</div>
        <div class="btn-icon" title="Itinéraire" onclick="event.stopPropagation();lancerItineraire('${p.nom.replace(/'/g,"\\'")}','${(p.adresse||'').replace(/'/g,"\\'")}','${p.ville}');document.getElementById('popup-overlay').style.display='block';document.getElementById('popup-pharmacie').style.display='block';">🧭</div>
      </div>
    </div>`;
}

// ═══════════════════════════════════════
// PHARMACIE LA PLUS PROCHE
// ═══════════════════════════════════════
function afficherPlusProche(pharmacies) {
  if (pharmacies.length === 0) return;
  const h24 = pharmacies.find(p => p.garde === '24h/24');
  const plusProche = h24 || pharmacies[0];
  document.getElementById('plus-proche-section').style.display = 'block';
  document.getElementById('plus-proche-card').innerHTML = afficherPharmacie(plusProche, true);
}

// ═══════════════════════════════════════
// RECHARGER PHARMACIES (accueil)
// ═══════════════════════════════════════
async function rechargerPharmacies() {
  document.getElementById('liste-pharmacies').innerHTML =
    `<div style="text-align:center;padding:32px;color:var(--sub);"><div style="font-size:28px;margin-bottom:8px;">⏳</div>Chargement...</div>`;

  const data = await chargerPharmacies(villeActive);
  donneesPharmacies = data;

  if (!data || data.length === 0) {
    document.getElementById('liste-pharmacies').innerHTML =
      `<div style="text-align:center;padding:40px;color:var(--sub);"><div style="font-size:40px;margin-bottom:10px;">🔍</div><div style="font-weight:700;">Aucune pharmacie trouvée</div><div style="font-size:13px;margin-top:4px;">pour ${villeActive}</div></div>`;
    document.getElementById('count-badge').textContent = '0 trouvée';
    return;
  }

  const apercu = data.slice(0, 3);
  document.getElementById('liste-pharmacies').innerHTML = apercu.map(p => afficherPharmacie(p)).join('');
  document.getElementById('count-badge').textContent = data.length + ' trouvée' + (data.length > 1 ? 's' : '');
  afficherPlusProche(data);
}

// ═══════════════════════════════════════
// PAGE TOUTES LES PHARMACIES
// ═══════════════════════════════════════
async function chargerToutesPharmacies() {
  document.getElementById('liste-toutes').innerHTML =
    `<div style="text-align:center;padding:32px;color:var(--sub);"><div style="font-size:28px;margin-bottom:8px;">⏳</div>Chargement...</div>`;
  toutesPharmacies = await chargerPharmacies(villeToutes);
  afficherListeToutes();
  initialiserCarte();
}

function afficherListeToutes() {
  const liste = zoneActive === 'tous' ? toutesPharmacies : toutesPharmacies.filter(p => p.zone === zoneActive);
  document.getElementById('count-toutes').textContent = liste.length + ' trouvée' + (liste.length > 1 ? 's' : '');
  if (liste.length === 0) {
    document.getElementById('liste-toutes').innerHTML =
      `<div style="text-align:center;padding:40px;color:var(--sub);"><div style="font-size:40px;margin-bottom:10px;">🔍</div><div style="font-weight:700;">Aucune pharmacie trouvée</div></div>`;
    return;
  }
  document.getElementById('liste-toutes').innerHTML = liste.map(p => afficherPharmacie(p)).join('');
}

async function changerVilleToutes(ville) {
  villeToutes = ville;
  zoneActive = 'tous';
  await chargerToutesPharmacies();
}

// ═══════════════════════════════════════
// CARTE LEAFLET
// ═══════════════════════════════════════
function initialiserCarte() {
  const coords = coordsVilles[villeToutes] || coordsVilles['Lomé'];
  if (carteLeaflet) { carteLeaflet.remove(); carteLeaflet = null; }
  setTimeout(() => {
    carteLeaflet = L.map('carte-lome').setView([coords.lat, coords.lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(carteLeaflet);
    toutesPharmacies.forEach(p => {
      const offsetLat = (Math.random() - 0.5) * 0.04;
      const offsetLng = (Math.random() - 0.5) * 0.04;
      const icon = L.divIcon({
        html: '<div style="background:#005C32;color:white;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,0.3);">💊</div>',
        iconSize: [26, 26], iconAnchor: [13, 13], className: ''
      });
      L.marker([coords.lat + offsetLat, coords.lng + offsetLng], { icon })
        .addTo(carteLeaflet)
        .bindPopup(`<b>${p.nom}</b><br>${p.adresse || ''}<br>📞 ${p.tel_affiche || p.tel || ''}`);
    });
  }, 100);
}

// ═══════════════════════════════════════
// URGENCES
// ═══════════════════════════════════════
function afficherUrgencesHome() {
  return urgences.map(u => `
    <a href="tel:${u.numero}" class="urg-card ${u.couleur}" style="text-decoration:none;">
      <div class="urg-emoji">${u.emoji}</div>
      <div class="urg-name">${u.nom}</div>
      <div class="urg-num">${u.numeroAffiche}</div>
    </a>`).join('');
}

function afficherUrgencesPage() {
  const bg = { r:'#FFF0EE', b:'#EEF3FF', o:'#FFF8EE', g:'#EEFBF4' };
  const tc = { r:'#E53935', b:'#3B5BDB', o:'#E67700', g:'#005C32' };
  return urgences.map(u => `
    <a href="tel:${u.numero}" class="urg-full" style="text-decoration:none;">
      <div class="urg-full-icon" style="background:${bg[u.couleur]};">${u.emoji}</div>
      <div class="urg-full-info">
        <div class="urg-full-name">${u.nom}</div>
        <div class="urg-full-sub">Appuyez pour appeler</div>
      </div>
      <div class="urg-full-num" style="color:${tc[u.couleur]};">${u.numeroAffiche}</div>
    </a>`).join('');
}

// ═══════════════════════════════════════
// VILLES
// ═══════════════════════════════════════
async function afficherVilles(filtre = '') {
  const { data } = await db.from('pharmacies').select('ville').eq('actif', true);
  const compteur = {};
  (data || []).forEach(p => {
    const v = p.ville?.trim();
    if (v) compteur[v] = (compteur[v] || 0) + 1;
  });

  const villesDisponibles = Object.keys(compteur).sort();

  // Mettre à jour le select
  const select = document.getElementById('select-ville');
  if (select) {
    select.innerHTML = villesDisponibles.map(v => {
      const base = toutesVillesBase.find(b => b.nom === v);
      return `<option value="${v}">${base ? base.emoji : '🏘️'} ${v}</option>`;
    }).join('');
  }

  // Mettre à jour stat villes
  const statVilles = document.getElementById('stat-villes');
  if (statVilles) statVilles.textContent = villesDisponibles.length;

  const liste = filtre
    ? villesDisponibles.filter(v => v.toLowerCase().includes(filtre.toLowerCase()))
    : villesDisponibles;

  return liste.map(v => {
    const base = toutesVillesBase.find(b => b.nom === v);
    const emoji = base ? base.emoji : '🏘️';
    const nb = compteur[v] || 0;
    return `
      <div class="ville-item" onclick="choisirVille('${v}')">
        <span style="font-size:24px">${emoji}</span>
        <div style="flex:1;">
          <div class="ville-name">${v}</div>
          <div class="ville-count">${nb} pharmacie${nb > 1 ? 's' : ''}</div>
        </div>
        <span style="color:var(--sub);font-size:20px;">›</span>
      </div>`;
  }).join('');
}

async function filtrerVilles(valeur) {
  document.getElementById('liste-villes').innerHTML = await afficherVilles(valeur);
}

async function choisirVille(ville) {
  villeActive = ville;
  document.getElementById('loc-main').textContent = ville + ' ✓';
  document.getElementById('loc-sub').textContent = 'Appuyez pour changer de ville';
  afficherPage('page-home', false);
  await rechargerPharmacies();
}

// ═══════════════════════════════════════
// WHATSAPP CONTACT
// ═══════════════════════════════════════
function envoyerWhatsApp() {
  const numero = document.getElementById('input-tel').value;
  const ville = document.getElementById('input-ville').value;
  const message = document.getElementById('input-message').value;
  if (!message.trim()) { alert('Veuillez écrire un message.'); return; }
  const texte = `Bonjour PharmaGarde Togo 👋\n\nVille: ${ville}\nNuméro: ${numero}\n\nMessage: ${message}`;
  window.open(`https://wa.me/22800000000?text=${encodeURIComponent(texte)}`, '_blank');
}

// ═══════════════════════════════════════
// PWA INSTALLATION
// ═══════════════════════════════════════
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('install-banner').style.display = 'flex';
  setTimeout(() => { if (deferredPrompt) afficherPopupInstall(); }, 30000);
});

function afficherPopupInstall() {
  if (document.getElementById('install-popup')) return;
  const popup = document.createElement('div');
  popup.id = 'install-popup';
  popup.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);width:calc(100% - 48px);max-width:440px;background:var(--white);border-radius:20px;padding:20px;box-shadow:0 8px 40px rgba(0,0,0,0.2);z-index:999;border:2px solid var(--g2);`;
  popup.innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">
      <div style="width:52px;height:52px;background:linear-gradient(135deg,#005C32,#00845A);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;">💊</div>
      <div style="flex:1;">
        <div style="font-family:'Fraunces',serif;font-size:17px;font-weight:700;color:var(--text);">Installer PharmaGarde</div>
        <div style="font-size:12px;color:var(--sub);margin-top:2px;">Accès rapide depuis votre écran d'accueil</div>
      </div>
      <button onclick="document.getElementById('install-popup').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--sub);">✕</button>
    </div>
    <div style="display:flex;gap:4px;margin-bottom:14px;">
      <div style="flex:1;background:var(--bg);border-radius:10px;padding:10px;text-align:center;"><div style="font-size:20px;">⚡</div><div style="font-size:11px;font-weight:600;color:var(--g1);margin-top:4px;">Rapide</div></div>
      <div style="flex:1;background:var(--bg);border-radius:10px;padding:10px;text-align:center;"><div style="font-size:20px;">📴</div><div style="font-size:11px;font-weight:600;color:var(--g1);margin-top:4px;">Hors ligne</div></div>
      <div style="flex:1;background:var(--bg);border-radius:10px;padding:10px;text-align:center;"><div style="font-size:20px;">🆓</div><div style="font-size:11px;font-weight:600;color:var(--g1);margin-top:4px;">Gratuit</div></div>
    </div>
    <button onclick="installerDepuisPopup()" style="width:100%;background:linear-gradient(135deg,#005C32,#00845A);color:white;border:none;border-radius:14px;padding:15px;font-family:'Outfit',sans-serif;font-size:15px;font-weight:800;cursor:pointer;">📲 Installer maintenant — Gratuit</button>
  `;
  document.body.appendChild(popup);
}

function installerDepuisPopup() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((result) => {
      deferredPrompt = null;
      document.getElementById('install-popup')?.remove();
      document.getElementById('install-banner').style.display = 'none';
      if (result.outcome === 'accepted') {
        const msg = document.createElement('div');
        msg.style.cssText = `position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#005C32;color:white;padding:12px 24px;border-radius:20px;font-weight:700;z-index:9999;font-size:14px;`;
        msg.textContent = '✅ App installée avec succès !';
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 3000);
      }
    });
  }
}

function installerApp() {
  if (deferredPrompt) {
    afficherPopupInstall();
  } else if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    afficherInstructionsIOS();
  } else {
    alert('Pour installer : appuyez sur le menu de votre navigateur puis "Ajouter à l\'écran d\'accueil"');
  }
}

function afficherInstructionsIOS() {
  const popup = document.createElement('div');
  popup.style.cssText = `position:fixed;bottom:0;left:0;right:0;background:var(--white);border-radius:24px 24px 0 0;padding:24px;z-index:9999;box-shadow:0 -8px 40px rgba(0,0,0,0.2);`;
  popup.innerHTML = `
    <div style="width:40px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 20px;"></div>
    <div style="font-family:'Fraunces',serif;font-size:20px;font-weight:700;margin-bottom:6px;color:var(--text);">Installer sur iPhone</div>
    <div style="font-size:13px;color:var(--sub);margin-bottom:20px;">3 étapes simples :</div>
    <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
      ${['Appuyez sur 📤 en bas de Safari','Faites défiler → "Sur l\'écran d\'accueil"','Appuyez sur "Ajouter"'].map((t,i) => `
        <div style="display:flex;align-items:center;gap:12px;background:var(--bg);border-radius:14px;padding:14px;">
          <div style="width:32px;height:32px;background:var(--g1);border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;flex-shrink:0;">${i+1}</div>
          <div style="font-size:14px;font-weight:600;color:var(--text);">${t}</div>
        </div>`).join('')}
    </div>
    <button onclick="this.parentElement.remove()" style="width:100%;background:var(--g1);color:white;border:none;border-radius:14px;padding:15px;font-family:'Outfit',sans-serif;font-size:15px;font-weight:700;cursor:pointer;">J'ai compris ✓</button>
  `;
  document.body.appendChild(popup);
}

// ═══════════════════════════════════════
// INITIALISATION
// ═══════════════════════════════════════
window.onload = async function () {
  // Splash screen
  cacherSplash();

  // Mode sombre
  initDarkMode();

  // Urgences
  document.getElementById('urgences-home').innerHTML = afficherUrgencesHome();
  document.getElementById('urgences-page').innerHTML = afficherUrgencesPage();

  // Villes
  document.getElementById('liste-villes').innerHTML = await afficherVilles();

  // GPS
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      userLat = pos.coords.latitude;
      userLng = pos.coords.longitude;
      document.getElementById('loc-main').textContent = 'Lomé ✓';
      document.getElementById('loc-sub').textContent = 'GPS actif · Appuyez pour changer';
    }, () => {
      document.getElementById('loc-main').textContent = 'Lomé';
      document.getElementById('loc-sub').textContent = 'Appuyez pour changer de ville';
    });
  }

  // Pharmacies
  await rechargerPharmacies();

  // Stats
  const { count } = await db.from('pharmacies').select('*', { count: 'exact', head: true }).eq('actif', true);
  const statEl = document.getElementById('stat-pharmacies');
  if (statEl && count) statEl.textContent = count + '+';

  // Dernière mise à jour
  const { data: lastUpdate } = await db.from('pharmacies').select('created_at').eq('actif', true).order('created_at', { ascending: false }).limit(1);
  const badge = document.getElementById('update-badge');
  if (badge && lastUpdate && lastUpdate[0]) {
    const date = new Date(lastUpdate[0].created_at);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    badge.textContent = '🔄 Mis à jour le ' + date.toLocaleDateString('fr-FR', options);
  }
};
