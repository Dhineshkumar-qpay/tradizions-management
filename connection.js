import { DataTypes, Sequelize } from "sequelize";
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

// export const sequelize = new Sequelize(
//   "millets_db",
//   "millets_admin",
//   "xdE2Rq2yq4A24bPz",
//   {
//     host: "184.168.98.226",
//     port: "3306",
//     dialect: "mysql",
//     dialectModule: mysql2,
//     timezone: "+05:30",
//     logging: false,
//     dialectOptions: {
//       connectTimeout: 20000,
//     },
//   },
// );

export const connectDB = async () => {
  try {
    await sequelize.authenticate();

    if (mode === "development") {
      await sequelize.sync();
      await ensureSupplierSchema();
    }
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
};

const ensureSupplierSchema = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const supplierColumns = await queryInterface.describeTable("suppliers");
  const supplierProductColumns = await queryInterface.describeTable("supplierproducts");

  const supplierFields = {
    logo: { type: DataTypes.STRING, allowNull: true },
    brandname: { type: DataTypes.STRING, allowNull: true },
    location: { type: DataTypes.STRING, allowNull: true },
  };

  for (const [column, definition] of Object.entries(supplierFields)) {
    if (!supplierColumns[column]) {
      await queryInterface.addColumn("suppliers", column, definition);
    }
  }

  if (!supplierProductColumns.productid) {
    await queryInterface.addColumn("supplierproducts", "productid", {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
  }

  if (!supplierProductColumns.avgproductprice) {
    await queryInterface.addColumn("supplierproducts", "avgproductprice", {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    });
  }
};
