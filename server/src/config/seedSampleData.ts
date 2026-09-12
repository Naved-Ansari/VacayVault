import pool from './db';
import { getRateToInr } from '../services/currency';

export async function seedSampleData(): Promise<void> {
  const client = await pool.connect();
  try {
    const existing = await client.query('SELECT COUNT(*) FROM trips');
    if (parseInt(existing.rows[0].count, 10) > 0) {
      console.log('ℹ️ Trips already exist. Skipping sample data seed.');
      return;
    }

    console.log('🌱 Seeding initial realistic vacation data...');
    await client.query('BEGIN');

    // 1. Europe Vacation 2026
    const trip1Res = await client.query(
      `INSERT INTO trips (name, start_date, end_date, travelers_count, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        'Europe Vacation 2026',
        '2026-06-10',
        '2026-06-25',
        4,
        'Family summer vacation visiting France, Netherlands, and Swiss Alps.'
      ]
    );
    const trip1Id = trip1Res.rows[0].id;

    // Destinations for Europe
    const destParis = await client.query(
      'INSERT INTO destinations (trip_id, name, country) VALUES ($1, $2, $3) RETURNING id',
      [trip1Id, 'Paris', 'France']
    );
    const destAms = await client.query(
      'INSERT INTO destinations (trip_id, name, country) VALUES ($1, $2, $3) RETURNING id',
      [trip1Id, 'Amsterdam', 'Netherlands']
    );
    const destSwiss = await client.query(
      'INSERT INTO destinations (trip_id, name, country) VALUES ($1, $2, $3) RETURNING id',
      [trip1Id, 'Switzerland (Interlaken & Lucerne)', 'Switzerland']
    );

    // 2. Dubai Getaway 2025
    const trip2Res = await client.query(
      `INSERT INTO trips (name, start_date, end_date, travelers_count, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        'Dubai Shopping & Desert Safari 2025',
        '2025-11-12',
        '2025-11-18',
        2,
        'Anniversary trip to Dubai and Abu Dhabi.'
      ]
    );
    const trip2Id = trip2Res.rows[0].id;

    const destDubai = await client.query(
      'INSERT INTO destinations (trip_id, name, country) VALUES ($1, $2, $3) RETURNING id',
      [trip2Id, 'Dubai Marina & Downtown', 'UAE']
    );
    const destAbuDhabi = await client.query(
      'INSERT INTO destinations (trip_id, name, country) VALUES ($1, $2, $3) RETURNING id',
      [trip2Id, 'Abu Dhabi', 'UAE']
    );

    // Fetch categories and members to reference
    const catMap: Record<string, number> = {};
    const cats = await client.query('SELECT id, name FROM categories');
    for (const c of cats.rows) {
      catMap[c.name] = c.id;
    }

    const subMap: Record<string, number> = {};
    const subs = await client.query('SELECT id, name, category_id FROM subcategories');
    for (const s of subs.rows) {
      subMap[`${s.category_id}_${s.name}`] = s.id;
    }

    const memberMap: Record<string, number> = {};
    const members = await client.query('SELECT id, name FROM family_members');
    for (const m of members.rows) {
      memberMap[m.name] = m.id;
    }

    const eurRate = await getRateToInr('EUR');
    const aedRate = await getRateToInr('AED');
    const usdRate = await getRateToInr('USD');

    // Add Expenses for Trip 1 (Europe)
    const europeExpenses = [
      {
        trip_id: trip1Id,
        dest_id: destParis.rows[0].id,
        name: 'Return Flights Air France (Del - Cdg)',
        amount: 245000,
        currency: 'INR',
        rate: 1.0,
        date: '2026-06-10',
        cat: 'Flights',
        sub: 'International',
        member: 'Naved',
        comment: 'Booked 4 tickets with checked baggage'
      },
      {
        trip_id: trip1Id,
        dest_id: destParis.rows[0].id,
        name: 'Schengen Visa Fees for 4',
        amount: 32000,
        currency: 'INR',
        rate: 1.0,
        date: '2026-05-15',
        cat: 'Visa',
        sub: 'Visa Fee',
        member: 'Naved',
        comment: 'VFS Global Paris application center'
      },
      {
        trip_id: trip1Id,
        dest_id: destParis.rows[0].id,
        name: 'Pullman Paris Eiffel Hotel (4 nights)',
        amount: 1400,
        currency: 'EUR',
        rate: eurRate,
        date: '2026-06-10',
        cat: 'Accommodation',
        sub: 'Hotel',
        member: 'Naved',
        comment: 'Room with view of Eiffel Tower'
      },
      {
        trip_id: trip1Id,
        dest_id: destParis.rows[0].id,
        name: 'Louvre & Eiffel Tower Summit Tickets',
        amount: 220,
        currency: 'EUR',
        rate: eurRate,
        date: '2026-06-12',
        cat: 'Tickets',
        sub: 'Museums',
        member: 'Spouse',
        comment: 'Skip-the-line family pass'
      },
      {
        trip_id: trip1Id,
        dest_id: destParis.rows[0].id,
        name: 'Bistro Dinner in Montmartre',
        amount: 145,
        currency: 'EUR',
        rate: eurRate,
        date: '2026-06-12',
        cat: 'Food',
        sub: 'Dinner',
        member: 'Naved',
        comment: 'Classic French cuisine & desserts'
      },
      {
        trip_id: trip1Id,
        dest_id: destAms.rows[0].id,
        name: 'Thalys Eurostar Train Paris to Amsterdam',
        amount: 380,
        currency: 'EUR',
        rate: eurRate,
        date: '2026-06-14',
        cat: 'Transportation',
        sub: 'Train',
        member: 'Naved',
        comment: 'First class family seating'
      },
      {
        trip_id: trip1Id,
        dest_id: destAms.rows[0].id,
        name: 'Amsterdam Canal Cruise & Van Gogh Museum',
        amount: 160,
        currency: 'EUR',
        rate: eurRate,
        date: '2026-06-15',
        cat: 'Activities',
        sub: 'Sightseeing',
        member: 'Spouse',
        comment: 'Evening canal lights cruise'
      },
      {
        trip_id: trip1Id,
        dest_id: destSwiss.rows[0].id,
        name: 'Swiss Travel Pass (4 Days)',
        amount: 980,
        currency: 'EUR',
        rate: eurRate,
        date: '2026-06-18',
        cat: 'Transportation',
        sub: 'Train',
        member: 'Naved',
        comment: 'Unlimited travel on trains, boats, and mountain buses'
      },
      {
        trip_id: trip1Id,
        dest_id: destSwiss.rows[0].id,
        name: 'Jungfraujoch Top of Europe Mountain Excursion',
        amount: 450,
        currency: 'EUR',
        rate: eurRate,
        date: '2026-06-20',
        cat: 'Activities',
        sub: 'Tours',
        member: 'Naved',
        comment: 'Cogwheel train to glacier summit'
      },
      {
        trip_id: trip1Id,
        dest_id: destSwiss.rows[0].id,
        name: 'Swiss Chocolates & Souvenirs in Lucerne',
        amount: 180,
        currency: 'EUR',
        rate: eurRate,
        date: '2026-06-22',
        cat: 'Shopping',
        sub: 'Souvenirs',
        member: 'Spouse',
        comment: 'Läderach chocolates for family'
      }
    ];

    // Add Expenses for Trip 2 (Dubai)
    const dubaiExpenses = [
      {
        trip_id: trip2Id,
        dest_id: destDubai.rows[0].id,
        name: 'Emirates Flights (BOM - DXB)',
        amount: 72000,
        currency: 'INR',
        rate: 1.0,
        date: '2025-11-12',
        cat: 'Flights',
        sub: 'International',
        member: 'Naved',
        comment: 'Direct evening flight'
      },
      {
        trip_id: trip2Id,
        dest_id: destDubai.rows[0].id,
        name: 'Dubai Marina Hotel & Suites (5 nights)',
        amount: 3800,
        currency: 'AED',
        rate: aedRate,
        date: '2025-11-12',
        cat: 'Accommodation',
        sub: 'Hotel',
        member: 'Naved',
        comment: 'Luxury suite overlooking marina'
      },
      {
        trip_id: trip2Id,
        dest_id: destDubai.rows[0].id,
        name: 'VIP Desert Safari with BBQ Dinner & Dune Bashing',
        amount: 650,
        currency: 'AED',
        rate: aedRate,
        date: '2025-11-14',
        cat: 'Activities',
        sub: 'Tours',
        member: 'Naved',
        comment: 'Private Land Cruiser and desert camp'
      },
      {
        trip_id: trip2Id,
        dest_id: destDubai.rows[0].id,
        name: 'Dubai Mall Perfumes & Fashion Shopping',
        amount: 1200,
        currency: 'AED',
        rate: aedRate,
        date: '2025-11-15',
        cat: 'Shopping',
        sub: 'Clothing',
        member: 'Spouse',
        comment: 'Oud perfumes & clothes'
      },
      {
        trip_id: trip2Id,
        dest_id: destAbuDhabi.rows[0].id,
        name: 'Private Taxi Day Trip to Abu Dhabi Sheikh Zayed Mosque',
        amount: 500,
        currency: 'AED',
        rate: aedRate,
        date: '2025-11-16',
        cat: 'Transportation',
        sub: 'Taxi / Rideshare',
        member: 'Naved',
        comment: 'Full day chauffeur'
      }
    ];

    const allExp = [...europeExpenses, ...dubaiExpenses];

    for (const e of allExp) {
      const catId = catMap[e.cat] || null;
      const subId = catId && e.sub ? (subMap[`${catId}_${e.sub}`] || null) : null;
      const memId = memberMap[e.member] || null;
      const amountInr = parseFloat((e.amount * e.rate).toFixed(2));

      await client.query(
        `INSERT INTO expenses (
          trip_id, destination_id, name, amount, currency, 
          exchange_rate_to_inr, amount_inr, expense_date, 
          category_id, subcategory_id, paid_by_member_id, comment
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          e.trip_id,
          e.dest_id,
          e.name,
          e.amount,
          e.currency,
          e.rate,
          amountInr,
          e.date,
          catId,
          subId,
          memId,
          e.comment,
        ]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Initial sample vacation data seeded successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding sample data:', err);
  } finally {
    client.release();
  }
}
