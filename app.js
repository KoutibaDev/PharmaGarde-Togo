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
const villes = [
  { nom: "Lomé", emoji: "🏙️", zones: "12 zones" },
  { nom: "Kpalimé", emoji: "🌳", zones: "3 pharmacies" },
  { nom: "Kara", emoji: "⛰️", zones: "4 pharmacies" },
  { nom: "Sokodé", emoji: "🌾", zones: "2 pharmacies" },
  { nom: "Dapaong", emoji: "🏜️", zones: "2 pharmacies" },
  { nom: "Tsévié", emoji: "🌊", zones: "2 pharmacies" },
  { nom: "Atakpamé", emoji: "🌴", zones: "3 pharmacies" }
];

// ═══════════════════════════════════════
// VILLE ET ONGLET ACTIFS
// ═══════════════════════════════════════
let villeActive = 'Lomé';
let ongletActif = 'soir';

// ═══════════════════════════════════════
// CHARGER LES PHARMACIES DEPUIS SUPABASE
// ═══════════════════════════════════════
async function chargerPharmacies(garde, ville) {
  try {
    let query = db.from('pharmacies').select('*').eq('actif', true);

    if (ville) query = query.eq('ville', ville);

    const { data, error } = await query;

    if (error) {
      console.error('Erreur Supabase:', error);
      return [];
    }

    // Filtrer par garde
    if (garde === 'soir' || garde === 'nuit') {
      return data.filter(p => p.garde === garde || p.garde === '24h/24');
    }

    return data;
  } catch (e) {
    console.error('Erreur:', e);
    return [];
  }
}

