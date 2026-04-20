import { Sequelize } from "sequelize";
import { current, mode } from "./config/config.js";
import mysql2 from "mysql2";

export const sequelize = new Sequelize(
  current.database.db_name,
  current.database.username,
  current.database.password,
  {
    host: current.database.host,
    port: current.database.port,
    dialect: "mysql",
    dialectModule: mysql2,
    timezone: "+05:30",
    logging: false,
    dialectOptions: {
      connectTimeout: 20000,
    },
  },
);

export const connectDB = async () => {
  try {
    await sequelize.authenticate();

    if (mode === "development") {
      await sequelize.sync();
    }
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
};
