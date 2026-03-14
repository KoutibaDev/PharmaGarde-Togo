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
      setTimeout(() => { if (splash.parentNode) splash.remove(); }, 600);
    }
  }, 2400);
}

// ═══════════════════════════════════════
// MODE SOMBRE
// ═══════════════════════════════════════
function toggleDark() {
  darkMode = !darkMode;
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : '');
  const icon = document.getElementById('dark-icon');
  const label = document.getElementById('dark-label');
  const toggle = document.getElementById('toggle-switch');
  if (icon) icon.textContent = darkMode ? '☀️' : '🌙';
  if (label) label.textContent = darkMode ? 'Mode clair' : 'Mode sombre';
  if (toggle) toggle.classList.toggle('on', darkMode);
  localStorage.setItem('darkMode', darkMode);
}

function initDarkMode() {
  if (localStorage.getItem('darkMode') === 'true') {
    darkMode = true;
    document.documentElement.setAttribute('data-theme', 'dark');
    const icon = document.getElementById('dark-icon');
    const label = document.getElementById('dark-label');
    const toggle = document.getElementById('toggle-switch');
    if (icon) icon.textContent = '☀️';
    if (label) label.textContent = 'Mode clair';
    if (toggle) toggle.classList.add('on');
  }
}

// ═══════════════════════════════════════
// MENU HAMBURGER
// ═══════════════════════════════════════
function ouvrirMenu() {
  document.getElementById('nav-menu').classList.add('open');
  document.getElementById('nav-overlay').classList.add('open');
  document.getElementById('hamburger')?.classList.add('open');
}

function fermerMenu() {
  document.getElementById('nav-menu').classList.remove('open');
  document.getElementById('nav-overlay').classList.remove('open');
  document.querySelectorAll('.hamburger').forEach(h => h.classList.remove('open'));
}

function naviguerMenu(pageId) {
  fermerMenu();
  setTimeout(() => afficherPage(pageId, true), 200);
  // Mettre à jour l'item actif
  document.querySelectorAll('.nav-menu-item').forEach(i => i.classList.remove('active'));
  const map = { 'page-home': 'menu-pharmacies', 'page-urgences': 'menu-urgences', 'page-contact': 'menu-contact' };
  if (map[pageId]) document.getElementById(map[pageId])?.classList.add('active');
}

// ═══════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════
function afficherPage(pageId, slideForward = true) {
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active', 'slide-in', 'slide-back');
  });

  const page = document.getElementById(pageId);
  if (!page) return;
  page.classList.add('active');
  void page.offsetWidth;
  page.classList.add(slideForward ? 'slide-in' : 'slide-back');
  window.scrollTo(0, 0);

  // Bottom nav
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('on'));
  const navMap = { 'page-home': 'nav-home', 'page-urgences': 'nav-urgences', 'page-contact': 'nav-contact' };
  if (navMap[pageId]) document.getElementById(navMap[pageId])?.classList.add('on');

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
    console.error('Erreur Supabase:', e);
    return [];
  }
}

// ═══════════════════════════════════════
// DISTANCE GPS RÉELLE
// ═══════════════════════════════════════
function calculerDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ═══════════════════════════════════════
// PHARMACIE LA PLUS PROCHE (vraie distance)
// ═══════════════════════════════════════
function trouverPlusProche(pharmacies) {
  if (!pharmacies.length) return null;

  // Si GPS disponible, calculer vraie distance
  if (userLat && userLng) {
    const coordsVille = coordsVilles[villeActive];
    if (coordsVille) {
      // Ajouter des coordonnées approximatives par zone
      const offsetsZones = {
        'A': { lat: 0.000, lng: 0.000 },
        'B': { lat: 0.015, lng: -0.010 },
        'C': { lat: 0.020, lng: 0.005 },
        'D': { lat: 0.025, lng: 0.015 },
        'E': { lat: -0.015, lng: -0.020 },
        'F': { lat: -0.030, lng: -0.015 },
      };

      let plusProche = null;
      let distMin = Infinity;

      pharmacies.forEach(p => {
        const offset = offsetsZones[p.zone] || { lat: 0, lng: 0 };
        const pLat = coordsVille.lat + offset.lat;
        const pLng = coordsVille.lng + offset.lng;
        const dist = calculerDistance(userLat, userLng, pLat, pLng);
        if (dist < distMin) {
          distMin = dist;
          plusProche = { ...p, distanceKm: dist, pLat, pLng };
        }
      });

      return plusProche;
    }
  }

  // Fallback : pharmacie 24h ou première
  return pharmacies.find(p => p.garde === '24h/24') || pharmacies[0];
}

