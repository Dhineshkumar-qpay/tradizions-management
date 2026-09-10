import { sequelize } from "../../connection.js";
import { DataTypes, ENUM, Model } from "sequelize";
import { SupplierModel, SupplierProductModel } from "./supplier_model.js";

class SaleModel extends Model {}

SaleModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    orderid: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customername: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    saledate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    totalamount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    totalcost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    totalprofit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    status: {
      type: ENUM("pending", "completed", "cancelled"),
      defaultValue: "completed",
    },
  },
  {
    sequelize,
    tableName: "sales",
    modelName: "SaleModel",
    timestamps: true,
  }
);

class SaleItemModel extends Model {}

SaleItemModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    saleid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: SaleModel,
        key: "id",
      },
    },
    supplierid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: SupplierModel,
        key: "id",
      },
    },
    supplierproductid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: SupplierProductModel,
        key: "id",
      },
    },
    productname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    unit: {
      type: ENUM("kg", "grams"),
      allowNull: false,
    },
    quantitygrams: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: "Normalized quantity in grams for easier calculation",
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: "Price per unit",
    },
    costprice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: "Supplier cost per unit at time of sale",
      defaultValue: 0.00,
    },
    totalprice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    totalcost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    profit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
  },
  {
    sequelize,
    tableName: "saleitems",
    modelName: "SaleItemModel",
    timestamps: true,
  }
);

// Relationships
SaleModel.hasMany(SaleItemModel, { foreignKey: "saleid", as: "items" });
SaleItemModel.belongsTo(SaleModel, { foreignKey: "saleid" });

SupplierModel.hasMany(SaleItemModel, { foreignKey: "supplierid" });
SaleItemModel.belongsTo(SupplierModel, { foreignKey: "supplierid" });

SupplierProductModel.hasMany(SaleItemModel, { foreignKey: "supplierproductid" });
SaleItemModel.belongsTo(SupplierProductModel, { foreignKey: "supplierproductid" });

export { SaleModel, SaleItemModel };
