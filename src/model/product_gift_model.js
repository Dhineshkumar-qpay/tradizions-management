import { Model } from "sequelize";
import { sequelize } from "../../connection.js";
import { DataTypes } from "sequelize";
import { BusinessModel } from "./business_model.js";

class ProductModel extends Model {}

ProductModel.init(
  {
    productid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    bid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: BusinessModel,
        key: "bid",
      },
    },
    productimage: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    productname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    categoryid: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    categoryname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    brandname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    sellingprice: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    unit: {
      type: DataTypes.ENUM("kg", "g", "Pcs", "ml", "l"),
      defaultValue: "g",
    },
    availablestock: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    specs: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize: sequelize,
    tableName: "products",
    modelName: "ProductModel",
    timestamps: true,
  },
);

class ProductImagesModel extends Model {}

ProductImagesModel.init(
  {
    imageid: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    bid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: BusinessModel,
        key: "bid",
      },
    },
    productid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: ProductModel,
        key: "productid",
      },
    },
    image1: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    image2: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    image3: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    image4: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize: sequelize,
    tableName: "productimages",
    modelName: "ProductImagesModel",
    timestamps: false,
  },
);


class GiftModel extends Model {}

GiftModel.init(
  {
    giftid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    bid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: BusinessModel,
        key: "bid",
      },
    },
    giftname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    giftimage: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    giftdescription: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    productlist: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    giftprice: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    giftsellingprice: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    packingtype: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize: sequelize,
    tableName: "gifts",
    modelName: "GiftModel",
    timestamps: true,
  },
);

export {
  ProductModel,
  ProductImagesModel,
  GiftModel,
};