function afficherPlusProche(pharmacies) {
  if (!pharmacies.length) return;
  const plusProche = trouverPlusProche(pharmacies);
  if (!plusProche) return;

  document.getElementById('plus-proche-section').style.display = 'block';
  const distText = plusProche.distanceKm
    ? `<div class="meta-row"><span>📏</span>${plusProche.distanceKm < 1 ? Math.round(plusProche.distanceKm * 1000) + ' m' : plusProche.distanceKm.toFixed(1) + ' km'} de vous</div>`
    : '';

  document.getElementById('plus-proche-card').innerHTML = afficherPharmacie({ ...plusProche, _plusProche: true });
}

// ═══════════════════════════════════════
// RECHERCHE
// ═══════════════════════════════════════
function rechercherPharmacie(terme) {
  if (!terme.trim()) {
    document.getElementById('liste-pharmacies').innerHTML =
      donneesPharmacies.slice(0, 3).map(p => afficherPharmacie(p)).join('');
    document.getElementById('count-badge').textContent =
      donneesPharmacies.length + ' trouvée' + (donneesPharmacies.length > 1 ? 's' : '');
    return;
  }
  const t = terme.toLowerCase();
  const res = donneesPharmacies.filter(p =>
    p.nom?.toLowerCase().includes(t) ||
    p.adresse?.toLowerCase().includes(t) ||
    p.zone?.toLowerCase().includes(t)
  );
  document.getElementById('liste-pharmacies').innerHTML = res.length
    ? res.map(p => afficherPharmacie(p)).join('')
    : `<div style="text-align:center;padding:32px;color:var(--sub);"><div style="font-size:36px;margin-bottom:8px;">🔍</div><div style="font-weight:700;">Aucun résultat pour "${terme}"</div></div>`;
  document.getElementById('count-badge').textContent = res.length + ' résultat' + (res.length > 1 ? 's' : '');
}

// ═══════════════════════════════════════
// PARTAGE WHATSAPP
// ═══════════════════════════════════════
function partagerWhatsApp(p) {
  const texte = `💊 *${p.nom}*\n📍 ${p.adresse || ''}, ${p.ville}\n📞 ${p.tel_affiche || p.tel || 'Non précisé'}\n${p.assurances ? '🏥 Assurances: ' + p.assurances : ''}\n\n_Trouvé sur PharmaGarde Togo_ 🇹🇬\n👉 pharma-garde-togo.vercel.app`;
 window.open(`https://wa.me/22879538131?text=${encodeURIComponent(texte)}`, '_blank');
}

// ═══════════════════════════════════════
// SIGNALER UNE ERREUR
// ═══════════════════════════════════════
function signalerErreur(nom) {
  const texte = `Bonjour PharmaGarde 👋\n\nJe souhaite signaler une erreur concernant :\n*${nom}*\n\nDétails : `;
  window.open(`https://wa.me/22879538131?text=${encodeURIComponent(texte)}`, '_blank');
}

