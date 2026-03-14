// ═══════════════════════════════════════
// CONNEXION SUPABASE
// ═══════════════════════════════════════
const SUPABASE_URL = 'https://secjfgzzmsvatsmaxbud.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlY2pmZ3p6bXN2YXRzbWF4YnVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTQ5MzYsImV4cCI6MjA4OTA3MDkzNn0.2EYq4WZtth5QBlEr3GRoUcrHtyw3kR3brRkQEhzFqIo';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ═══════════════════════════════════════
// CHARGER LES PHARMACIES DEPUIS SUPABASE
// ═══════════════════════════════════════
async function chargerPharmaciess(garde = 'soir', ville = 'Lomé') {
  const { data, error } = await supabase
    .from('pharmacies')
    .select('*')
    .eq('actif', true)
    .or(`garde.eq.${garde},garde.eq.24h/24`)
    .eq('ville', ville);

  if (error) {
    console.error('Erreur Supabase:', error);
    return [];
  }
  return data;
}
// ═══════════════════════════════════════
// DONNÉES DES PHARMACIES
// ═══════════════════════════════════════
const pharmacies = {
  soir: [
    {
      nom: "Pharmacie BETHEL",
      adresse: "Adidogomé",
      ville: "Lomé",
      tel: "+22822252370",
      telAffiche: "+228 22 25 23 70",
      garde: "24h/24",
      assurances: ["INAM", "CNSS", "GTA"]
    },
    {
      nom: "Pharmacie GREENRX",
      adresse: "Ségbé",
      ville: "Lomé",
      tel: "+22892961919",
      telAffiche: "+228 92 96 19 19",
      garde: "soir",
      heures: "Jusqu'à 22h00",
      assurances: ["INAM"]
    },
    {
      nom: "Pharmacie du PEUPLE",
      adresse: "Bvd du 13 Janvier",
      ville: "Lomé",
      tel: "+22822214410",
      telAffiche: "+228 22 21 44 10",
      garde: "soir",
      heures: "Jusqu'à 23h00",
      assurances: ["CNSS", "GTA"]
    }
  ],
  nuit: [
    {
      nom: "Pharmacie BETHEL",
      adresse: "Adidogomé",
      ville: "Lomé",
      tel: "+22822252370",
      telAffiche: "+228 22 25 23 70",
      garde: "24h/24",
      assurances: ["INAM", "CNSS", "GTA"]
    }
  ],
  demain: [
    {
      nom: "Pharmacie ESPOIR",
      adresse: "Quartier Tokoin",
      ville: "Lomé",
      tel: "+22822213456",
      telAffiche: "+228 22 21 34 56",
      garde: "soir",
      heures: "Jusqu'à 22h00",
      assurances: ["INAM"]
    },
    {
      nom: "Pharmacie SAINTE MARIE",
      adresse: "Quartier Agbalépédogan",
      ville: "Lomé",
      tel: "+22822219876",
      telAffiche: "+228 22 21 98 76",
      garde: "soir",
      heures: "Jusqu'à 23h00",
      assurances: ["CNSS", "INAM"]
    }
  ]
};

// ═══════════════════════════════════════
// NUMÉROS D'URGENCE
// ═══════════════════════════════════════
const urgences = [
  { nom: "SAMU", numero: "15", emoji: "🚑", couleur: "r" },
  { nom: "Police", numero: "117", emoji: "👮", couleur: "b" },
  { nom: "Pompiers", numero: "118", emoji: "🚒", couleur: "o" },
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
// ONGLET ACTIF
// ═══════════════════════════════════════
let ongletActif = 'soir';

function changerOnglet(onglet) {
  ongletActif = onglet;

  // Mettre à jour les tabs visuellement
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
  document.getElementById('tab-' + onglet).classList.add('on');

  // Recharger les pharmacies
  const liste = pharmacies[onglet];
  document.getElementById('liste-pharmacies').innerHTML =
    liste.map(afficherPharmacie).join('');
  document.getElementById('count-badge').textContent =
    liste.length + ' trouvée' + (liste.length > 1 ? 's' : '');
}

// ═══════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════
function afficherPage(pageId) {
  document.querySelectorAll('.page').forEach(p => {
    p.style.display = 'none';
  });
  document.getElementById(pageId).style.display = 'block';
  window.scrollTo(0, 0);

  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('on'));
  if (pageId === 'page-home') {
    document.getElementById('nav-home').classList.add('on');
  }
  if (pageId === 'page-urgences') {
    document.getElementById('nav-urgences').classList.add('on');
  }
  if (pageId === 'page-contact') {
    document.getElementById('nav-contact').classList.add('on');
  }
}

