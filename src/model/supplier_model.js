import { sequelize } from "../../connection.js";
import { DataTypes, ENUM, Model } from "sequelize";
import { ProductModel } from "./product_gift_model.js";

class SupplierModel extends Model {}

SupplierModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    companyname: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gst: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    logo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    brandname: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: ENUM("active", "inactive"),
      defaultValue: "active",
    },
  },
  {
    sequelize,
    tableName: "suppliers",
    modelName: "SupplierModel",
    timestamps: true,
  },
);

class SupplierProductModel extends Model {}

SupplierProductModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    supplierid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: SupplierModel,
        key: "id",
      },
    },
    productid: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: ProductModel,
        key: "productid",
      },
    },
    productname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    totalweight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    remainingweight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    unit: {
      type: DataTypes.ENUM("kg", "grams"),
      allowNull: false,
      defaultValue: "kg",
    },
    totalprice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    perproductkgprice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    avgproductprice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    markuppercentage: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 30.00,
    },
  },
  {
    sequelize,
    tableName: "supplierproducts",
    modelName: "SupplierProductModel",
    timestamps: true,
  },
);

export { SupplierModel, SupplierProductModel };

SupplierProductModel.belongsTo(SupplierModel, { foreignKey: "supplierid" });
SupplierModel.hasMany(SupplierProductModel, { foreignKey: "supplierid" });
SupplierProductModel.belongsTo(ProductModel, {
  foreignKey: "productid",
  as: "product",
});
ProductModel.hasMany(SupplierProductModel, {
  foreignKey: "productid",
  as: "supplierProducts",
});