// ═══════════════════════════════════════
// POPUP PHARMACIE
// ═══════════════════════════════════════
function ouvrirPopup(p) {
  const assurances = (p.assurances || '').split(',').filter(a => a.trim());
  const assurancesHtml = assurances.length
    ? assurances.map(a => `<span class="assur-tag">${a.trim()}</span>`).join('')
    : `<span style="color:var(--sub);font-size:12px;">Aucune précisée</span>`;

  const tel = (p.tel || '').replace(/\s/g, '');
  const chipClass = p.garde === '24h/24' ? 'h24' : 'soir';
  const chipLabel = p.garde === '24h/24' ? '🌛 Ouvert 24h/24' : '🌆 De garde ce soir';
  const coords = coordsVilles[p.ville] || coordsVilles['Lomé'];
  const offsetsZones = { 'A':{lat:0,lng:0}, 'B':{lat:0.015,lng:-0.010}, 'C':{lat:0.020,lng:0.005}, 'D':{lat:0.025,lng:0.015}, 'E':{lat:-0.015,lng:-0.020}, 'F':{lat:-0.030,lng:-0.015} };
  const offset = offsetsZones[p.zone] || { lat: 0, lng: 0 };
  const pharmLat = p.pLat || (coords.lat + offset.lat);
  const pharmLng = p.pLng || (coords.lng + offset.lng);

  document.getElementById('popup-content').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
      <div style="flex:1;padding-right:12px;">
        <div style="font-family:'Fraunces',serif;font-size:22px;font-weight:700;color:var(--text);line-height:1.2;margin-bottom:10px;">${p.nom}</div>
        <span class="garde-chip ${chipClass}">${chipLabel}</span>
      </div>
      <button onclick="fermerPopup()" style="background:var(--bg);border:1px solid var(--border);width:34px;height:34px;border-radius:50%;font-size:16px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:var(--sub);">✕</button>
    </div>

    <div style="background:var(--bg);border-radius:var(--radius);padding:14px;margin-bottom:14px;border:1px solid var(--border);">
      <div class="meta-row" style="margin-bottom:8px;"><span>📍</span><span style="color:var(--text);font-weight:500;">${p.adresse || 'Adresse non précisée'}</span></div>
      <div class="meta-row" style="margin-bottom:8px;"><span>🏙️</span><span style="color:var(--text);">${p.ville}${p.zone ? ' · Zone ' + p.zone : ''}</span></div>
      <div class="meta-row"><span>📞</span><span style="color:var(--text);font-weight:700;font-size:15px;">${p.tel_affiche || p.tel || 'Non précisé'}</span></div>
    </div>

    ${assurances.length ? `
    <div style="margin-bottom:14px;">
      <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:var(--sub);margin-bottom:8px;">Assurances acceptées</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">${assurancesHtml}</div>
    </div>` : ''}

    <div style="border-radius:var(--radius);overflow:hidden;margin-bottom:14px;border:1px solid var(--border);position:relative;">
      <div id="popup-map" style="height:180px;width:100%;"></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
      <button onclick="lancerItineraire('${p.nom.replace(/'/g,"\\'")}','${(p.adresse||'').replace(/'/g,"\\'")}','${p.ville}',${pharmLat},${pharmLng})"
        style="background:var(--g1);color:white;border:none;border-radius:var(--radius);padding:13px;font-family:'Outfit',sans-serif;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
        🧭 Itinéraire
      </button>
      ${tel ? `<a href="tel:${tel}" style="background:#EFF6FF;color:#1D4ED8;border-radius:var(--radius);padding:13px;font-family:'Outfit',sans-serif;font-size:13px;font-weight:700;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px;">📞 Appeler</a>` : '<div></div>'}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
      ${tel ? `<a href="https://wa.me/${tel.replace('+','')}" target="_blank" style="background:#F0FDF4;color:#15803D;border:1px solid #86EFAC;border-radius:var(--radius);padding:13px;font-family:'Outfit',sans-serif;font-size:13px;font-weight:700;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px;">💬 WhatsApp</a>` : '<div></div>'}
      <button onclick='partagerWhatsApp(${JSON.stringify(p).replace(/'/g,"&#39;")})'
        style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:13px;font-family:'Outfit',sans-serif;font-size:13px;font-weight:700;cursor:pointer;color:var(--text);display:flex;align-items:center;justify-content:center;gap:6px;">
        📤 Partager
      </button>
    </div>

    <button onclick="signalerErreur('${p.nom.replace(/'/g,"\\'")}');"
      style="width:100%;background:none;border:1px solid var(--border);border-radius:var(--radius);padding:10px;font-family:'Outfit',sans-serif;font-size:12px;font-weight:600;cursor:pointer;color:var(--sub);display:flex;align-items:center;justify-content:center;gap:6px;">
      ⚠️ Signaler une erreur sur cette fiche
    </button>
  `;

  document.getElementById('popup-overlay').style.display = 'block';
  document.getElementById('popup-pharmacie').style.display = 'block';

  setTimeout(() => {
    const popupMap = L.map('popup-map', { zoomControl: false, dragging: false, scrollWheelZoom: false })
      .setView([pharmLat, pharmLng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(popupMap);

    const iconP = L.divIcon({
      html: '<div style="background:#004D2A;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;">💊</div>',
      iconSize: [32,32], iconAnchor: [16,16], className: ''
    });

    L.marker([pharmLat, pharmLng], { icon: iconP })
      .addTo(popupMap)
      .bindPopup(`<b>${p.nom}</b>`).openPopup();

    if (userLat && userLng) {
      const iconU = L.divIcon({
        html: '<div style="background:#1D4ED8;color:white;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;">📍</div>',
        iconSize: [26,26], iconAnchor: [13,13], className: ''
      });
      L.marker([userLat, userLng], { icon: iconU }).addTo(popupMap);
      L.polyline([[userLat, userLng], [pharmLat, pharmLng]], {
        color: '#004D2A', weight: 2, dashArray: '6,6', opacity: 0.6
      }).addTo(popupMap);
      popupMap.fitBounds([[userLat, userLng], [pharmLat, pharmLng]], { padding: [24,24] });
    }
  }, 250);
}

function fermerPopup() {
  document.getElementById('popup-overlay').style.display = 'none';
  document.getElementById('popup-pharmacie').style.display = 'none';
}

// ═══════════════════════════════════════
// ITINÉRAIRE
// ═══════════════════════════════════════
function lancerItineraire(nom, adresse, ville, pharmLat, pharmLng) {
  const coordsV = coordsVilles[ville] || coordsVilles['Lomé'];
  const lat = pharmLat || coordsV.lat;
  const lng = pharmLng || coordsV.lng;

  document.getElementById('popup-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
      <button onclick="fermerPopup()" style="background:var(--bg);border:1px solid var(--border);width:36px;height:36px;border-radius:50%;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--sub);">‹</button>
      <div>
        <div style="font-family:'Fraunces',serif;font-size:18px;font-weight:700;color:var(--text);">${nom}</div>
        <div style="font-size:12px;color:var(--sub);">${adresse || ''} · ${ville}</div>
      </div>
    </div>

    ${userLat && userLng
      ? `<div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:var(--radius);padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;gap:10px;">
          <span style="font-size:20px;">📍</span>
          <div><div style="font-size:13px;font-weight:700;color:#1D4ED8;">GPS actif</div><div style="font-size:11px;color:var(--sub);">Itinéraire calculé depuis votre position</div></div>
         </div>`
      : `<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:var(--radius);padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;gap:10px;">
          <span style="font-size:20px;">⚠️</span>
          <div><div style="font-size:13px;font-weight:700;color:#D97706;">GPS non activé</div><div style="font-size:11px;color:var(--sub);">Activez votre GPS pour un itinéraire précis</div></div>
         </div>`
    }

    <div id="carte-itineraire" style="height:300px;border-radius:var(--radius);overflow:hidden;border:1px solid var(--border);margin-bottom:14px;"></div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:14px;text-align:center;">
        <div style="font-family:'Fraunces',serif;font-size:24px;font-weight:700;color:var(--g1);" id="distance-val">—</div>
        <div style="font-size:11px;color:var(--sub);margin-top:4px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Distance</div>
      </div>
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:14px;text-align:center;">
        <div style="font-family:'Fraunces',serif;font-size:24px;font-weight:700;color:var(--g1);" id="temps-val">—</div>
        <div style="font-size:11px;color:var(--sub);margin-top:4px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">À pied</div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const carte = L.map('carte-itineraire').setView([lat, lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(carte);

    const iconP = L.divIcon({
      html: '<div style="background:#004D2A;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 3px 10px rgba(0,0,0,0.3);border:2px solid white;">💊</div>',
      iconSize: [36,36], iconAnchor: [18,18], className: ''
    });

    L.marker([lat, lng], { icon: iconP }).addTo(carte).bindPopup(`<b>${nom}</b>`).openPopup();

    if (userLat && userLng) {
      const iconU = L.divIcon({
        html: '<div style="background:#1D4ED8;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 3px 10px rgba(0,0,0,0.3);border:2px solid white;">🧑</div>',
        iconSize: [32,32], iconAnchor: [16,16], className: ''
      });

      L.marker([userLat, userLng], { icon: iconU }).addTo(carte).bindPopup('Vous êtes ici');
      L.polyline([[userLat, userLng], [lat, lng]], {
        color: '#004D2A', weight: 4, dashArray: '10,6', opacity: 0.85
      }).addTo(carte);
      carte.fitBounds([[userLat, userLng], [lat, lng]], { padding: [30,30] });

      const dist = calculerDistance(userLat, userLng, lat, lng);
      const distText = dist < 1 ? Math.round(dist * 1000) + ' m' : dist.toFixed(1) + ' km';
      const mins = Math.round(dist * 12);
      const tempsText = mins < 60 ? mins + ' min' : Math.floor(mins/60) + 'h ' + (mins%60) + 'min';
      document.getElementById('distance-val').textContent = distText;
      document.getElementById('temps-val').textContent = tempsText;
    }
  }, 250);
}

// ═══════════════════════════════════════
// AFFICHER UNE PHARMACIE
// ═══════════════════════════════════════
function afficherPharmacie(p) {
  const assurances = (p.assurances || '').split(',').filter(a => a.trim());
  const chipClass = p.garde === '24h/24' ? 'h24' : 'soir';
  const chipLabel = p.garde === '24h/24' ? '🌛 24h/24' : '🌆 Ce soir';
  const assurancesHtml = assurances.map(a => `<span class="assur-tag">${a.trim()}</span>`).join('');
  const tel = (p.tel || '').replace(/\s/g, '');
  const badgeProche = p._plusProche
    ? `<span class="badge-proche">📍 La plus proche</span>` : '';

  // Calculer distance si GPS dispo
  let distHtml = '';
  if (userLat && userLng && p.distanceKm !== undefined) {
    const d = p.distanceKm;
    distHtml = `<div class="meta-row"><span>📏</span>${d < 1 ? Math.round(d*1000)+' m' : d.toFixed(1)+' km'} de vous</div>`;
  }

  const pData = JSON.stringify(p).replace(/"/g, '&quot;');

  return `
    <div class="pharm-card ${p.garde === '24h/24' ? 'h24' : ''}"
      onclick="ouvrirPopup(JSON.parse(this.dataset.p.replace(/&quot;/g,'\"')))"
      data-p="${pData}">
      <div class="card-head">
        <div class="pharm-name">${p.nom}${badgeProche}</div>
        <div class="garde-chip ${chipClass}">${chipLabel}</div>
      </div>
      <div class="card-meta">
        <div class="meta-row"><span>📍</span>${p.adresse || 'Adresse non précisée'}</div>
        <div class="meta-row"><span>📞</span>${p.tel_affiche || p.tel || 'Non précisé'}</div>
        ${distHtml}
        ${assurancesHtml ? `<div class="assurance-row">${assurancesHtml}</div>` : ''}
      </div>
      <div class="card-actions">
        ${tel
          ? `<a href="tel:${tel}" class="btn-call" onclick="event.stopPropagation()">📞 Appeler</a>`
          : `<div class="btn-call" style="background:#9CA3AF;cursor:not-allowed;">Non précisé</div>`}
        ${tel ? `<a href="https://wa.me/${tel.replace('+','')}" target="_blank" class="btn-icon" onclick="event.stopPropagation()" title="WhatsApp">💬</a>` : ''}
        <div class="btn-icon" title="Partager" onclick="event.stopPropagation();partagerWhatsApp(JSON.parse(this.closest('[data-p]').dataset.p.replace(/&quot;/g,'\"')))">📤</div>
        <div class="btn-icon" title="Itinéraire"
          onclick="event.stopPropagation();lancerItineraire('${p.nom.replace(/'/g,"\\'")}','${(p.adresse||'').replace(/'/g,"\\'")}','${p.ville}');document.getElementById('popup-overlay').style.display='block';document.getElementById('popup-pharmacie').style.display='block';">
          🧭
        </div>
      </div>
    </div>`;
}

// ═══════════════════════════════════════
// RECHARGER PHARMACIES
// ═══════════════════════════════════════
async function rechargerPharmacies() {
  document.getElementById('liste-pharmacies').innerHTML =
    `<div style="text-align:center;padding:40px;color:var(--sub);">
      <div style="font-size:32px;margin-bottom:12px;animation:splashIconIn 0.5s ease both;">⏳</div>
      <div style="font-weight:600;">Chargement...</div>
    </div>`;

  const data = await chargerPharmacies(villeActive);
  donneesPharmacies = data;

  if (!data.length) {
    document.getElementById('liste-pharmacies').innerHTML =
      `<div style="text-align:center;padding:40px;color:var(--sub);">
        <div style="font-size:40px;margin-bottom:12px;">🔍</div>
        <div style="font-weight:700;font-size:16px;">Aucune pharmacie trouvée</div>
        <div style="font-size:13px;margin-top:6px;">pour ${villeActive}</div>
      </div>`;
    document.getElementById('count-badge').textContent = '0';
    return;
  }

  document.getElementById('liste-pharmacies').innerHTML =
    data.slice(0, 3).map(p => afficherPharmacie(p)).join('');
  document.getElementById('count-badge').textContent =
    data.length + ' trouvée' + (data.length > 1 ? 's' : '');

  afficherPlusProche(data);
}

// ═══════════════════════════════════════
// PAGE TOUTES LES PHARMACIES
// ═══════════════════════════════════════
async function chargerToutesPharmacies() {
  document.getElementById('liste-toutes').innerHTML =
    `<div style="text-align:center;padding:40px;color:var(--sub);"><div style="font-size:32px;margin-bottom:12px;">⏳</div><div>Chargement...</div></div>`;
  toutesPharmacies = await chargerPharmacies(villeToutes);
  document.getElementById('count-toutes').textContent =
    toutesPharmacies.length + ' trouvée' + (toutesPharmacies.length > 1 ? 's' : '');
  document.getElementById('liste-toutes').innerHTML =
    toutesPharmacies.map(p => afficherPharmacie(p)).join('');
  initialiserCarte();
}

async function changerVilleToutes(ville) {
  villeToutes = ville;
  await chargerToutesPharmacies();
}

// ═══════════════════════════════════════
// CARTE LEAFLET
// ═══════════════════════════════════════
function initialiserCarte() {
  const coords = coordsVilles[villeToutes] || coordsVilles['Lomé'];
  if (carteLeaflet) { carteLeaflet.remove(); carteLeaflet = null; }
  const container = document.getElementById('carte-container');
  if (!container) return;
  container.style.display = 'block';
  setTimeout(() => {
    carteLeaflet = L.map('carte-lome').setView([coords.lat, coords.lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(carteLeaflet);

    const offsetsZones = { 'A':{lat:0,lng:0}, 'B':{lat:0.015,lng:-0.010}, 'C':{lat:0.020,lng:0.005}, 'D':{lat:0.025,lng:0.015}, 'E':{lat:-0.015,lng:-0.020}, 'F':{lat:-0.030,lng:-0.015} };

    toutesPharmacies.forEach(p => {
      const offset = offsetsZones[p.zone] || { lat: (Math.random()-0.5)*0.04, lng: (Math.random()-0.5)*0.04 };
      const icon = L.divIcon({
        html: '<div style="background:#004D2A;color:white;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:1.5px solid white;">💊</div>',
        iconSize: [26,26], iconAnchor: [13,13], className: ''
      });
      L.marker([coords.lat + offset.lat, coords.lng + offset.lng], { icon })
        .addTo(carteLeaflet)
        .bindPopup(`<b>${p.nom}</b><br>${p.adresse || ''}<br>📞 ${p.tel_affiche || p.tel || ''}`);
    });
  }, 150);
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
  const bg = { r:'#FEF2F2', b:'#EFF6FF', o:'#FFFBEB', g:'#F0FDF4' };
  const tc = { r:'#DC2626', b:'#2563EB', o:'#D97706', g:'#15803D' };
  return urgences.map(u => `
    <a href="tel:${u.numero}" class="urg-full" style="text-decoration:none;">
      <div class="urg-full-icon" style="background:${bg[u.couleur]};">${u.emoji}</div>
      <div class="urg-full-info">
        <div class="urg-full-name">${u.nom}</div>
        <div class="urg-full-sub">Appuyez pour appeler directement</div>
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

  const select = document.getElementById('select-ville');
  if (select) {
    select.innerHTML = villesDisponibles.map(v => {
      const base = toutesVillesBase.find(b => b.nom === v);
      return `<option value="${v}">${base ? base.emoji : '🏘️'} ${v}</option>`;
    }).join('');
  }

  const statVilles = document.getElementById('stat-villes');
  if (statVilles) statVilles.textContent = villesDisponibles.length;

  const liste = filtre
    ? villesDisponibles.filter(v => v.toLowerCase().includes(filtre.toLowerCase()))
    : villesDisponibles;

  return liste.map(v => {
    const base = toutesVillesBase.find(b => b.nom === v);
    const nb = compteur[v] || 0;
    return `
      <div class="ville-item" onclick="choisirVille('${v}')">
        <span style="font-size:24px">${base ? base.emoji : '🏘️'}</span>
        <div style="flex:1;">
          <div class="ville-name">${v}</div>
          <div class="ville-count">${nb} pharmacie${nb > 1 ? 's' : ''}</div>
        </div>
        <span style="color:var(--sub);font-size:18px;">›</span>
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
// FOOTER — POLITIQUES
// ═══════════════════════════════════════
function ouvrirPolitique(type) {
  const contenu = {
    confidentialite: {
      titre: '🔒 Politique de confidentialité',
      texte: `
        <h3>Collecte de données</h3>
        <p>PharmaGarde Togo ne collecte aucune donnée personnelle sans votre consentement. Votre position GPS est utilisée uniquement pour afficher les pharmacies les plus proches et n'est jamais stockée.</p>
        <h3>Données de navigation</h3>
        <p>Nous utilisons Supabase pour stocker les informations des pharmacies de garde. Aucune information vous concernant n'est conservée.</p>
        <h3>Contact via WhatsApp</h3>
        <p>Lorsque vous nous contactez via WhatsApp, vos informations sont traitées uniquement pour répondre à votre demande.</p>
        <h3>Cookies</h3>
        <p>Nous utilisons uniquement un cookie pour mémoriser votre préférence de mode sombre. Aucun cookie publicitaire n'est utilisé.</p>
        <h3>Contact</h3>
        <p>Pour toute question : pharmagardetogo@gmail.com</p>
      `
    },
    conditions: {
      titre: '📄 Conditions d\'utilisation',
      texte: `
        <h3>Objet</h3>
        <p>PharmaGarde Togo est un service gratuit d'information sur les pharmacies de garde au Togo. Les informations sont fournies à titre indicatif.</p>
        <h3>Exactitude des données</h3>
        <p>Les données proviennent de sources officielles (lacinquieme.tg, pharmaciens.tg) et sont mises à jour chaque lundi. Nous ne pouvons garantir l'exactitude en temps réel.</p>
        <h3>Responsabilité</h3>
        <p>PharmaGarde Togo ne peut être tenu responsable d'une pharmacie fermée malgré son affichage comme de garde. Nous vous recommandons d'appeler avant de vous déplacer.</p>
        <h3>Propriété intellectuelle</h3>
        <p>Le design et le code de PharmaGarde Togo sont protégés. Toute reproduction est interdite sans autorisation.</p>
      `
    },
    cookies: {
      titre: '🍪 Politique cookies',
      texte: `
        <h3>Cookies utilisés</h3>
        <p>PharmaGarde Togo utilise un seul cookie :</p>
        <h3>darkMode (localStorage)</h3>
        <p>Mémorise votre préférence de thème (clair/sombre). Ce cookie est purement fonctionnel et ne contient aucune information personnelle.</p>
        <h3>Cookies tiers</h3>
        <p>OpenStreetMap (cartographie) peut déposer des cookies techniques nécessaires à l'affichage des cartes. Ces cookies ne sont pas publicitaires.</p>
        <h3>Gestion</h3>
        <p>Vous pouvez supprimer ces cookies à tout moment depuis les paramètres de votre navigateur.</p>
      `
    }
  };

  const info = contenu[type];
  if (!info) return;

  const modal = document.createElement('div');
  modal.className = 'policy-modal';
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  modal.innerHTML = `
    <div class="policy-content">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div class="policy-title">${info.titre}</div>
        <button onclick="this.closest('.policy-modal').remove()" style="background:var(--bg);border:1px solid var(--border);width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;color:var(--sub);">✕</button>
      </div>
      <div class="policy-text">${info.texte}</div>
    </div>
  `;
  document.body.appendChild(modal);
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
// PWA
// ═══════════════════════════════════════
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  setTimeout(() => { if (deferredPrompt) afficherPopupInstall(); }, 30000);
});

function afficherPopupInstall() {
  if (document.getElementById('install-popup')) return;
  const popup = document.createElement('div');
  popup.id = 'install-popup';
  popup.style.cssText = `position:fixed;bottom:84px;left:50%;transform:translateX(-50%);width:calc(100% - 40px);max-width:420px;background:var(--white);border-radius:var(--radius-lg);padding:20px;box-shadow:var(--shadow-lg);z-index:999;border:1.5px solid var(--g3);animation:popupSlideUp 0.3s cubic-bezier(0.34,1.2,0.64,1) both;`;
  popup.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
      <div style="width:48px;height:48px;background:linear-gradient(135deg,var(--g1),var(--g2));border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">💊</div>
      <div style="flex:1;">
        <div style="font-family:'Fraunces',serif;font-size:16px;font-weight:700;color:var(--text);">Installer PharmaGarde</div>
        <div style="font-size:12px;color:var(--sub);margin-top:2px;">Accès rapide depuis l'écran d'accueil</div>
      </div>
      <button onclick="this.closest('#install-popup').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--sub);width:32px;height:32px;">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:14px;">
      ${[['⚡','Rapide'],['📴','Hors ligne'],['🆓','Gratuit']].map(([e,l])=>`<div style="background:var(--bg);border-radius:var(--radius-sm);padding:10px;text-align:center;"><div style="font-size:20px;">${e}</div><div style="font-size:11px;font-weight:600;color:var(--g1);margin-top:4px;">${l}</div></div>`).join('')}
    </div>
    <button onclick="installerDepuisPopup()" style="width:100%;background:linear-gradient(135deg,var(--g1),var(--g2));color:white;border:none;border-radius:var(--radius);padding:14px;font-family:'Outfit',sans-serif;font-size:14px;font-weight:800;cursor:pointer;box-shadow:0 4px 14px rgba(0,77,42,0.3);">📲 Installer maintenant — Gratuit</button>
  `;
  document.body.appendChild(popup);
}

function installerDepuisPopup() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(r => {
    deferredPrompt = null;
    document.getElementById('install-popup')?.remove();
    if (r.outcome === 'accepted') {
      const msg = document.createElement('div');
      msg.style.cssText = `position:fixed;top:20px;left:50%;transform:translateX(-50%);background:var(--g1);color:white;padding:12px 24px;border-radius:20px;font-weight:700;z-index:9999;font-size:14px;box-shadow:var(--shadow-lg);`;
      msg.textContent = '✅ App installée avec succès !';
      document.body.appendChild(msg);
      setTimeout(() => msg.remove(), 3000);
    }
  });
}

