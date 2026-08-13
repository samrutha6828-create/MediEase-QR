export const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3000", 10),
  databaseUrl: process.env.DATABASE_URL || "file:./prisma/dev.db",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
  isProd: process.env.NODE_ENV === "production",
  isDev: (process.env.NODE_ENV || "development") === "development",
};