// ═══════════════════════════════════════
// AFFICHER UNE PHARMACIE
// ═══════════════════════════════════════
function afficherPharmacie(p) {
  const nom = p.nom || '';
  const adresse = p.adresse || '';
  const tel = p.tel || '';
  const telAffiche = p.tel_affiche || tel;
  const garde = p.garde || 'soir';
  const heures = p.heures || '';
  const assurancesRaw = p.assurances || '';
  const assurances = assurancesRaw.split(',').filter(a => a.trim() !== '');

  const chipClass = garde === '24h/24' ? 'h24' : 'soir';
  const chipLabel = garde === '24h/24' ? '🌛 24h/24' : '🌆 Ce soir';

  const heuresHtml = heures && heures !== '24h/24'
    ? `<div class="meta-row"><span>🕐</span> ${heures}</div>`
    : '';

  const assurancesHtml = assurances
    .map(a => `<span class="assur-tag">${a.trim()}</span>`)
    .join('');

  return `
    <div class="pharm-card ${garde === '24h/24' ? 'h24' : ''}">
      <div class="card-head">
        <div class="pharm-name">${nom}</div>
        <div class="garde-chip ${chipClass}">${chipLabel}</div>
      </div>
      <div class="card-meta">
        <div class="meta-row"><span>📍</span> ${adresse}</div>
        <div class="meta-row"><span>📞</span> ${telAffiche}</div>
        ${heuresHtml}
        <div class="assurance-row">${assurancesHtml}</div>
      </div>
      <div class="card-actions">
        <a href="tel:${tel}" class="btn-call">📞 Appeler maintenant</a>
        <a href="https://wa.me/${tel.replace('+', '')}" target="_blank" class="btn-icon" title="WhatsApp">💬</a>
        <a href="https://maps.google.com/?q=${encodeURIComponent(nom + ' ' + adresse + ' Togo')}"
           target="_blank" class="btn-icon" title="Carte">🗺️</a>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════
// AFFICHER LES URGENCES (grille home)
// ═══════════════════════════════════════
function afficherUrgencesHome() {
  return urgences.map(u => `
    <a href="tel:${u.numero}" class="urg-card ${u.couleur}" style="text-decoration:none;">
      <div class="urg-emoji">${u.emoji}</div>
      <div class="urg-name">${u.nom}</div>
      <div class="urg-num">${u.numeroAffiche}</div>
    </a>
  `).join('');
}

// ═══════════════════════════════════════
// AFFICHER LES URGENCES (page complète)
// ═══════════════════════════════════════
function afficherUrgencesPage() {
  const couleurs = { r: '#FFF0EE', b: '#EEF4FF', o: '#FFF8EE', g: '#F0FFF8' };
  const textCouleurs = { r: '#FF3B30', b: '#0A84FF', o: '#FF9500', g: '#006B3C' };

  return urgences.map(u => `
    <a href="tel:${u.numero}" class="urg-full" style="text-decoration:none;">
      <div class="urg-full-icon" style="background:${couleurs[u.couleur]};">${u.emoji}</div>
      <div class="urg-full-info">
        <div class="urg-full-name">${u.nom}</div>
        <div class="urg-full-sub">Appuyez pour appeler</div>
      </div>
      <div class="urg-full-num" style="color:${textCouleurs[u.couleur]};">${u.numeroAffiche}</div>
    </a>
  `).join('');
}

// ═══════════════════════════════════════
// AFFICHER LES VILLES
// ═══════════════════════════════════════
function afficherVilles() {
  return villes.map(v => `
    <div class="ville-item" onclick="choisirVille('${v.nom}')">
      <span style="font-size:24px">${v.emoji}</span>
      <span class="ville-name">${v.nom}</span>
      <span class="ville-count">${v.zones}</span>
      <span style="color:#5A7A68">›</span>
    </div>
  `).join('');
}

// ═══════════════════════════════════════
// CHOISIR UNE VILLE
// ═══════════════════════════════════════
async function choisirVille(ville) {
  villeActive = ville;
  document.getElementById('loc-main').textContent = ville + ' — Sélectionné';
  document.getElementById('loc-sub').textContent = 'Appuyez pour changer de ville';
  afficherPage('page-home');
  await rechargerPharmaciess();
}

// ═══════════════════════════════════════
// RECHARGER LES PHARMACIES
// ═══════════════════════════════════════
async function rechargerPharmaciess() {
  document.getElementById('liste-pharmacies').innerHTML =
    '<div style="text-align:center;padding:40px;color:#5A7A68;">Chargement...</div>';

  const data = await chargerPharmacies(ongletActif, villeActive);

  if (data.length === 0) {
    document.getElementById('liste-pharmacies').innerHTML =
      '<div style="text-align:center;padding:40px;color:#5A7A68;">Aucune pharmacie trouvée pour cette zone.</div>';
    document.getElementById('count-badge').textContent = '0 trouvée';
    return;
  }

  document.getElementById('liste-pharmacies').innerHTML =
    data.map(afficherPharmacie).join('');
  document.getElementById('count-badge').textContent =
    data.length + ' trouvée' + (data.length > 1 ? 's' : '');
}

// ═══════════════════════════════════════
// CHANGER D'ONGLET
// ═══════════════════════════════════════
async function changerOnglet(onglet) {
  ongletActif = onglet;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
  document.getElementById('tab-' + onglet).classList.add('on');
  await rechargerPharmaciess();
}

// ═══════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════
function afficherPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  document.getElementById(pageId).style.display = 'block';
  window.scrollTo(0, 0);

  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('on'));
  if (pageId === 'page-home') document.getElementById('nav-home').classList.add('on');
  if (pageId === 'page-urgences') document.getElementById('nav-urgences').classList.add('on');
  if (pageId === 'page-contact') document.getElementById('nav-contact').classList.add('on');
}

// ═══════════════════════════════════════
// WHATSAPP CONTACT
// ═══════════════════════════════════════
function envoyerWhatsApp() {
  const numero = document.getElementById('input-tel').value;
  const ville = document.getElementById('input-ville').value;
  const message = document.getElementById('input-message').value;

  if (!message.trim()) {
    alert('Veuillez écrire un message.');
    return;
  }

  const texte = `Bonjour PharmaGarde Togo 👋\n\nVille: ${ville}\nNuméro: ${numero}\n\nMessage: ${message}`;
  window.open(`https://wa.me/22800000000?text=${encodeURIComponent(texte)}`, '_blank');
}

// ═══════════════════════════════════════
// INSTALLATION PWA
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

  // Villes
  document.getElementById('liste-villes').innerHTML = afficherVilles();

  // Charger les pharmacies
  await rechargerPharmaciess();

  // GPS
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function () {
      document.getElementById('loc-main').textContent = 'Lomé — Position détectée';
      document.getElementById('loc-sub').textContent = 'GPS actif · Appuyez pour changer';
    });
  }
};
