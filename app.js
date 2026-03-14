// ═══════════════════════════════════════
// CONNEXION SUPABASE
// ═══════════════════════════════════════
const SUPABASE_URL = 'https://secjfgzzmsvatsmaxbud.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlY2pmZ3p6bXN2YXRzbWF4YnVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTQ5MzYsImV4cCI6MjA4OTA3MDkzNn0.2EYq4WZtth5QBlEr3GRoUcrHtyw3kR3brRkQEhzFqIo';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ═══════════════════════════════════════
// NUMÉROS D'URGENCE
// ═══════════════════════════════════════
const urgences = [
  { nom: "SAMU", numero: "15", numeroAffiche: "15", emoji: "🚑", couleur: "r" },
  { nom: "Police", numero: "117", numeroAffiche: "117", emoji: "👮", couleur: "b" },
  { nom: "Pompiers", numero: "118", numeroAffiche: "118", emoji: "🚒", couleur: "o" },
  { nom: "CHU Sylvanus", numero: "+22822212501", numeroAffiche: "+228 22 21 25 01", emoji: "🏥", couleur: "g" }
];

// ═══════════════════════════════════════
// VILLES DU TOGO
// ═══════════════════════════════════════
const toutesVilles = [
  { nom: "Lomé", emoji: "🏙️" },
  { nom: "Kpalimé", emoji: "🌳" },
  { nom: "Kara", emoji: "⛰️" },
  { nom: "Sokodé", emoji: "🌾" },
  { nom: "Dapaong", emoji: "🏜️" },
  { nom: "Tsévié", emoji: "🌊" },
  { nom: "Atakpamé", emoji: "🌴" }
];

// ═══════════════════════════════════════
// ÉTAT
// ═══════════════════════════════════════
let villeActive = 'Lomé';
let ongletActif = 'soir';

// ═══════════════════════════════════════
// CHARGER LES PHARMACIES
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
// AFFICHER UNE PHARMACIE
// ═══════════════════════════════════════
function afficherPharmacie(p) {
  const assurances = (p.assurances || '').split(',').filter(a => a.trim());
  const heuresHtml = p.heures && p.heures !== '24h/24'
    ? `<div class="meta-row"><span>🕐</span> ${p.heures}</div>` : '';
  const chipClass = p.garde === '24h/24' ? 'h24' : 'soir';
  const chipLabel = p.garde === '24h/24' ? '🌛 24h/24' : '🌆 Ce soir';
  const assurancesHtml = assurances.map(a => `<span class="assur-tag">${a.trim()}</span>`).join('');
  const telPropre = (p.tel || '').replace(/\s/g, '');

  return `
    <div class="pharm-card ${p.garde === '24h/24' ? 'h24' : ''}">
      <div class="card-head">
        <div class="pharm-name">${p.nom}</div>
        <div class="garde-chip ${chipClass}">${chipLabel}</div>
      </div>
      <div class="card-meta">
        <div class="meta-row"><span>📍</span> ${p.adresse || ''}</div>
        <div class="meta-row"><span>📞</span> ${p.tel_affiche || p.tel || ''}</div>
        ${heuresHtml}
        ${assurancesHtml ? `<div class="assurance-row">${assurancesHtml}</div>` : ''}
      </div>
      <div class="card-actions">
        ${telPropre ? `<a href="tel:${telPropre}" class="btn-call">📞 Appeler maintenant</a>` : '<div class="btn-call" style="background:#ccc;cursor:not-allowed;">📞 Numéro non précisé</div>'}
        ${telPropre ? `<a href="https://wa.me/${telPropre.replace('+','')}" target="_blank" class="btn-icon">💬</a>` : ''}
        <a href="https://maps.google.com/?q=${encodeURIComponent((p.nom||'')+' '+(p.adresse||'')+' Togo')}" target="_blank" class="btn-icon">🗺️</a>
      </div>
    </div>`;
}

// ═══════════════════════════════════════
// AFFICHER URGENCES HOME
// ═══════════════════════════════════════
function afficherUrgencesHome() {
  return urgences.map(u => `
    <a href="tel:${u.numero}" class="urg-card ${u.couleur}" style="text-decoration:none;">
      <div class="urg-emoji">${u.emoji}</div>
      <div class="urg-name">${u.nom}</div>
      <div class="urg-num">${u.numeroAffiche}</div>
    </a>`).join('');
}

