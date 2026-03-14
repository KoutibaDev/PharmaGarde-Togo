const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function main() {
  console.log('Lecture de lacinquieme.tg...');
  try {
    const res = await fetch('https://www.lacinquieme.tg', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const pharmacies = [];

    $('[class*="pharm"], [class*="garde"], article, .entry-content p').each((i, el) => {
      const nom = $(el).find('strong, h2, h3').first().text().trim();
      const tel = $(el).find('a[href^="tel:"]').attr('href')?.replace('tel:', '') || '';
      const adresse = $(el).text().replace(nom, '').trim().substring(0, 200);

      if (nom && nom.toLowerCase().includes('pharmac')) {
        pharmacies.push({
          nom: nom.substring(0, 100),
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

    console.log(pharmacies.length + ' pharmacies trouvées');

    if (pharmacies.length > 0) {
      await supabase.from('pharmacies').delete().neq('id', 0);
      const { error } = await supabase.from('pharmacies').insert(pharmacies);
      if (error) console.error('Erreur:', error);
      else console.log('Mise à jour réussie !');
    } else {
      console.log('Aucune pharmacie trouvée - données conservées');
    }
  } catch(e) {
    console.error('Erreur:', e.message);
  }
}

main();
