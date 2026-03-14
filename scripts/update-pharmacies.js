const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function scrapePharmacies() {
  console.log('🔍 Lecture de lacinquieme.tg...');
  try {
    const response = await fetch('https://www.lacinquieme.tg', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    const pharmacies = [];

    $('table tr, .pharmacie, article').each((i, el) => {
      const texte = $(el).text().trim();
      if (!texte || texte.length < 10) return;

      const lignes = texte.split('\n').map(l => l.trim()).filter(l => l);
      const nom = lignes[0] || '';
      const adresse = lignes[1] || '';
      const tel = $(el).find('a[href^="tel:"]').attr('href')?.replace('tel:', '')
        || texte.match(/\+?228\s?[\d\s]{8,}/)?.[0]?.replace(/\s/g, '') || '';

      if (nom && nom.toLowerCase().includes('pharmac')) {
        pharmacies.push({
          nom: nom.substring(0, 100),
          adresse: adresse.substring(0, 200),
          tel: tel.substring(0, 20),
          tel_affiche: tel.substring(0, 20),
          ville: 'Lomé',
          zone: 'A',
          garde: 'soir',
          heures: 'Toute la semaine',
          assurances: '',
          actif: true
        });
      }
    });

    console.log(`✅ ${pharmacies.length} pharmacies trouvées`);
    return pharmacies;
  } catch (e) {
    console.error('❌ Erreur:', e.message);
    return [];
  }
}

async function mettreAJour(pharmacies) {
  if (pharmacies.length === 0) {
    console.log('⚠️ Aucune pharmacie — données existantes conservées');
    return;
  }
  console.log('🗑️ Suppression anciennes données...');
  await supabase.from('pharmacies').delete().neq('id', 0);
  console.log('💾 Insertion nouvelles données...');
  const { error } = await supabase.from('pharmacies').insert(pharmacies);
  if (error) console.error('❌ Erreur insertion:', error);
  else console.log(`✅ ${pharmacies.length} pharmacies mises à jour !`);
}

async function main() {
  const pharmacies = await scrapePharmacies();
  await mettreAJour(pharmacies);
}

main();
