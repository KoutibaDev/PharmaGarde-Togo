// ═══════════════════════════════════════
// CONNEXION SUPABASE
// ═══════════════════════════════════════
const SUPABASE_URL = 'https://secjfgzzmsvatsmaxbud.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlY2pmZ3p6bXN2YXRzbWF4YnVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTQ5MzYsImV4cCI6MjA4OTA3MDkzNn0.2EYq4WZtth5QBlEr3GRoUcrHtyw3kR3brRkQEhzFqIo';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ═══════════════════════════════════════
// ÉTAT GLOBAL
// ═══════════════════════════════════════
var villeActive = 'Lomé';
var toutesPharmacies = [];
var villeToutes = 'Lomé';
var carteLeaflet = null;
var userLat = null;
var userLng = null;
var deferredPrompt;
var donneesPharmacies = [];
var darkMode = false;

// ═══════════════════════════════════════
// COORDONNÉES DES VILLES
// ═══════════════════════════════════════
var coordsVilles = {
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
var urgences = [
  { nom: "SAMU", numero: "15", numeroAffiche: "15", emoji: "🚑", couleur: "r" },
  { nom: "Police", numero: "117", numeroAffiche: "117", emoji: "👮", couleur: "b" },
  { nom: "Pompiers", numero: "118", numeroAffiche: "118", emoji: "🚒", couleur: "o" },
  { nom: "CHU Sylvanus", numero: "+22822212501", numeroAffiche: "+228 22 21 25 01", emoji: "🏥", couleur: "g" }
];

// ═══════════════════════════════════════
// VILLES BASE
// ═══════════════════════════════════════
var toutesVillesBase = [
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
  setTimeout(function() {
    var splash = document.getElementById('splash-screen');
    if (splash) {
      splash.classList.add('hide');
      setTimeout(function() {
        try { splash.remove(); } catch(e) {}
      }, 600);
    }
  }, 2400);
}

// ═══════════════════════════════════════
// MODE SOMBRE
// ═══════════════════════════════════════
function toggleDark() {
  darkMode = !darkMode;
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : '');
  var icon = document.getElementById('dark-icon');
  var iconMobile = document.getElementById('dark-icon-mobile');
  var toggle = document.getElementById('toggle-switch-mobile');
  if (icon) icon.textContent = darkMode ? '☀️' : '🌙';
  if (iconMobile) iconMobile.textContent = darkMode ? '☀️' : '🌙';
  if (toggle) toggle.classList.toggle('on', darkMode);
  localStorage.setItem('darkMode', darkMode);
}

function initDarkMode() {
  if (localStorage.getItem('darkMode') === 'true') {
    darkMode = true;
    document.documentElement.setAttribute('data-theme', 'dark');
    var icon = document.getElementById('dark-icon');
    var iconMobile = document.getElementById('dark-icon-mobile');
    var toggle = document.getElementById('toggle-switch-mobile');
    if (icon) icon.textContent = '☀️';
    if (iconMobile) iconMobile.textContent = '☀️';
    if (toggle) toggle.classList.add('on');
  }
}

// ═══════════════════════════════════════
// MENU HAMBURGER
// ═══════════════════════════════════════
function ouvrirMenu() {
  document.getElementById('nav-menu').classList.add('open');
  document.getElementById('nav-overlay').classList.add('open');
  var h = document.getElementById('hamburger');
  if (h) h.classList.add('open');
}

function fermerMenu() {
  document.getElementById('nav-menu').classList.remove('open');
  document.getElementById('nav-overlay').classList.remove('open');
  document.querySelectorAll('.hamburger').forEach(function(h) { h.classList.remove('open'); });
}

function naviguerMenu(pageId) {
  fermerMenu();
  setTimeout(function() { afficherPage(pageId, true); }, 200);
  document.querySelectorAll('.nav-menu-item').forEach(function(i) { i.classList.remove('active'); });
  var map = { 'page-home': 'menu-pharmacies', 'page-urgences': 'menu-urgences', 'page-contact': 'menu-contact' };
  if (map[pageId]) { var el = document.getElementById(map[pageId]); if (el) el.classList.add('active'); }
}

// ═══════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════
function afficherPage(pageId, slideForward) {
  if (slideForward === undefined) slideForward = true;
  document.querySelectorAll('.page').forEach(function(p) {
    p.classList.remove('active');
  });
  var page = document.getElementById(pageId);
  if (!page) return;
  page.classList.add('active');
  window.scrollTo(0, 0);

  // Navbar links
  document.querySelectorAll('.navbar-link').forEach(function(b) { b.classList.remove('active'); });
  var navMap = { 'page-home': 'nav-home', 'page-toutes': 'nav-toutes', 'page-urgences': 'nav-urgences', 'page-contact': 'nav-contact' };
  if (navMap[pageId]) { var el = document.getElementById(navMap[pageId]); if (el) el.classList.add('active'); }

  if (pageId === 'page-toutes') {
    villeToutes = villeActive;
    var select = document.getElementById('select-ville');
    if (select) select.value = villeActive;
    chargerToutesPharmacies();
  }
}

