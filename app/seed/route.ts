import bcrypt from 'bcrypt';
import postgres from 'postgres';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

// ✅ Important: this route should only run at runtime, never during build
export const dynamic = "force-dynamic";

// Helper to create a Postgres client
function getClient() {
  return postgres(process.env.POSTGRES_URL!, {
    // ssl: 'require', // uncomment if your DB needs SSL
  });
}

async function seedUsers(sql: ReturnType<typeof postgres>) {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;

  return Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return sql`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );
}

async function seedInvoices(sql: ReturnType<typeof postgres>) {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `;

  return Promise.all(
    invoices.map((invoice) => sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
      ON CONFLICT (id) DO NOTHING;
    `),
  );
}

async function seedCustomers(sql: ReturnType<typeof postgres>) {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `;

  return Promise.all(
    customers.map((customer) => sql`
      INSERT INTO customers (id, name, email, image_url)
      VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
      ON CONFLICT (id) DO NOTHING;
    `),
  );
}

async function seedRevenue(sql: ReturnType<typeof postgres>) {
  await sql`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `;

  return Promise.all(
    revenue.map((rev) => sql`
      INSERT INTO revenue (month, revenue)
      VALUES (${rev.month}, ${rev.revenue})
      ON CONFLICT (month) DO NOTHING;
    `),
  );
}

export async function GET() {
  const sql = getClient();

  try {
    await sql.begin((sql) => [
      seedUsers(sql),
      seedCustomers(sql),
      seedInvoices(sql),
      seedRevenue(sql),
    ]);

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    console.error("Seeding failed:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  } finally {
    await sql.end({ timeout: 5 }); // closes DB connection gracefully
  }
}
