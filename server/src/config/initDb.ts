import fs from 'fs';
import path from 'path';
import pool from './db';

const defaultCategories = [
  {
    name: 'Flights',
    icon: 'Plane',
    color: '#3B82F6',
    subcategories: ['Domestic', 'International', 'Baggage', 'Seat Selection']
  },
  {
    name: 'Accommodation',
    icon: 'Hotel',
    color: '#8B5CF6',
    subcategories: ['Hotel', 'Airbnb', 'Resort', 'Hostel']
  },
  {
    name: 'Food',
    icon: 'Utensils',
    color: '#F59E0B',
    subcategories: ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Drinks & Cafes', 'Groceries']
  },
  {
    name: 'Transportation',
    icon: 'Car',
    color: '#10B981',
    subcategories: ['Taxi / Rideshare', 'Train', 'Metro', 'Bus', 'Car Rental', 'Fuel & Tolls']
  },
  {
    name: 'Shopping',
    icon: 'ShoppingBag',
    color: '#EC4899',
    subcategories: ['Souvenirs', 'Clothing', 'Electronics', 'Gifts']
  },
  {
    name: 'Activities',
    icon: 'Compass',
    color: '#06B6D4',
    subcategories: ['Sightseeing', 'Guided Tours', 'Adventure & Sports', 'Theme Parks']
  },
  {
    name: 'Tickets',
    icon: 'Ticket',
    color: '#6366F1',
    subcategories: ['Museums', 'Events & Shows', 'Attractions', 'Historical Sites']
  },
  {
    name: 'Visa',
    icon: 'FileText',
    color: '#14B8A6',
    subcategories: ['Visa Fee', 'Processing & Agency', 'Photos & Documentation']
  },
  {
    name: 'Insurance',
    icon: 'Shield',
    color: '#64748B',
    subcategories: ['Travel Insurance', 'Medical Insurance']
  },
  {
    name: 'Miscellaneous',
    icon: 'MoreHorizontal',
    color: '#94A3B8',
    subcategories: ['Tips & Gratuities', 'Laundry', 'SIM Card & Data', 'ATM & Forex Fees']
  }
];

const defaultMembers = [
  { name: 'Naved', notes: 'Primary traveler', avatar_color: '#3B82F6' },
  { name: 'Spouse', notes: 'Family member', avatar_color: '#EC4899' },
  { name: 'Child 1', notes: 'Family member', avatar_color: '#10B981' },
  { name: 'Child 2', notes: 'Family member', avatar_color: '#F59E0B' }
];

export async function initializeDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    console.log('🔄 Initializing PostgreSQL database tables...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schemaSql);
    console.log('✅ Tables created or confirmed.');

    // Seed default categories and subcategories
    for (const cat of defaultCategories) {
      const catRes = await client.query(
        `INSERT INTO categories (name, icon, color, is_default)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (name) DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
         RETURNING id`,
        [cat.name, cat.icon, cat.color]
      );
      const catId = catRes.rows[0].id;

      for (const sub of cat.subcategories) {
        await client.query(
          `INSERT INTO subcategories (category_id, name)
           VALUES ($1, $2)
           ON CONFLICT (category_id, name) DO NOTHING`,
          [catId, sub]
        );
      }
    }
    console.log('✅ Default categories & subcategories confirmed.');

    // Seed default family members
    for (const member of defaultMembers) {
      await client.query(
        `INSERT INTO family_members (name, notes, avatar_color)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO NOTHING`,
        [member.name, member.notes, member.avatar_color]
      );
    }
    console.log('✅ Default family members confirmed.');

  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('🎉 Database initialization complete!');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