// ═══════════════════════════════════════
// METTRE À JOUR LA VILLE AFFICHÉE
// ═══════════════════════════════════════
function mettreAJourVilleAffichee(ville) {
  var locMain = document.getElementById('loc-main');
  var locMainHero = document.getElementById('loc-main-hero');
  if (locMain) locMain.textContent = ville;
  if (locMainHero) locMainHero.textContent = ville + ' ✓';
}

// ═══════════════════════════════════════
// CHARGER PHARMACIES
// ═══════════════════════════════════════
async function chargerPharmacies(ville) {
  try {
    var query = db.from('pharmacies').select('*').eq('actif', true);
    if (ville) query = query.eq('ville', ville);
    var result = await query;
    if (result.error) throw result.error;
    return result.data || [];
  } catch(e) {
    console.error('Erreur Supabase:', e);
    return [];
  }
}

// ═══════════════════════════════════════
// DISTANCE GPS
// ═══════════════════════════════════════
function calculerDistance(lat1, lng1, lat2, lng2) {
  var R = 6371;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLng = (lng2 - lng1) * Math.PI / 180;
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ═══════════════════════════════════════
// PHARMACIE LA PLUS PROCHE
// ═══════════════════════════════════════
function trouverPlusProche(pharmacies) {
  if (!pharmacies.length) return null;
  if (userLat && userLng) {
    var plusProche = null;
    var distMin = Infinity;
    pharmacies.forEach(function(p) {
      var pLat = p.latitude || (coordsVilles[p.ville] ? coordsVilles[p.ville].lat : null);
      var pLng = p.longitude || (coordsVilles[p.ville] ? coordsVilles[p.ville].lng : null);
      if (!pLat || !pLng) return;
      var dist = calculerDistance(userLat, userLng, pLat, pLng);
      if (dist < distMin) {
        distMin = dist;
        plusProche = Object.assign({}, p, { distanceKm: dist, pLat: pLat, pLng: pLng });
      }
    });
    return plusProche || pharmacies[0];
  }
  return pharmacies.find(function(p) { return p.garde === '24h/24'; }) || pharmacies[0];
}

function afficherPlusProche(pharmacies) {
  if (!pharmacies.length) return;
  var plusProche = trouverPlusProche(pharmacies);
  if (!plusProche) return;
  document.getElementById('plus-proche-section').style.display = 'block';
  document.getElementById('plus-proche-card').innerHTML = afficherPharmacie(Object.assign({}, plusProche, { _plusProche: true }));
}

// ═══════════════════════════════════════
// RECHERCHE
// ═══════════════════════════════════════
function rechercherPharmacie(terme) {
  if (!terme.trim()) {
    document.getElementById('liste-pharmacies').innerHTML =
      donneesPharmacies.slice(0, 3).map(function(p) { return afficherPharmacie(p); }).join('');
    document.getElementById('count-badge').textContent =
      donneesPharmacies.length + ' trouvée' + (donneesPharmacies.length > 1 ? 's' : '');
    return;
  }
  var t = terme.toLowerCase();
  var res = donneesPharmacies.filter(function(p) {
    return (p.nom && p.nom.toLowerCase().includes(t)) ||
           (p.adresse && p.adresse.toLowerCase().includes(t)) ||
           (p.zone && p.zone.toLowerCase().includes(t));
  });
  document.getElementById('liste-pharmacies').innerHTML = res.length
    ? res.map(function(p) { return afficherPharmacie(p); }).join('')
    : '<div style="text-align:center;padding:48px;color:var(--sub);"><div style="font-size:40px;margin-bottom:12px;">🔍</div><div style="font-weight:700;font-size:16px;">Aucun résultat pour "' + terme + '"</div></div>';
  document.getElementById('count-badge').textContent = res.length + ' résultat' + (res.length > 1 ? 's' : '');
}

// ═══════════════════════════════════════
// PARTAGE WHATSAPP
// ═══════════════════════════════════════
function partagerWhatsApp(p) {
  var texte = '💊 *' + p.nom + '*\n📍 ' + (p.adresse || '') + ', ' + p.ville +
    '\n📞 ' + (p.tel_affiche || p.tel || 'Non précisé') +
    (p.assurances ? '\n🏥 Assurances: ' + p.assurances : '') +
    '\n\n_Trouvé sur PharmaGarde Togo_ 🇹🇬\n👉 pharma-garde-togo.vercel.app';
  window.open('https://wa.me/?text=' + encodeURIComponent(texte), '_blank');
}

// ═══════════════════════════════════════
// SIGNALER ERREUR
// ═══════════════════════════════════════
function signalerErreur(nom) {
  var texte = 'Bonjour PharmaGarde 👋\n\nErreur concernant :\n*' + nom + '*\n\nDétails : ';
  window.open('https://wa.me/22879538131?text=' + encodeURIComponent(texte), '_blank');
}

// ═══════════════════════════════════════
// POPUP PHARMACIE
// ═══════════════════════════════════════
function ouvrirPopup(p) {
  var assurances = (p.assurances || '').split(',').filter(function(a) { return a.trim(); });
  var assurancesHtml = assurances.length
    ? assurances.map(function(a) { return '<span class="assur-tag">' + a.trim() + '</span>'; }).join('')
    : '<span style="color:var(--sub);font-size:12px;">Aucune précisée</span>';

  var tel = (p.tel || '').replace(/\s/g, '');
  var chipClass = p.garde === '24h/24' ? 'h24' : 'soir';
  var chipLabel = p.garde === '24h/24' ? '🌛 Ouvert 24h/24' : '🌆 De garde ce soir';
  var coords = coordsVilles[p.ville] || coordsVilles['Lomé'];
  var pharmLat = p.latitude || p.pLat || coords.lat;
  var pharmLng = p.longitude || p.pLng || coords.lng;
  var nomEscape = p.nom.replace(/'/g, "\\'");
  var adresseEscape = (p.adresse || '').replace(/'/g, "\\'");

  document.getElementById('popup-content').innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">' +
      '<div style="flex:1;padding-right:12px;">' +
        '<div style="font-family:\'Fraunces\',serif;font-size:22px;font-weight:700;color:var(--text);line-height:1.2;margin-bottom:10px;">' + p.nom + '</div>' +
        '<span class="garde-chip ' + chipClass + '">' + chipLabel + '</span>' +
      '</div>' +
      '<button onclick="fermerPopup()" style="background:var(--bg);border:1px solid var(--border);width:34px;height:34px;border-radius:50%;font-size:16px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:var(--sub);">✕</button>' +
    '</div>' +
    '<div style="background:var(--bg);border-radius:var(--radius);padding:14px;margin-bottom:14px;border:1px solid var(--border);">' +
      '<div class="meta-row" style="margin-bottom:8px;"><span>📍</span><span style="color:var(--text);font-weight:500;">' + (p.adresse || 'Non précisée') + '</span></div>' +
      '<div class="meta-row" style="margin-bottom:8px;"><span>🏙️</span><span style="color:var(--text);">' + p.ville + (p.zone ? ' · Zone ' + p.zone : '') + '</span></div>' +
      '<div class="meta-row"><span>📞</span><span style="color:var(--text);font-weight:700;font-size:15px;">' + (p.tel_affiche || p.tel || 'Non précisé') + '</span></div>' +
    '</div>' +
    (assurances.length ? '<div style="margin-bottom:14px;"><div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:var(--sub);margin-bottom:8px;">Assurances</div><div style="display:flex;gap:6px;flex-wrap:wrap;">' + assurancesHtml + '</div></div>' : '') +
    '<div style="border-radius:var(--radius);overflow:hidden;margin-bottom:14px;border:1px solid var(--border);">' +
      '<div id="popup-map" style="height:180px;width:100%;"></div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">' +
      '<button onclick="lancerItineraire(\'' + nomEscape + '\',\'' + adresseEscape + '\',\'' + p.ville + '\',' + pharmLat + ',' + pharmLng + ')" style="background:var(--g1);color:white;border:none;border-radius:var(--radius);padding:13px;font-family:\'Outfit\',sans-serif;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">🧭 Itinéraire</button>' +
      (tel ? '<a href="tel:' + tel + '" style="background:#EFF6FF;color:#1D4ED8;border-radius:var(--radius);padding:13px;font-family:\'Outfit\',sans-serif;font-size:13px;font-weight:700;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px;">📞 Appeler</a>' : '<div></div>') +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">' +
      (tel ? '<a href="https://wa.me/' + tel.replace('+','') + '" target="_blank" style="background:#F0FDF4;color:#15803D;border:1px solid #86EFAC;border-radius:var(--radius);padding:13px;font-family:\'Outfit\',sans-serif;font-size:13px;font-weight:700;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px;">💬 WhatsApp</a>' : '<div></div>') +
      '<button onclick="partagerWhatsApp(' + JSON.stringify(p).replace(/"/g, '&quot;') + ')" style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:13px;font-family:\'Outfit\',sans-serif;font-size:13px;font-weight:700;cursor:pointer;color:var(--text);display:flex;align-items:center;justify-content:center;gap:6px;">📤 Partager</button>' +
    '</div>' +
    '<button onclick="signalerErreur(\'' + nomEscape + '\')" style="width:100%;background:none;border:1px solid var(--border);border-radius:var(--radius);padding:10px;font-family:\'Outfit\',sans-serif;font-size:12px;font-weight:600;cursor:pointer;color:var(--sub);display:flex;align-items:center;justify-content:center;gap:6px;">⚠️ Signaler une erreur</button>';

  document.getElementById('popup-overlay').style.display = 'block';
  document.getElementById('popup-pharmacie').style.display = 'block';

  setTimeout(function() {
    var popupMap = L.map('popup-map', { zoomControl: false, dragging: false, scrollWheelZoom: false })
      .setView([pharmLat, pharmLng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(popupMap);
    var iconP = L.divIcon({
      html: '<div style="background:#004D2A;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;">💊</div>',
      iconSize: [32,32], iconAnchor: [16,16], className: ''
    });
    L.marker([pharmLat, pharmLng], { icon: iconP }).addTo(popupMap).bindPopup('<b>' + p.nom + '</b>').openPopup();
    if (userLat && userLng) {
      var iconU = L.divIcon({
        html: '<div style="background:#1D4ED8;color:white;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;">📍</div>',
        iconSize: [26,26], iconAnchor: [13,13], className: ''
      });
      L.marker([userLat, userLng], { icon: iconU }).addTo(popupMap);
      L.polyline([[userLat, userLng], [pharmLat, pharmLng]], { color: '#004D2A', weight: 2, dashArray: '6,6', opacity: 0.6 }).addTo(popupMap);
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
  var coordsV = coordsVilles[ville] || coordsVilles['Lomé'];
  var lat = pharmLat || coordsV.lat;
  var lng = pharmLng || coordsV.lng;

  document.getElementById('popup-content').innerHTML =
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">' +
      '<button onclick="fermerPopup()" style="background:var(--bg);border:1px solid var(--border);width:36px;height:36px;border-radius:50%;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--sub);">‹</button>' +
      '<div><div style="font-family:\'Fraunces\',serif;font-size:18px;font-weight:700;color:var(--text);">' + nom + '</div>' +
      '<div style="font-size:12px;color:var(--sub);">' + (adresse || '') + ' · ' + ville + '</div></div>' +
    '</div>' +
    (userLat && userLng
      ? '<div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:var(--radius);padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;gap:10px;"><span style="font-size:20px;">📍</span><div><div style="font-size:13px;font-weight:700;color:#1D4ED8;">GPS actif</div><div style="font-size:11px;color:var(--sub);">Itinéraire depuis votre position</div></div></div>'
      : '<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:var(--radius);padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;gap:10px;"><span style="font-size:20px;">⚠️</span><div><div style="font-size:13px;font-weight:700;color:#D97706;">GPS non activé</div><div style="font-size:11px;color:var(--sub);">Activez votre GPS pour un itinéraire précis</div></div></div>') +
    '<div id="carte-itineraire" style="height:300px;border-radius:var(--radius);overflow:hidden;border:1px solid var(--border);margin-bottom:14px;"></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
      '<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:14px;text-align:center;"><div style="font-family:\'Fraunces\',serif;font-size:24px;font-weight:700;color:var(--g1);" id="distance-val">—</div><div style="font-size:11px;color:var(--sub);margin-top:4px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Distance</div></div>' +
      '<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:14px;text-align:center;"><div style="font-family:\'Fraunces\',serif;font-size:24px;font-weight:700;color:var(--g1);" id="temps-val">—</div><div style="font-size:11px;color:var(--sub);margin-top:4px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">À pied</div></div>' +
    '</div>';

  setTimeout(function() {
    var carte = L.map('carte-itineraire').setView([lat, lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(carte);
    var iconP = L.divIcon({
      html: '<div style="background:#004D2A;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 3px 10px rgba(0,0,0,0.3);border:2px solid white;">💊</div>',
      iconSize: [36,36], iconAnchor: [18,18], className: ''
    });
    L.marker([lat, lng], { icon: iconP }).addTo(carte).bindPopup('<b>' + nom + '</b>').openPopup();
    if (userLat && userLng) {
      var iconU = L.divIcon({
        html: '<div style="background:#1D4ED8;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 3px 10px rgba(0,0,0,0.3);border:2px solid white;">🧑</div>',
        iconSize: [32,32], iconAnchor: [16,16], className: ''
      });
      L.marker([userLat, userLng], { icon: iconU }).addTo(carte).bindPopup('Vous êtes ici');
      L.polyline([[userLat, userLng], [lat, lng]], { color: '#004D2A', weight: 4, dashArray: '10,6', opacity: 0.85 }).addTo(carte);
      carte.fitBounds([[userLat, userLng], [lat, lng]], { padding: [30,30] });
      var dist = calculerDistance(userLat, userLng, lat, lng);
      document.getElementById('distance-val').textContent = dist < 1 ? Math.round(dist*1000)+' m' : dist.toFixed(1)+' km';
      var mins = Math.round(dist * 12);
      document.getElementById('temps-val').textContent = mins < 60 ? mins+' min' : Math.floor(mins/60)+'h '+(mins%60)+'min';
    }
  }, 250);
}

// ═══════════════════════════════════════
// AFFICHER UNE PHARMACIE
// ═══════════════════════════════════════
function afficherPharmacie(p) {
  var assurances = (p.assurances || '').split(',').filter(function(a) { return a.trim(); });
  var chipClass = p.garde === '24h/24' ? 'h24' : 'soir';
  var chipLabel = p.garde === '24h/24' ? '🌛 24h/24' : '🌆 Ce soir';
  var assurancesHtml = assurances.map(function(a) { return '<span class="assur-tag">' + a.trim() + '</span>'; }).join('');
  var tel = (p.tel || '').replace(/\s/g, '');
  var badgeProche = p._plusProche ? '<span class="badge-proche">📍 La plus proche</span>' : '';
  var pharmLat = p.latitude || p.pLat || (coordsVilles[p.ville] ? coordsVilles[p.ville].lat : 6.1375);
  var pharmLng = p.longitude || p.pLng || (coordsVilles[p.ville] ? coordsVilles[p.ville].lng : 1.2123);

  var distHtml = '';
  if (userLat && userLng) {
    var d = p.distanceKm !== undefined ? p.distanceKm : calculerDistance(userLat, userLng, pharmLat, pharmLng);
    distHtml = '<div class="meta-row"><span>📏</span>' + (d < 1 ? Math.round(d*1000)+' m' : d.toFixed(1)+' km') + ' de vous</div>';
  }

  var pData = JSON.stringify(p).replace(/"/g, '&quot;');
  var nomEscape = p.nom.replace(/'/g, "\\'");
  var adresseEscape = (p.adresse || '').replace(/'/g, "\\'");

  return '<div class="pharm-card ' + (p.garde === '24h/24' ? 'h24' : '') +
    '" onclick="ouvrirPopup(JSON.parse(this.dataset.p.replace(/&quot;/g,\'\\\"\')))' +
    '" data-p="' + pData + '">' +
    '<div class="card-head">' +
      '<div class="pharm-name">' + p.nom + badgeProche + '</div>' +
      '<div class="garde-chip ' + chipClass + '">' + chipLabel + '</div>' +
    '</div>' +
    '<div class="card-meta">' +
      '<div class="meta-row"><span>📍</span>' + (p.adresse || 'Non précisée') + '</div>' +
      '<div class="meta-row"><span>📞</span>' + (p.tel_affiche || p.tel || 'Non précisé') + '</div>' +
      distHtml +
      (assurancesHtml ? '<div class="assurance-row">' + assurancesHtml + '</div>' : '') +
    '</div>' +
    '<div class="card-actions">' +
      (tel ? '<a href="tel:' + tel + '" class="btn-call" onclick="event.stopPropagation()">📞 Appeler</a>' : '<div class="btn-call" style="background:#9CA3AF;cursor:not-allowed;">Non précisé</div>') +
      (tel ? '<a href="https://wa.me/' + tel.replace('+','') + '" target="_blank" class="btn-icon" onclick="event.stopPropagation()">💬</a>' : '') +
      '<div class="btn-icon" title="Partager" onclick="event.stopPropagation();partagerWhatsApp(JSON.parse(this.closest(\'[data-p]\').dataset.p.replace(/&quot;/g,\'\\\"\')))">📤</div>' +
      '<div class="btn-icon" title="Itinéraire" onclick="event.stopPropagation();lancerItineraire(\'' + nomEscape + '\',\'' + adresseEscape + '\',\'' + p.ville + '\',' + pharmLat + ',' + pharmLng + ');document.getElementById(\'popup-overlay\').style.display=\'block\';document.getElementById(\'popup-pharmacie\').style.display=\'block\';">🧭</div>' +
    '</div>' +
  '</div>';
}

// ═══════════════════════════════════════
// RECHARGER PHARMACIES
// ═══════════════════════════════════════
async function rechargerPharmacies() {
  document.getElementById('liste-pharmacies').innerHTML =
    '<div style="text-align:center;padding:48px;color:var(--sub);"><div style="font-size:32px;margin-bottom:12px;">⏳</div><div style="font-weight:600;">Chargement...</div></div>';
  var data = await chargerPharmacies(villeActive);
  donneesPharmacies = data;
  if (!data.length) {
    document.getElementById('liste-pharmacies').innerHTML =
      '<div style="text-align:center;padding:48px;color:var(--sub);"><div style="font-size:40px;margin-bottom:12px;">🔍</div><div style="font-weight:700;">Aucune pharmacie trouvée</div><div style="font-size:13px;margin-top:6px;">pour ' + villeActive + '</div></div>';
    document.getElementById('count-badge').textContent = '0';
    return;
  }
  document.getElementById('liste-pharmacies').innerHTML =
    data.slice(0, 3).map(function(p) { return afficherPharmacie(p); }).join('');
  document.getElementById('count-badge').textContent =
    data.length + ' trouvée' + (data.length > 1 ? 's' : '');
  afficherPlusProche(data);
}

// ═══════════════════════════════════════
// PAGE TOUTES
// ═══════════════════════════════════════
async function chargerToutesPharmacies() {
  document.getElementById('liste-toutes').innerHTML =
    '<div style="text-align:center;padding:48px;color:var(--sub);"><div style="font-size:32px;margin-bottom:12px;">⏳</div><div>Chargement...</div></div>';
  toutesPharmacies = await chargerPharmacies(villeToutes);
  document.getElementById('count-toutes').textContent =
    toutesPharmacies.length + ' trouvée' + (toutesPharmacies.length > 1 ? 's' : '');
  document.getElementById('liste-toutes').innerHTML =
    toutesPharmacies.map(function(p) { return afficherPharmacie(p); }).join('');
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
  var coords = coordsVilles[villeToutes] || coordsVilles['Lomé'];
  if (carteLeaflet) { carteLeaflet.remove(); carteLeaflet = null; }
  setTimeout(function() {
    carteLeaflet = L.map('carte-lome').setView([coords.lat, coords.lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(carteLeaflet);
    toutesPharmacies.forEach(function(p) {
      var pLat = p.latitude || (coords.lat + (Math.random()-0.5)*0.04);
      var pLng = p.longitude || (coords.lng + (Math.random()-0.5)*0.04);
      var icon = L.divIcon({
        html: '<div style="background:#004D2A;color:white;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:1.5px solid white;">💊</div>',
        iconSize: [26,26], iconAnchor: [13,13], className: ''
      });
      L.marker([pLat, pLng], { icon: icon })
        .addTo(carteLeaflet)
        .bindPopup('<b>' + p.nom + '</b><br>' + (p.adresse || '') + '<br>📞 ' + (p.tel_affiche || p.tel || ''));
    });
  }, 150);
}

// ═══════════════════════════════════════
// URGENCES
// ═══════════════════════════════════════
function afficherUrgencesHome() {
  return urgences.map(function(u) {
    return '<a href="tel:' + u.numero + '" class="urg-card ' + u.couleur + '" style="text-decoration:none;"><div class="urg-emoji">' + u.emoji + '</div><div class="urg-name">' + u.nom + '</div><div class="urg-num">' + u.numeroAffiche + '</div></a>';
  }).join('');
}

function afficherUrgencesPage() {
  var bg = { r:'#FEF2F2', b:'#EFF6FF', o:'#FFFBEB', g:'#F0FDF4' };
  var tc = { r:'#DC2626', b:'#2563EB', o:'#D97706', g:'#15803D' };
  return urgences.map(function(u) {
    return '<a href="tel:' + u.numero + '" class="urg-full" style="text-decoration:none;"><div class="urg-full-icon" style="background:' + bg[u.couleur] + ';">' + u.emoji + '</div><div class="urg-full-info"><div class="urg-full-name">' + u.nom + '</div><div class="urg-full-sub">Appuyez pour appeler</div></div><div class="urg-full-num" style="color:' + tc[u.couleur] + ';">' + u.numeroAffiche + '</div></a>';
  }).join('');
}

// ═══════════════════════════════════════
// VILLES
// ═══════════════════════════════════════
async function afficherVilles(filtre) {
  if (!filtre) filtre = '';
  var result = await db.from('pharmacies').select('ville').eq('actif', true);
  var data = result.data || [];
  var compteur = {};
  data.forEach(function(p) {
    var v = p.ville ? p.ville.trim() : null;
    if (v) compteur[v] = (compteur[v] || 0) + 1;
  });
  var villesDisponibles = Object.keys(compteur).sort();
  var select = document.getElementById('select-ville');
  if (select) {
    select.innerHTML = villesDisponibles.map(function(v) {
      var base = toutesVillesBase.find(function(b) { return b.nom === v; });
      return '<option value="' + v + '">' + (base ? base.emoji : '🏘️') + ' ' + v + '</option>';
    }).join('');
  }
  var statVilles = document.getElementById('stat-villes');
  if (statVilles) statVilles.textContent = villesDisponibles.length;
  var liste = filtre
    ? villesDisponibles.filter(function(v) { return v.toLowerCase().includes(filtre.toLowerCase()); })
    : villesDisponibles;
  return liste.map(function(v) {
    var base = toutesVillesBase.find(function(b) { return b.nom === v; });
    var emoji = base ? base.emoji : '🏘️';
    var nb = compteur[v] || 0;
    return '<div class="ville-item" onclick="choisirVille(\'' + v + '\')">' +
      '<span style="font-size:24px">' + emoji + '</span>' +
      '<div style="flex:1;"><div class="ville-name">' + v + '</div><div class="ville-count">' + nb + ' pharmacie' + (nb > 1 ? 's' : '') + '</div></div>' +
      '<span style="color:var(--sub);font-size:18px;">›</span>' +
    '</div>';
  }).join('');
}

async function filtrerVilles(valeur) {
  document.getElementById('liste-villes').innerHTML = await afficherVilles(valeur);
}

async function choisirVille(ville) {
  villeActive = ville;
  mettreAJourVilleAffichee(ville);
  afficherPage('page-home', false);
  await rechargerPharmacies();
}

// ═══════════════════════════════════════
// POLITIQUES
// ═══════════════════════════════════════
function ouvrirPolitique(type) {
  var contenu = {
    confidentialite: { titre: '🔒 Politique de confidentialité', texte: '<h3>Collecte de données</h3><p>PharmaGarde Togo ne collecte aucune donnée personnelle. Votre GPS est utilisé localement pour afficher les pharmacies proches, jamais stocké.</p><h3>Cookies</h3><p>Un seul cookie localStorage pour mémoriser votre thème sombre/clair.</p><h3>Contact</h3><p>pharmagardetogo@gmail.com</p>' },
    conditions: { titre: '📄 Conditions d\'utilisation', texte: '<h3>Service gratuit</h3><p>PharmaGarde Togo est un service gratuit d\'information sur les pharmacies de garde.</p><h3>Exactitude</h3><p>Données mises à jour chaque lundi. Appelez avant de vous déplacer.</p><h3>Responsabilité</h3><p>Nous ne pouvons garantir qu\'une pharmacie affichée soit effectivement ouverte.</p>' },
    cookies: { titre: '🍪 Politique cookies', texte: '<h3>Cookie utilisé</h3><p>darkMode (localStorage) : mémorise votre préférence de thème. Aucun cookie publicitaire.</p><h3>Cookies tiers</h3><p>OpenStreetMap peut déposer des cookies techniques pour les cartes.</p>' }
  };
  var info = contenu[type];
  if (!info) return;
  var modal = document.createElement('div');
  modal.className = 'policy-modal';
  modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
  modal.innerHTML = '<div class="policy-content"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><div class="policy-title">' + info.titre + '</div><button onclick="this.closest(\'.policy-modal\').remove()" style="background:var(--bg);border:1px solid var(--border);width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;color:var(--sub);">✕</button></div><div class="policy-text">' + info.texte + '</div></div>';
  document.body.appendChild(modal);
}

// ═══════════════════════════════════════
// WHATSAPP CONTACT
// ═══════════════════════════════════════
function envoyerWhatsApp() {
  var numero = document.getElementById('input-tel').value;
  var ville = document.getElementById('input-ville').value;
  var message = document.getElementById('input-message').value;
  if (!message.trim()) { alert('Veuillez écrire un message.'); return; }
  var texte = 'Bonjour PharmaGarde Togo 👋\n\nVille: ' + ville + '\nNuméro: ' + numero + '\n\nMessage: ' + message;
  window.open('https://wa.me/22879538131?text=' + encodeURIComponent(texte), '_blank');
}

// ═══════════════════════════════════════
// PWA
// ═══════════════════════════════════════
window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  deferredPrompt = e;
  setTimeout(function() { if (deferredPrompt) afficherPopupInstall(); }, 30000);
});

function afficherPopupInstall() {
  if (document.getElementById('install-popup')) return;
  var popup = document.createElement('div');
  popup.id = 'install-popup';
  popup.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);width:calc(100% - 40px);max-width:420px;background:var(--white);border-radius:var(--radius-lg);padding:20px;box-shadow:var(--shadow-lg);z-index:999;border:1.5px solid var(--g3);';
  popup.innerHTML = '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;"><div style="width:48px;height:48px;background:linear-gradient(135deg,var(--g1),var(--g2));border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">💊</div><div style="flex:1;"><div style="font-family:\'Fraunces\',serif;font-size:16px;font-weight:700;color:var(--text);">Installer PharmaGarde</div><div style="font-size:12px;color:var(--sub);margin-top:2px;">Accès rapide depuis l\'écran d\'accueil</div></div><button onclick="this.closest(\'#install-popup\').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--sub);">✕</button></div><button onclick="installerDepuisPopup()" style="width:100%;background:linear-gradient(135deg,var(--g1),var(--g2));color:white;border:none;border-radius:var(--radius);padding:14px;font-family:\'Outfit\',sans-serif;font-size:14px;font-weight:800;cursor:pointer;">📲 Installer maintenant — Gratuit</button>';
  document.body.appendChild(popup);
}

function installerDepuisPopup() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(function(r) {
    deferredPrompt = null;
    var p = document.getElementById('install-popup');
    if (p) p.remove();
    if (r.outcome === 'accepted') {
      var msg = document.createElement('div');
      msg.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:var(--g1);color:white;padding:12px 24px;border-radius:20px;font-weight:700;z-index:9999;font-size:14px;';
      msg.textContent = '✅ App installée avec succès !';
      document.body.appendChild(msg);
      setTimeout(function() { msg.remove(); }, 3000);
    }
  });
}

function installerApp() {
  if (deferredPrompt) { afficherPopupInstall(); }
  else if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    var popup = document.createElement('div');
    popup.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:var(--white);border-radius:var(--radius-lg) var(--radius-lg) 0 0;padding:24px;z-index:9999;box-shadow:0 -8px 40px rgba(0,0,0,0.15);';
    popup.innerHTML = '<div style="width:36px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 20px;"></div><div style="font-family:\'Fraunces\',serif;font-size:20px;font-weight:700;margin-bottom:16px;color:var(--text);">Installer sur iPhone</div><div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;"><div style="display:flex;align-items:center;gap:12px;background:var(--bg);border-radius:var(--radius);padding:14px;"><div style="width:32px;height:32px;background:var(--g1);border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;flex-shrink:0;">1</div><div style="font-size:14px;font-weight:600;color:var(--text);">Appuyez sur 📤 en bas de Safari</div></div><div style="display:flex;align-items:center;gap:12px;background:var(--bg);border-radius:var(--radius);padding:14px;"><div style="width:32px;height:32px;background:var(--g1);border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;flex-shrink:0;">2</div><div style="font-size:14px;font-weight:600;color:var(--text);">Faites défiler → "Sur l\'écran d\'accueil"</div></div><div style="display:flex;align-items:center;gap:12px;background:var(--bg);border-radius:var(--radius);padding:14px;"><div style="width:32px;height:32px;background:var(--g1);border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;flex-shrink:0;">3</div><div style="font-size:14px;font-weight:600;color:var(--text);">Appuyez sur "Ajouter"</div></div></div><button onclick="this.parentElement.remove()" style="width:100%;background:var(--g1);color:white;border:none;border-radius:var(--radius);padding:14px;font-family:\'Outfit\',sans-serif;font-size:15px;font-weight:700;cursor:pointer;">J\'ai compris ✓</button>';
    document.body.appendChild(popup);
  }
}

// ═══════════════════════════════════════
// INITIALISATION
// ═══════════════════════════════════════
window.onload = async function() {
  cacherSplash();
  initDarkMode();

  document.getElementById('urgences-home').innerHTML = afficherUrgencesHome();
  document.getElementById('urgences-page').innerHTML = afficherUrgencesPage();
  document.getElementById('liste-villes').innerHTML = await afficherVilles();

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(pos) {
        userLat = pos.coords.latitude;
        userLng = pos.coords.longitude;
        mettreAJourVilleAffichee('Lomé ✓');
        var sub = document.getElementById('loc-sub');
        if (sub) sub.textContent = 'GPS actif · Cliquez pour changer';
      },
      function() {
        mettreAJourVilleAffichee('Lomé');
      }
    );
  }

  await rechargerPharmacies();

  try {
    var countResult = await db.from('pharmacies').select('*', { count: 'exact', head: true }).eq('actif', true);
    var statEl = document.getElementById('stat-pharmacies');
    if (statEl && countResult.count) statEl.textContent = countResult.count + '+';
  } catch(e) {}

  try {
    var lastResult = await db.from('pharmacies').select('created_at').eq('actif', true).order('created_at', { ascending: false }).limit(1);
    var badge = document.getElementById('update-badge');
    if (badge && lastResult.data && lastResult.data[0]) {
      var d = new Date(lastResult.data[0].created_at);
      badge.textContent = '🔄 Mis à jour le ' + d.toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
    }
  } catch(e) {}
};
