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
    const response = await fetch('https://www.lacinquieme.tg/pharmacies-de-garde', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const html = await response.text();
    const $ = cheerio.load(html);
    const pharmacies = [];

    // Lire chaque pharmacie sur la page
    $('.pharmacie, .pharmacy, article, .garde-item').each((i, el) => {
      const texte = $(el).text().trim();
      const nom = $(el).find('h2, h3, .nom, strong').first().text().trim();
      const adresse = $(el).find('.adresse, address, p').first().text().trim();
      const tel = $(el).find('a[href^="tel:"]').attr('href')?.replace('tel:', '') || '';

      if (nom) {
        pharmacies.push({
          nom,
          adresse,
          tel,
          tel_affiche: tel,
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
    console.error('❌ Erreur lecture site:', e);
    return [];
  }
}

async function mettreAJourSupabase(pharmacies) {
  if (pharmacies.length === 0) {
    console.log('⚠️ Aucune pharmacie trouvée - on garde les données existantes');
    return;
  }

  console.log('🗑️ Suppression des anciennes données...');
  await supabase.from('pharmacies').delete().neq('id', 0);

  console.log('💾 Insertion des nouvelles données...');
  const { error } = await supabase.from('pharmacies').insert(pharmacies);

  if (error) {
    console.error('❌ Erreur insertion:', error);
  } else {
    console.log(`✅ ${pharmacies.length} pharmacies mises à jour avec succès !`);
  }
}

async function main() {
  const pharmacies = await scrapePharmacies();
  await mettreAJourSupabase(pharmacies);
}

main();
