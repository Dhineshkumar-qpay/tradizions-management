import dotenv from "dotenv";
dotenv.config();

const env =
  process.env.NODE_ENV === "production" ? "production" : "development";

export const development = {
  database: {
    db_name: process.env.DEV_DATABASE,
    host: process.env.DEV_HOST,
    username: process.env.DEV_USER,
    password: process.env.DEV_PASSWORD,
    port: parseInt(process.env.DEV_DB_PORT) ||
      3306,
  },
  server: {
    port: parseInt(process.env.PORT) || 3000,
  },
  jwtSecret: process.env.JWT_TOKEN || "tradizions_secret_key",
};

export const production = {
  database: {
    db_name: process.env.MYSQLDATABASE,
    host: process.env.MYSQLHOST,
    username: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    port: parseInt(process.env.MYSQLPORT) || 3306,
  },
  server: {
    port: parseInt(process.env.PORT) || 3306,
  },
  jwtSecret: process.env.JWT_TOKEN || "tradizions_secret_key",
};

export const current = env === "production" ? production : development;
export const mode = env;