function installerApp() {
  if (deferredPrompt) {
    afficherPopupInstall();
  } else if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    const popup = document.createElement('div');
    popup.style.cssText = `position:fixed;bottom:0;left:0;right:0;background:var(--white);border-radius:var(--radius-lg) var(--radius-lg) 0 0;padding:24px;z-index:9999;box-shadow:0 -8px 40px rgba(0,0,0,0.15);animation:popupSlideUp 0.3s ease;`;
    popup.innerHTML = `
      <div style="width:36px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 20px;"></div>
      <div style="font-family:'Fraunces',serif;font-size:20px;font-weight:700;margin-bottom:6px;color:var(--text);">Installer sur iPhone</div>
      <div style="font-size:13px;color:var(--sub);margin-bottom:20px;">3 étapes simples :</div>
      ${[['Appuyez sur 📤 en bas de Safari','L\'icône de partage'],['Faites défiler → "Sur l\'écran d\'accueil"','Dans le menu qui apparaît'],['Appuyez sur "Ajouter"','L\'app sera sur votre écran']].map((t,i)=>`
        <div style="display:flex;align-items:center;gap:12px;background:var(--bg);border-radius:var(--radius);padding:14px;margin-bottom:8px;">
          <div style="width:32px;height:32px;background:var(--g1);border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;flex-shrink:0;">${i+1}</div>
          <div><div style="font-size:14px;font-weight:600;color:var(--text);">${t[0]}</div><div style="font-size:12px;color:var(--sub);">${t[1]}</div></div>
        </div>`).join('')}
      <button onclick="this.parentElement.remove()" style="width:100%;margin-top:12px;background:var(--g1);color:white;border:none;border-radius:var(--radius);padding:14px;font-family:'Outfit',sans-serif;font-size:15px;font-weight:700;cursor:pointer;">J'ai compris ✓</button>
    `;
    document.body.appendChild(popup);
  }
}

// ═══════════════════════════════════════
// INITIALISATION
// ═══════════════════════════════════════
window.onload = async function () {
  cacherSplash();
  initDarkMode();

  document.getElementById('urgences-home').innerHTML = afficherUrgencesHome();
  document.getElementById('urgences-page').innerHTML = afficherUrgencesPage();
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

  await rechargerPharmacies();

  // Stats
  const { count } = await db.from('pharmacies')
    .select('*', { count: 'exact', head: true }).eq('actif', true);
  const statEl = document.getElementById('stat-pharmacies');
  if (statEl && count) statEl.textContent = count + '+';

  // Dernière mise à jour
  const { data: last } = await db.from('pharmacies')
    .select('created_at').eq('actif', true)
    .order('created_at', { ascending: false }).limit(1);
  const badge = document.getElementById('update-badge');
  if (badge && last?.[0]) {
    const d = new Date(last[0].created_at);
    badge.textContent = '🔄 Mis à jour le ' + d.toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
  }
};