// ═══════════════════════════════════════
// AFFICHER UNE PHARMACIE
// ═══════════════════════════════════════
function afficherPharmacie(p) {
  const assurancesHtml = p.assurances
    .map(a => `<span class="assur-tag">${a}</span>`)
    .join('');

  const chipClass = p.garde === '24h/24' ? 'h24' : 'soir';
  const chipLabel = p.garde === '24h/24' ? '🌛 24h/24' : '🌆 Ce soir';
  const heuresHtml = p.heures
    ? `<div class="meta-row"><span>🕐</span> ${p.heures}</div>`
    : '';

  return `
    <div class="pharm-card ${p.garde === '24h/24' ? 'h24' : ''}">
      <div class="card-head">
        <div class="pharm-name">${p.nom}</div>
        <div class="garde-chip ${chipClass}">${chipLabel}</div>
      </div>
      <div class="card-meta">
        <div class="meta-row"><span>📍</span> ${p.adresse}</div>
        <div class="meta-row"><span>📞</span> ${p.telAffiche}</div>
        ${heuresHtml}
        <div class="assurance-row">${assurancesHtml}</div>
      </div>
      <div class="card-actions">
        <a href="tel:${p.tel}" class="btn-call">📞 Appeler maintenant</a>
        <a href="https://wa.me/${p.tel}" target="_blank" class="btn-icon" title="WhatsApp">💬</a>
        <a href="https://maps.google.com/?q=${encodeURIComponent(p.nom + ' ' + p.adresse + ' Togo')}"
           target="_blank" class="btn-icon" title="Carte">🗺️</a>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════
// AFFICHER LES URGENCES
// ═══════════════════════════════════════
function afficherUrgences() {
  return urgences.map(u => `
    <a href="tel:${u.numero}" class="urg-card ${u.couleur}" style="text-decoration:none;">
      <div class="urg-emoji">${u.emoji}</div>
      <div class="urg-name">${u.nom}</div>
      <div class="urg-num">${u.numeroAffiche || u.numero}</div>
    </a>
  `).join('');
}

// ═══════════════════════════════════════
// AFFICHER LES VILLES
// ═══════════════════════════════════════
function afficherVilles() {
  return villes.map(v => `
    <div class="ville-item" onclick="afficherPage('page-home')">
      <span style="font-size:24px">${v.emoji}</span>
      <span class="ville-name">${v.nom}</span>
      <span class="ville-count">${v.zones}</span>
      <span style="color:#5A7A68">›</span>
    </div>
  `).join('');
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
  const url = `https://wa.me/22800000000?text=${encodeURIComponent(texte)}`;
  window.open(url, '_blank');
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
  // Charger les pharmacies depuis Supabase
  const data = await chargerPharmaciess('soir', 'Lomé');
  
  const liste = data.length > 0 ? data : pharmacies.soir;
  
  document.getElementById('liste-pharmacies').innerHTML =
    liste.map(p => afficherPharmacie({
      nom: p.nom,
      adresse: p.adresse,
      ville: p.ville,
      tel: p.tel,
      telAffiche: p.tel_affiche,
      garde: p.garde,
      heures: p.heures,
      assurances: p.assurances ? p.assurances.split(',') : []
    })).join('');

  document.getElementById('count-badge').textContent =
    liste.length + ' trouvée' + (liste.length > 1 ? 's' : '');

  // Urgences page home
  document.getElementById('urgences-home').innerHTML = afficherUrgences();

  // Urgences page complète
  document.getElementById('urgences-page').innerHTML = urgences.map(u => `
    <a href="tel:${u.numero}" class="urg-full" style="text-decoration:none;">
      <div class="urg-full-icon" style="background:${
        u.couleur==='r'?'#FFF0EE':u.couleur==='b'?'#EEF4FF':u.couleur==='o'?'#FFF8EE':'#F0FFF8'
      };">${u.emoji}</div>
      <div class="urg-full-info">
        <div class="urg-full-name">${u.nom}</div>
        <div class="urg-full-sub">Appuyez pour appeler</div>
      </div>
      <div class="urg-full-num" style="color:${
        u.couleur==='r'?'#FF3B30':u.couleur==='b'?'#0A84FF':u.couleur==='o'?'#FF9500':'#006B3C'
      };">${u.numeroAffiche || u.numero}</div>
    </a>
  `).join('');

  // Villes
  document.getElementById('liste-villes').innerHTML = afficherVilles();

  // GPS
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async function (pos) {
      document.getElementById('loc-main').textContent = 'Lomé — Position détectée';
      document.getElementById('loc-sub').textContent = 'GPS actif · Appuyez pour changer';
    });
  }
};

// Mettre à jour changerOnglet pour utiliser Supabase
async function changerOnglet(onglet) {
  ongletActif = onglet;

  document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
  document.getElementById('tab-' + onglet).classList.add('on');

  const garde = onglet === 'nuit' ? 'nuit' : onglet === 'demain' ? 'demain' : 'soir';
  const data = await chargerPharmaciess(garde, 'Lomé');
  const liste = data.length > 0 ? data : pharmacies[onglet] || pharmacies.soir;

  document.getElementById('liste-pharmacies').innerHTML =
    liste.map(p => afficherPharmacie({
      nom: p.nom || p.nom,
      adresse: p.adresse,
      ville: p.ville,
      tel: p.tel,
      telAffiche: p.tel_affiche || p.telAffiche,
      garde: p.garde,
      heures: p.heures,
      assurances: p.assurances ? p.assurances.split(',') : (p.assurances || [])
    })).join('');

  document.getElementById('count-badge').textContent =
    liste.length + ' trouvée' + (liste.length > 1 ? 's' : '');
}

  // Villes
  document.getElementById('liste-villes').innerHTML = afficherVilles();

  // GPS
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function () {
      document.getElementById('loc-main').textContent = 'Lomé — Position détectée';
      document.getElementById('loc-sub').textContent = 'GPS actif · Appuyez pour changer';
    });
  }
};
