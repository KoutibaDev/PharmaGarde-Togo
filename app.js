// ═══════════════════════════════════════
// SUPABASE
// ═══════════════════════════════════════
var SUPABASE_URL = 'https://secjfgzzmsvatsmaxbud.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlY2pmZ3p6bXN2YXRzbWF4YnVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTQ5MzYsImV4cCI6MjA4OTA3MDkzNn0.2EYq4WZtth5QBlEr3GRoUcrHtyw3kR3brRkQEhzFqIo';
var db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ═══════════════════════════════════════
// ÉTAT
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
// COORDONNÉES
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
  { nom: 'SAMU', numero: '15', numeroAffiche: '15', emoji: '🚑', couleur: 'r' },
  { nom: 'Police', numero: '117', numeroAffiche: '117', emoji: '👮', couleur: 'b' },
  { nom: 'Pompiers', numero: '118', numeroAffiche: '118', emoji: '🚒', couleur: 'o' },
  { nom: 'CHU Sylvanus', numero: '+22822212501', numeroAffiche: '+228 22 21 25 01', emoji: '🏥', couleur: 'g' }
];

// ═══════════════════════════════════════
// VILLES
// ═══════════════════════════════════════
var toutesVillesBase = [
  { nom: 'Lomé', emoji: '🏙️' },
  { nom: 'Kpalimé', emoji: '🌳' },
  { nom: 'Kara', emoji: '⛰️' },
  { nom: 'Sokodé', emoji: '🌾' },
  { nom: 'Dapaong', emoji: '🏜️' },
  { nom: 'Tsévié', emoji: '🌊' },
  { nom: 'Atakpamé', emoji: '🌴' }
];

// ═══════════════════════════════════════
// SPLASH
// ═══════════════════════════════════════
function cacherSplash() {
  setTimeout(function() {
    var s = document.getElementById('splash-screen');
    if (!s) return;
    s.classList.add('hide');
    setTimeout(function() { try { s.remove(); } catch(e) {} }, 700);
  }, 2500);
}

// ═══════════════════════════════════════
// MODE SOMBRE
// ═══════════════════════════════════════
function toggleDark() {
  darkMode = !darkMode;
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : '');
  var i = document.getElementById('dark-icon');
  var im = document.getElementById('dark-icon-mobile');
  var t = document.getElementById('toggle-switch-mobile');
  if (i) i.textContent = darkMode ? '☀️' : '🌙';
  if (im) im.textContent = darkMode ? '☀️' : '🌙';
  if (t) t.classList.toggle('on', darkMode);
  localStorage.setItem('darkMode', darkMode);
}

function initDarkMode() {
  if (localStorage.getItem('darkMode') !== 'true') return;
  darkMode = true;
  document.documentElement.setAttribute('data-theme', 'dark');
  var i = document.getElementById('dark-icon');
  var im = document.getElementById('dark-icon-mobile');
  var t = document.getElementById('toggle-switch-mobile');
  if (i) i.textContent = '☀️';
  if (im) im.textContent = '☀️';
  if (t) t.classList.add('on');
}

// ═══════════════════════════════════════
// MENU
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
  var map = { 'page-home': 'menu-pharmacies', 'page-toutes': 'menu-toutes', 'page-urgences': 'menu-urgences', 'page-contact': 'menu-contact' };
  if (map[pageId]) { var el = document.getElementById(map[pageId]); if (el) el.classList.add('active'); }
}

// ═══════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════
function afficherPage(pageId, slideForward) {
  if (slideForward === undefined) slideForward = true;
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  var page = document.getElementById(pageId);
  if (!page) return;
  page.classList.add('active');
  window.scrollTo(0, 0);
  document.querySelectorAll('.navbar-link').forEach(function(b) { b.classList.remove('active'); });
  var navMap = { 'page-home': 'nav-home', 'page-toutes': 'nav-toutes', 'page-urgences': 'nav-urgences', 'page-contact': 'nav-contact' };
  if (navMap[pageId]) { var el = document.getElementById(navMap[pageId]); if (el) el.classList.add('active'); }
  if (pageId === 'page-toutes') {
    villeToutes = villeActive;
    var sel = document.getElementById('select-ville');
    if (sel) sel.value = villeActive;
    chargerToutesPharmacies();
  }
}

function mettreAJourVille(ville) {
  var el1 = document.getElementById('loc-main');
  var el2 = document.getElementById('loc-main-hero');
  if (el1) el1.textContent = ville;
  if (el2) el2.textContent = ville;
}

