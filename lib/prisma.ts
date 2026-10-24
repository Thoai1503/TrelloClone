import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to your .env file.");
}

const databaseUrl = new URL(connectionString);

if (databaseUrl.protocol !== "mysql:") {
  throw new Error("DATABASE_URL must use the mysql:// protocol.");
}

const database = decodeURIComponent(databaseUrl.pathname.slice(1));

if (!database) {
  throw new Error("DATABASE_URL must include a database name.");
}

const adapter = new PrismaMariaDb({
  host: databaseUrl.hostname,
  port: Number(databaseUrl.port || 3306),
  user: decodeURIComponent(databaseUrl.username),
  password: decodeURIComponent(databaseUrl.password),
  database,
  connectionLimit: 5,
});

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
