require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('Connected to database');

  // 1. Import ayt table first
  const aytSql = require('fs').readFileSync(__dirname + '/data-alkitab-ayt/ayt_postgres.sql', 'utf8');
  await client.query(aytSql);
  console.log('ayt table imported');

  // 2. Populate Book from distinct book+abbr in ayt
  await client.query(`
    INSERT INTO "Book" (id, abbr)
    SELECT DISTINCT book, abbr FROM ayt
    ORDER BY book
    ON CONFLICT (id) DO NOTHING
  `);
  const bookCount = await client.query('SELECT COUNT(*) FROM "Book"');
  console.log('Books:', bookCount.rows[0].count);

  // 3. Populate Chapter from distinct book+chapter in ayt
  await client.query(`
    INSERT INTO "Chapter" (bookid, number)
    SELECT DISTINCT book, chapter FROM ayt
    ORDER BY book, chapter
    ON CONFLICT (bookid, number) DO NOTHING
  `);
  const chapterCount = await client.query('SELECT COUNT(*) FROM "Chapter"');
  console.log('Chapters:', chapterCount.rows[0].count);

  // 4. Populate Verse from ayt joined with Chapter
  await client.query(`
    INSERT INTO "Verse" (id, bookid, chapterid, number, text, title)
    SELECT a.id, a.book, c.id, a.verse, a.text, a.title
    FROM ayt a
    JOIN "Chapter" c ON c.bookid = a.book AND c.number = a.chapter
    ON CONFLICT (id) DO NOTHING
  `);
  const verseCount = await client.query('SELECT COUNT(*) FROM "Verse"');
  console.log('Verses:', verseCount.rows[0].count);

  await client.end();
  console.log('Done!');
}

main().catch((e) => { console.error(e); process.exit(1); });