// ═══════════════════════════════════════
// SUPABASE
// ═══════════════════════════════════════
async function chargerPharmacies(ville) {
  try {
    var q = db.from('pharmacies').select('*').eq('actif', true);
    if (ville) q = q.eq('ville', ville);
    var r = await q;
    if (r.error) throw r.error;
    return r.data || [];
  } catch(e) { console.error(e); return []; }
}

// ═══════════════════════════════════════
// GPS
// ═══════════════════════════════════════
function calculerDistance(lat1, lng1, lat2, lng2) {
  var R = 6371;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLng = (lng2 - lng1) * Math.PI / 180;
  var a = Math.sin(dLat/2)*Math.sin(dLat/2) +
    Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)*Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function trouverPlusProche(pharmacies) {
  if (!pharmacies.length) return null;
  if (userLat && userLng) {
    var best = null, bestDist = Infinity;
    pharmacies.forEach(function(p) {
      var pLat = p.latitude || (coordsVilles[p.ville] ? coordsVilles[p.ville].lat : null);
      var pLng = p.longitude || (coordsVilles[p.ville] ? coordsVilles[p.ville].lng : null);
      if (!pLat || !pLng) return;
      var d = calculerDistance(userLat, userLng, pLat, pLng);
      if (d < bestDist) { bestDist = d; best = Object.assign({}, p, { distanceKm: d, pLat: pLat, pLng: pLng }); }
    });
    return best || pharmacies[0];
  }
  return pharmacies.find(function(p) { return p.garde === '24h/24'; }) || pharmacies[0];
}

function afficherPlusProche(pharmacies) {
  if (!pharmacies.length) return;
  var p = trouverPlusProche(pharmacies);
  if (!p) return;
  document.getElementById('plus-proche-section').style.display = 'block';
  document.getElementById('plus-proche-card').innerHTML = renderCard(Object.assign({}, p, { _proche: true }));
}

// ═══════════════════════════════════════
// RECHERCHE
// ═══════════════════════════════════════
function rechercherPharmacie(terme) {
  if (!terme.trim()) {
    document.getElementById('liste-pharmacies').innerHTML =
      donneesPharmacies.slice(0,3).map(renderCard).join('');
    document.getElementById('count-badge').textContent =
      donneesPharmacies.length + ' trouvée' + (donneesPharmacies.length > 1 ? 's' : '');
    return;
  }
  var t = terme.toLowerCase();
  var res = donneesPharmacies.filter(function(p) {
    return (p.nom&&p.nom.toLowerCase().includes(t)) ||
           (p.adresse&&p.adresse.toLowerCase().includes(t)) ||
           (p.zone&&p.zone.toLowerCase().includes(t));
  });
  document.getElementById('liste-pharmacies').innerHTML = res.length
    ? res.map(renderCard).join('')
    : '<div style="text-align:center;padding:56px 20px;color:var(--sub);"><div style="font-size:48px;margin-bottom:16px;opacity:0.4;">🔍</div><div style="font-size:17px;font-weight:700;margin-bottom:6px;">Aucun résultat</div><div style="font-size:14px;">pour "' + terme + '"</div></div>';
  document.getElementById('count-badge').textContent = res.length + ' résultat' + (res.length > 1 ? 's' : '');
}