// ═══════════════════════════════════════
// AFFICHER URGENCES PAGE
// ═══════════════════════════════════════
function afficherUrgencesPage() {
  const bg = { r:'#FFF0EE', b:'#EEF4FF', o:'#FFF8EE', g:'#F0FFF8' };
  const tc = { r:'#FF3B30', b:'#0A84FF', o:'#FF9500', g:'#006B3C' };
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
// AFFICHER VILLES AVEC VRAI NOMBRE
// ═══════════════════════════════════════
async function afficherVilles(filtre = '') {
  const liste = filtre
    ? toutesVilles.filter(v => v.nom.toLowerCase().includes(filtre.toLowerCase()))
    : toutesVilles;

  // Compter les pharmacies par ville depuis Supabase
  const { data } = await db.from('pharmacies').select('ville').eq('actif', true);
  const compteur = {};
  (data || []).forEach(p => {
    compteur[p.ville] = (compteur[p.ville] || 0) + 1;
  });

  return liste.map(v => {
    const nb = compteur[v.nom] || 0;
    return `
      <div class="ville-item" onclick="choisirVille('${v.nom}')">
        <span style="font-size:24px">${v.emoji}</span>
        <div style="flex:1;">
          <div class="ville-name">${v.nom}</div>
          <div class="ville-count">${nb} pharmacie${nb > 1 ? 's' : ''}</div>
        </div>
        <span style="color:#5A7A68;font-size:20px;">›</span>
      </div>`;
  }).join('');
}

// ═══════════════════════════════════════
// FILTRER VILLES
// ═══════════════════════════════════════
async function filtrerVilles(valeur) {
  document.getElementById('liste-villes').innerHTML = await afficherVilles(valeur);
}

// ═══════════════════════════════════════
// CHOISIR UNE VILLE
// ═══════════════════════════════════════
async function choisirVille(ville) {
  villeActive = ville;
  document.getElementById('loc-main').textContent = ville + ' ✓';
  document.getElementById('loc-sub').textContent = 'Appuyez pour changer de ville';
  afficherPage('page-home');
  await rechargerPharmacies();
}

// ═══════════════════════════════════════
// RECHARGER PHARMACIES
// ═══════════════════════════════════════
async function rechargerPharmacies() {
  document.getElementById('liste-pharmacies').innerHTML =
    `<div style="text-align:center;padding:48px 20px;color:#5A7A68;">
      <div style="font-size:32px;margin-bottom:12px;">⏳</div>
      Chargement en cours...
    </div>`;

  const data = await chargerPharmacies(villeActive);

  if (!data || data.length === 0) {
    document.getElementById('liste-pharmacies').innerHTML =
      `<div style="text-align:center;padding:48px 20px;color:#5A7A68;">
        <div style="font-size:48px;margin-bottom:12px;">🔍</div>
        <div style="font-weight:700;margin-bottom:6px;">Aucune pharmacie trouvée</div>
        <div style="font-size:13px;">pour ${villeActive}</div>
      </div>`;
    document.getElementById('count-badge').textContent = '0 trouvée';
    return;
  }

  document.getElementById('liste-pharmacies').innerHTML = data.map(afficherPharmacie).join('');
  document.getElementById('count-badge').textContent =
    data.length + ' trouvée' + (data.length > 1 ? 's' : '');
}

// ═══════════════════════════════════════
// CHANGER ONGLET
// ═══════════════════════════════════════
async function changerOnglet(onglet) {
  ongletActif = onglet;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
  document.getElementById('tab-' + onglet).classList.add('on');
  await rechargerPharmacies();
}

// ═══════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════
function afficherPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  document.getElementById(pageId).style.display = 'block';
  window.scrollTo(0, 0);
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('on'));
  const map = { 'page-home': 'nav-home', 'page-urgences': 'nav-urgences', 'page-contact': 'nav-contact' };
  if (map[pageId]) document.getElementById(map[pageId]).classList.add('on');
}

// ═══════════════════════════════════════
// WHATSAPP
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
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('install-banner').style.display = 'flex';
});

function installerApp() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      deferredPrompt = null;
      document.getElementById('install-banner').style.display = 'none';
    });
  } else {
    alert('Pour installer : appuyez sur le menu de votre navigateur puis "Ajouter à l\'écran d\'accueil"');
  }
}

// ═══════════════════════════════════════
// INITIALISATION
// ═══════════════════════════════════════
window.onload = async function () {
  // Urgences
  document.getElementById('urgences-home').innerHTML = afficherUrgencesHome();
  document.getElementById('urgences-page').innerHTML = afficherUrgencesPage();

  // Villes avec vrais nombres
  document.getElementById('liste-villes').innerHTML = await afficherVilles();

  // Pharmacies
  await rechargerPharmacies();

  // GPS
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function () {
      document.getElementById('loc-main').textContent = 'Lomé ✓';
      document.getElementById('loc-sub').textContent = 'GPS actif · Appuyez pour changer';
    }, function () {
      document.getElementById('loc-main').textContent = 'Lomé';
      document.getElementById('loc-sub').textContent = 'Appuyez pour changer de ville';
    });
  }
};