// ═══════════════════════════════════════
// MODAL PHARMACIE
// ═══════════════════════════════════════
function ouvrirModal(p) {
  var assurances = (p.assurances || '').split(',').filter(function(a) { return a.trim(); });
  var tel = (p.tel || '').replace(/\s/g, '');
  var coords = coordsVilles[p.ville] || coordsVilles['Lomé'];
  var pharmLat = p.latitude || p.pLat || coords.lat;
  var pharmLng = p.longitude || p.pLng || coords.lng;
  var chipClass = p.garde === '24h/24' ? 'h24' : 'soir';
  var chipLabel = p.garde === '24h/24' ? '24h/24' : 'Ce soir';
  var nomE = p.nom.replace(/'/g, "\\'");
  var adrE = (p.adresse || '').replace(/'/g, "\\'");

  var distHtml = '';
  if (userLat && userLng) {
    var d = p.distanceKm !== undefined ? p.distanceKm : calculerDistance(userLat, userLng, pharmLat, pharmLng);
    distHtml = '<div class="modal-info-row"><div class="modal-info-icon" style="background:#F0FDF4;">📏</div><div><div class="modal-info-label">Distance</div><div class="modal-info-value">' + (d < 1 ? Math.round(d*1000)+' m' : d.toFixed(1)+' km') + ' de vous</div></div></div>';
  }

  var assurHtml = assurances.length
    ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;">' + assurances.map(function(a) { return '<span class="assur-tag">' + a.trim() + '</span>'; }).join('') + '</div>'
    : '<span style="font-size:13px;color:var(--sub);">Aucune précisée</span>';

  document.getElementById('modal-content').innerHTML =
    '<div class="modal-header">' +
      '<div style="flex:1;">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">' +
          '<span class="garde-chip ' + chipClass + '">' + chipLabel + '</span>' +
          (p.zone ? '<span style="font-size:11px;font-weight:600;color:var(--sub);background:var(--bg);padding:3px 8px;border-radius:6px;border:1px solid var(--border);">Zone ' + p.zone + '</span>' : '') +
        '</div>' +
        '<div class="modal-name">' + p.nom + '</div>' +
      '</div>' +
      '<button class="modal-close" onclick="fermerModal()">✕</button>' +
    '</div>' +
    '<div class="modal-body">' +
      '<div class="modal-info-card">' +
        '<div class="modal-info-row"><div class="modal-info-icon" style="background:#F0FDF4;">📍</div><div><div class="modal-info-label">Adresse</div><div class="modal-info-value">' + (p.adresse || 'Non précisée') + '</div></div></div>' +
        '<div class="modal-info-row"><div class="modal-info-icon" style="background:#EFF6FF;">🏙️</div><div><div class="modal-info-label">Ville</div><div class="modal-info-value">' + p.ville + '</div></div></div>' +
        '<div class="modal-info-row"><div class="modal-info-icon" style="background:#F0FDF4;">📞</div><div><div class="modal-info-label">Téléphone</div><div class="modal-info-value phone">' + (p.tel_affiche || p.tel || 'Non précisé') + '</div></div></div>' +
        distHtml +
      '</div>' +
      '<div class="modal-section-title" style="margin-bottom:8px;">Assurances acceptées</div>' +
      assurHtml +
      '<div style="margin:16px 0;"><div id="modal-map" style="height:200px;border-radius:var(--r);overflow:hidden;border:1px solid var(--border);"></div></div>' +
      '<div class="modal-actions">' +
        '<button class="modal-btn modal-btn-primary" onclick="lancerItineraire(\'' + nomE + '\',\'' + adrE + '\',\'' + p.ville + '\',' + pharmLat + ',' + pharmLng + ')">🧭 Itinéraire</button>' +
        (tel ? '<a href="tel:' + tel + '" class="modal-btn modal-btn-call">📞 Appeler</a>' : '<div></div>') +
        (tel ? '<a href="https://wa.me/' + tel.replace('+','') + '" target="_blank" class="modal-btn modal-btn-wa">💬 WhatsApp</a>' : '<div></div>') +
        '<button class="modal-btn modal-btn-share" onclick="partagerWhatsApp(' + JSON.stringify(p).replace(/"/g,'&quot;') + ')">📤 Partager</button>' +
      '</div>' +
      '<button class="modal-btn-report" onclick="signalerErreur(\'' + nomE + '\')">⚠️ Signaler une erreur sur cette fiche</button>' +
    '</div>';

  var overlay = document.getElementById('modal-overlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  setTimeout(function() {
    var mapEl = document.getElementById('modal-map');
    if (!mapEl) return;
    var m = L.map('modal-map', { zoomControl: false, dragging: false, scrollWheelZoom: false }).setView([pharmLat, pharmLng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(m);
    var iP = L.divIcon({ html: '<div style="background:#00572A;color:white;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.25);border:2px solid white;">💊</div>', iconSize:[30,30], iconAnchor:[15,15], className:'' });
    L.marker([pharmLat, pharmLng], { icon: iP }).addTo(m).bindPopup('<b>' + p.nom + '</b>').openPopup();
    if (userLat && userLng) {
      var iU = L.divIcon({ html: '<div style="background:#2563EB;color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:11px;box-shadow:0 2px 8px rgba(0,0,0,0.25);border:2px solid white;">📍</div>', iconSize:[24,24], iconAnchor:[12,12], className:'' });
      L.marker([userLat, userLng], { icon: iU }).addTo(m);
      L.polyline([[userLat,userLng],[pharmLat,pharmLng]], { color:'#00572A', weight:2, dashArray:'5,5', opacity:0.6 }).addTo(m);
      m.fitBounds([[userLat,userLng],[pharmLat,pharmLng]], { padding:[20,20] });
    }
  }, 300);
}

function fermerModal(event) {
  if (event && event.target !== document.getElementById('modal-overlay')) return;
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ═══════════════════════════════════════
// ITINÉRAIRE
// ═══════════════════════════════════════
function lancerItineraire(nom, adresse, ville, pharmLat, pharmLng) {
  var c = coordsVilles[ville] || coordsVilles['Lomé'];
  var lat = pharmLat || c.lat, lng = pharmLng || c.lng;

  document.getElementById('modal-content').innerHTML =
    '<div class="modal-header">' +
      '<button onclick="fermerModal()" style="background:var(--bg);border:1px solid var(--border);width:32px;height:32px;border-radius:50%;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--sub);">‹</button>' +
      '<div style="flex:1;padding-left:12px;"><div class="modal-name" style="font-size:18px;">' + nom + '</div><div style="font-size:12px;color:var(--sub);">' + (adresse||'') + ' · ' + ville + '</div></div>' +
    '</div>' +
    '<div class="modal-body">' +
      (userLat&&userLng ? '<div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:var(--r);padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;gap:10px;"><div style="font-size:20px;">📍</div><div><div style="font-size:13px;font-weight:700;color:#1D4ED8;">GPS actif</div><div style="font-size:11px;color:var(--sub);">Itinéraire depuis votre position</div></div></div>'
        : '<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:var(--r);padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;gap:10px;"><div style="font-size:20px;">⚠️</div><div><div style="font-size:13px;font-weight:700;color:#D97706;">GPS non activé</div><div style="font-size:11px;color:var(--sub);">Activez votre GPS pour un itinéraire précis</div></div></div>') +
      '<div id="carte-itin" style="height:280px;border-radius:var(--r);overflow:hidden;border:1px solid var(--border);margin-bottom:14px;"></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
        '<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--r);padding:14px;text-align:center;"><div style="font-family:\'Fraunces\',serif;font-size:22px;font-weight:700;color:var(--green);" id="dist-val">—</div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--sub);margin-top:4px;">Distance</div></div>' +
        '<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--r);padding:14px;text-align:center;"><div style="font-family:\'Fraunces\',serif;font-size:22px;font-weight:700;color:var(--green);" id="temps-val">—</div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--sub);margin-top:4px;">À pied</div></div>' +
      '</div>' +
    '</div>';

  setTimeout(function() {
    var m = L.map('carte-itin').setView([lat,lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution:'© OpenStreetMap' }).addTo(m);
    var iP = L.divIcon({ html:'<div style="background:#00572A;color:white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 3px 10px rgba(0,0,0,0.25);border:2px solid white;">💊</div>', iconSize:[34,34], iconAnchor:[17,17], className:'' });
    L.marker([lat,lng], { icon:iP }).addTo(m).bindPopup('<b>'+nom+'</b>').openPopup();
    if (userLat && userLng) {
      var iU = L.divIcon({ html:'<div style="background:#2563EB;color:white;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 3px 10px rgba(0,0,0,0.25);border:2px solid white;">🧑</div>', iconSize:[30,30], iconAnchor:[15,15], className:'' });
      L.marker([userLat,userLng], { icon:iU }).addTo(m).bindPopup('Vous');
      L.polyline([[userLat,userLng],[lat,lng]], { color:'#00572A', weight:3, dashArray:'8,6', opacity:0.8 }).addTo(m);
      m.fitBounds([[userLat,userLng],[lat,lng]], { padding:[28,28] });
      var d = calculerDistance(userLat,userLng,lat,lng);
      document.getElementById('dist-val').textContent = d<1 ? Math.round(d*1000)+' m' : d.toFixed(1)+' km';
      var mins = Math.round(d*12);
      document.getElementById('temps-val').textContent = mins<60 ? mins+' min' : Math.floor(mins/60)+'h '+(mins%60)+'min';
    }
  }, 300);
}

// ═══════════════════════════════════════
// RENDER CARD
// ═══════════════════════════════════════
function renderCard(p) {
  var assurances = (p.assurances||'').split(',').filter(function(a){return a.trim();});
  var chipClass = p.garde === '24h/24' ? 'h24' : 'soir';
  var chipLabel = p.garde === '24h/24' ? '🌛 24h/24' : '🌆 Ce soir';
  var assurHtml = assurances.map(function(a){return '<span class="assur-tag">'+a.trim()+'</span>';}).join('');
  var tel = (p.tel||'').replace(/\s/g,'');
  var proche = p._proche ? '<span class="badge-proche">La plus proche</span>' : '';
  var pharmLat = p.latitude||p.pLat||(coordsVilles[p.ville]?coordsVilles[p.ville].lat:6.1375);
  var pharmLng = p.longitude||p.pLng||(coordsVilles[p.ville]?coordsVilles[p.ville].lng:1.2123);

  var distHtml = '';
  if (userLat && userLng) {
    var d = p.distanceKm!==undefined ? p.distanceKm : calculerDistance(userLat,userLng,pharmLat,pharmLng);
    distHtml = '<div class="meta-row"><span class="meta-icon">📏</span>'+(d<1?Math.round(d*1000)+' m':d.toFixed(1)+' km')+' de vous</div>';
  }

  var pData = JSON.stringify(p).replace(/"/g,'&quot;');
  var nomE = p.nom.replace(/'/g,"\\'");
  var adrE = (p.adresse||'').replace(/'/g,"\\'");

  return '<div class="pharm-card '+(p.garde==='24h/24'?'h24':'')+'" onclick="ouvrirModal(JSON.parse(this.dataset.p.replace(/&quot;/g,\'\\\"\')))\" data-p="'+pData+'">' +
    '<div class="card-head">' +
      '<div class="pharm-name">'+p.nom+proche+'</div>' +
      '<div class="garde-chip '+chipClass+'">'+chipLabel+'</div>' +
    '</div>' +
    '<div class="card-meta">' +
      '<div class="meta-row"><span class="meta-icon">📍</span>'+(p.adresse||'Non précisée')+'</div>' +
      '<div class="meta-row"><span class="meta-icon">📞</span>'+(p.tel_affiche||p.tel||'Non précisé')+'</div>' +
      distHtml +
      (assurHtml?'<div class="assurance-row">'+assurHtml+'</div>':'') +
    '</div>' +
    '<div class="card-actions">' +
      (tel?'<a href="tel:'+tel+'" class="btn-primary" onclick="event.stopPropagation()">📞 Appeler</a>':'<div class="btn-primary" style="background:var(--sub);cursor:not-allowed;">Non précisé</div>') +
      (tel?'<a href="https://wa.me/'+tel.replace('+','')+'" target="_blank" class="btn-icon" onclick="event.stopPropagation()" title="WhatsApp">💬</a>':'') +
      '<div class="btn-icon" title="Partager" onclick="event.stopPropagation();partagerWhatsApp(JSON.parse(this.closest(\'[data-p]\').dataset.p.replace(/&quot;/g,\'\\\"\')))">📤</div>' +
      '<div class="btn-icon" title="Itinéraire" onclick="event.stopPropagation();var o=document.getElementById(\'modal-overlay\');document.getElementById(\'modal-content\').innerHTML=\'\';o.classList.add(\'open\');document.body.style.overflow=\'hidden\';lancerItineraire(\''+nomE+'\',\''+adrE+'\',\''+p.ville+'\','+pharmLat+','+pharmLng+');">🧭</div>' +
    '</div>' +
  '</div>';
}

// ═══════════════════════════════════════
// PARTAGER & SIGNALER
// ═══════════════════════════════════════
function partagerWhatsApp(p) {
  var t = '💊 *'+p.nom+'*\n📍 '+(p.adresse||'')+', '+p.ville+'\n📞 '+(p.tel_affiche||p.tel||'Non précisé')+(p.assurances?'\n🏥 '+p.assurances:'')+'\n\n_PharmaGarde Togo_ 🇹🇬\n👉 pharma-garde-togo.vercel.app';
  window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank');
}

function signalerErreur(nom) {
  var t = 'Bonjour PharmaGarde 👋\n\nErreur concernant :\n*'+nom+'*\n\nDétails : ';
  window.open('https://wa.me/22879538131?text='+encodeURIComponent(t),'_blank');
}

// ═══════════════════════════════════════
// PHARMACIES
// ═══════════════════════════════════════
async function rechargerPharmacies() {
  document.getElementById('liste-pharmacies').innerHTML =
    '<div style="text-align:center;padding:56px 20px;color:var(--sub);"><div style="font-size:36px;margin-bottom:14px;opacity:0.5;">⏳</div><div style="font-weight:600;">Chargement...</div></div>';
  var data = await chargerPharmacies(villeActive);
  donneesPharmacies = data;
  if (!data.length) {
    document.getElementById('liste-pharmacies').innerHTML =
      '<div style="text-align:center;padding:56px 20px;color:var(--sub);"><div style="font-size:48px;margin-bottom:14px;opacity:0.4;">🔍</div><div style="font-size:17px;font-weight:700;margin-bottom:6px;">Aucune pharmacie trouvée</div><div style="font-size:14px;">pour '+villeActive+'</div></div>';
    document.getElementById('count-badge').textContent = '0';
    return;
  }
  document.getElementById('liste-pharmacies').innerHTML = data.slice(0,3).map(renderCard).join('');
  document.getElementById('count-badge').textContent = data.length+' trouvée'+(data.length>1?'s':'');
  afficherPlusProche(data);
}

async function chargerToutesPharmacies() {
  document.getElementById('liste-toutes').innerHTML =
    '<div style="text-align:center;padding:56px 20px;color:var(--sub);"><div style="font-size:36px;margin-bottom:14px;opacity:0.5;">⏳</div><div>Chargement...</div></div>';
  toutesPharmacies = await chargerPharmacies(villeToutes);
  document.getElementById('count-toutes').textContent = toutesPharmacies.length+' trouvée'+(toutesPharmacies.length>1?'s':'');
  document.getElementById('liste-toutes').innerHTML = toutesPharmacies.map(renderCard).join('');
  initialiserCarte();
}

async function changerVilleToutes(v) { villeToutes = v; await chargerToutesPharmacies(); }

// ═══════════════════════════════════════
// CARTE
// ═══════════════════════════════════════
function initialiserCarte() {
  var c = coordsVilles[villeToutes] || coordsVilles['Lomé'];
  if (carteLeaflet) { carteLeaflet.remove(); carteLeaflet = null; }
  setTimeout(function() {
    carteLeaflet = L.map('carte-lome').setView([c.lat,c.lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution:'© OpenStreetMap' }).addTo(carteLeaflet);
    toutesPharmacies.forEach(function(p) {
      var pLat = p.latitude||(c.lat+(Math.random()-0.5)*0.04);
      var pLng = p.longitude||(c.lng+(Math.random()-0.5)*0.04);
      var icon = L.divIcon({ html:'<div style="background:#00572A;color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:11px;box-shadow:0 2px 6px rgba(0,0,0,0.25);border:1.5px solid white;">💊</div>', iconSize:[24,24], iconAnchor:[12,12], className:'' });
      L.marker([pLat,pLng],{icon:icon}).addTo(carteLeaflet).bindPopup('<b>'+p.nom+'</b><br>'+(p.adresse||'')+'<br>📞 '+(p.tel_affiche||p.tel||''));
    });
  }, 150);
}

// ═══════════════════════════════════════
// URGENCES
// ═══════════════════════════════════════
function afficherUrgencesHome() {
  return urgences.map(function(u) {
    return '<a href="tel:'+u.numero+'" class="urg-card '+u.couleur+'" style="text-decoration:none;"><div class="urg-emoji">'+u.emoji+'</div><div class="urg-name">'+u.nom+'</div><div class="urg-num">'+u.numeroAffiche+'</div></a>';
  }).join('');
}

function afficherUrgencesPage() {
  var bg={r:'#FEF2F2',b:'#EFF6FF',o:'#FFFBEB',g:'#F0FDF4'};
  var tc={r:'#DC2626',b:'#2563EB',o:'#D97706',g:'#15803D'};
  return urgences.map(function(u) {
    return '<a href="tel:'+u.numero+'" class="urg-full" style="text-decoration:none;"><div class="urg-full-icon" style="background:'+bg[u.couleur]+';">'+u.emoji+'</div><div class="urg-full-info"><div class="urg-full-name">'+u.nom+'</div><div class="urg-full-sub">Appuyez pour appeler</div></div><div class="urg-full-num" style="color:'+tc[u.couleur]+';">'+u.numeroAffiche+'</div></a>';
  }).join('');
}

// ═══════════════════════════════════════
// VILLES
// ═══════════════════════════════════════
async function afficherVilles(filtre) {
  if (!filtre) filtre = '';
  var r = await db.from('pharmacies').select('ville').eq('actif', true);
  var data = r.data || [];
  var compteur = {};
  data.forEach(function(p) { var v=p.ville?p.ville.trim():null; if(v) compteur[v]=(compteur[v]||0)+1; });
  var villes = Object.keys(compteur).sort();

  var sel = document.getElementById('select-ville');
  if (sel) {
    sel.innerHTML = villes.map(function(v) {
      var b = toutesVillesBase.find(function(x){return x.nom===v;});
      return '<option value="'+v+'">'+(b?b.emoji:'🏘️')+' '+v+'</option>';
    }).join('');
  }

  var sv = document.getElementById('stat-villes');
  if (sv) sv.textContent = villes.length;

  var liste = filtre ? villes.filter(function(v){return v.toLowerCase().includes(filtre.toLowerCase());}) : villes;
  return liste.map(function(v) {
    var b = toutesVillesBase.find(function(x){return x.nom===v;});
    var nb = compteur[v]||0;
    return '<div class="ville-item" onclick="choisirVille(\''+v+'\')">'+
      '<span style="font-size:24px">'+(b?b.emoji:'🏘️')+'</span>'+
      '<div style="flex:1;"><div class="ville-name">'+v+'</div><div class="ville-count">'+nb+' pharmacie'+(nb>1?'s':'')+'</div></div>'+
      '<span style="color:var(--sub);font-size:16px;">›</span>'+
    '</div>';
  }).join('');
}

async function filtrerVilles(v) { document.getElementById('liste-villes').innerHTML = await afficherVilles(v); }

async function choisirVille(ville) {
  villeActive = ville;
  mettreAJourVille(ville);
  afficherPage('page-home', false);
  await rechargerPharmacies();
}

// ═══════════════════════════════════════
// POLITIQUES
// ═══════════════════════════════════════
function ouvrirPolitique(type) {
  var c = {
    confidentialite: { titre:'Politique de confidentialité', texte:'<h3>Collecte de données</h3><p>PharmaGarde Togo ne collecte aucune donnée personnelle. Votre GPS est utilisé localement, jamais stocké.</p><h3>Cookies</h3><p>Un seul cookie localStorage pour mémoriser votre thème sombre/clair.</p>' },
    conditions: { titre:"Conditions d'utilisation", texte:'<h3>Service gratuit</h3><p>PharmaGarde Togo est un service d\'information gratuit sur les pharmacies de garde.</p><h3>Exactitude</h3><p>Données mises à jour chaque lundi. Appelez avant de vous déplacer.</p>' },
    cookies: { titre:'Politique cookies', texte:'<h3>Cookie utilisé</h3><p>darkMode (localStorage) pour mémoriser votre thème. Cookies techniques OpenStreetMap pour les cartes.</p>' }
  };
  var info = c[type]; if (!info) return;
  var modal = document.createElement('div');
  modal.className = 'policy-modal';
  modal.onclick = function(e) { if (e.target===modal) modal.remove(); };
  modal.innerHTML = '<div class="policy-content"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><div class="policy-title">'+info.titre+'</div><button onclick="this.closest(\'.policy-modal\').remove()" style="background:var(--bg);border:1px solid var(--border);width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;color:var(--sub);">✕</button></div><div class="policy-text">'+info.texte+'</div></div>';
  document.body.appendChild(modal);
}

// ═══════════════════════════════════════
// CONTACT
// ═══════════════════════════════════════
function envoyerWhatsApp() {
  var n=document.getElementById('input-tel').value;
  var v=document.getElementById('input-ville').value;
  var m=document.getElementById('input-message').value;
  if (!m.trim()) { alert('Veuillez écrire un message.'); return; }
  var t='Bonjour PharmaGarde Togo 👋\n\nVille: '+v+'\nNuméro: '+n+'\n\nMessage: '+m;
  window.open('https://wa.me/22879538131?text='+encodeURIComponent(t),'_blank');
}

// ═══════════════════════════════════════
// PWA
// ═══════════════════════════════════════
window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault(); deferredPrompt = e;
  setTimeout(function() { if (deferredPrompt) afficherPopupInstall(); }, 30000);
});

function afficherPopupInstall() {
  if (document.getElementById('install-popup')) return;
  var popup = document.createElement('div');
  popup.id = 'install-popup';
  popup.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);width:calc(100%-40px);max-width:400px;background:var(--surface);border-radius:var(--r-xl);padding:20px;box-shadow:var(--shadow-xl);z-index:999;border:1px solid var(--border-strong);';
  popup.innerHTML = '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;"><div style="width:44px;height:44px;background:linear-gradient(135deg,var(--green),var(--green-light));border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">💊</div><div style="flex:1;"><div style="font-family:\'Fraunces\',serif;font-size:15px;font-weight:700;color:var(--text);">Installer PharmaGarde</div><div style="font-size:12px;color:var(--sub);margin-top:1px;">Accès rapide, disponible hors ligne</div></div><button onclick="this.closest(\'#install-popup\').remove()" style="background:none;border:none;font-size:18px;cursor:pointer;color:var(--sub);">✕</button></div><button onclick="installerDepuisPopup()" style="width:100%;background:var(--green);color:white;border:none;border-radius:var(--r);padding:13px;font-family:\'Outfit\',sans-serif;font-size:14px;font-weight:800;cursor:pointer;box-shadow:0 4px 12px rgba(0,87,42,0.3);">Installer maintenant — Gratuit</button>';
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
      msg.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:var(--green);color:white;padding:12px 24px;border-radius:20px;font-weight:700;z-index:9999;font-size:14px;box-shadow:var(--shadow-lg);';
      msg.textContent = 'App installée avec succès !';
      document.body.appendChild(msg);
      setTimeout(function(){msg.remove();}, 3000);
    }
  });
}

function installerApp() {
  if (deferredPrompt) { afficherPopupInstall(); return; }
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    var popup = document.createElement('div');
    popup.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:var(--surface);border-radius:var(--r-xl) var(--r-xl) 0 0;padding:24px;z-index:9999;box-shadow:0 -8px 40px rgba(0,0,0,0.15);';
    popup.innerHTML = '<div style="width:32px;height:3px;background:var(--border);border-radius:2px;margin:0 auto 20px;"></div><div style="font-family:\'Fraunces\',serif;font-size:20px;font-weight:700;margin-bottom:16px;color:var(--text);">Installer sur iPhone</div><div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;"><div style="display:flex;align-items:center;gap:12px;background:var(--bg);border-radius:var(--r);padding:12px;"><div style="width:28px;height:28px;background:var(--green);border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:13px;flex-shrink:0;">1</div><div style="font-size:13px;font-weight:600;color:var(--text);">Appuyez sur 📤 en bas de Safari</div></div><div style="display:flex;align-items:center;gap:12px;background:var(--bg);border-radius:var(--r);padding:12px;"><div style="width:28px;height:28px;background:var(--green);border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:13px;flex-shrink:0;">2</div><div style="font-size:13px;font-weight:600;color:var(--text);">Faites défiler → "Sur l\'écran d\'accueil"</div></div><div style="display:flex;align-items:center;gap:12px;background:var(--bg);border-radius:var(--r);padding:12px;"><div style="width:28px;height:28px;background:var(--green);border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:13px;flex-shrink:0;">3</div><div style="font-size:13px;font-weight:600;color:var(--text);">Appuyez sur "Ajouter"</div></div></div><button onclick="this.parentElement.remove()" style="width:100%;background:var(--green);color:white;border:none;border-radius:var(--r);padding:13px;font-family:\'Outfit\',sans-serif;font-size:14px;font-weight:700;cursor:pointer;">J\'ai compris</button>';
    document.body.appendChild(popup);
  }
}

// ═══════════════════════════════════════
// INIT
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
        mettreAJourVille('Lomé');
        var sub = document.getElementById('loc-sub');
        if (sub) sub.textContent = 'GPS actif · Cliquez pour changer';
      },
      function() { mettreAJourVille('Lomé'); }
    );
  }

  await rechargerPharmacies();

  try {
    var cr = await db.from('pharmacies').select('*',{count:'exact',head:true}).eq('actif',true);
    var st = document.getElementById('stat-pharmacies');
    if (st && cr.count) st.textContent = cr.count+'+';
  } catch(e) {}

  try {
    var lr = await db.from('pharmacies').select('created_at').eq('actif',true).order('created_at',{ascending:false}).limit(1);
    var badge = document.getElementById('update-badge');
    if (badge && lr.data && lr.data[0]) {
      var d = new Date(lr.data[0].created_at);
      badge.textContent = 'Mis à jour le '+d.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
    }
  } catch(e) {}
};
