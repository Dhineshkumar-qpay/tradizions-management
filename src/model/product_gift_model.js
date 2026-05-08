import { Model } from "sequelize";
import { sequelize } from "../../connection.js";
import { DataTypes } from "sequelize";
import { BusinessModel } from "./business_model.js";
import { AuthModel } from "./auth_model.js";

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
    subcategoryid: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    subcategoryname: {
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
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isTrending: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isBestSeller: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    ingredients: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shelflife: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    storageinfo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    calories: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
    },
    protien: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
    },
    fibre: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
    },
    fat: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
    },
    carbohydrates: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
    },
    country: {
      type: DataTypes.STRING,
      defaultValue: "India",
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

class ProductReviewModel extends Model {}

ProductReviewModel.init(
  {
    reviewid: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    productid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: ProductModel,
        key: "productid",
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "inactive",
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
    },
    review: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    userid: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize: sequelize,
    tableName: "productreviews",
    modelName: "ProductReviewModel",
    timestamps: true,
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
    categoryid: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    categoryname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subcategoryid: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    subcategoryname: {
      type: DataTypes.STRING,
      allowNull: false,
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

export { ProductModel, ProductImagesModel, ProductReviewModel, GiftModel };

ProductReviewModel.belongsTo(AuthModel, { foreignKey: "userid", as: "user" });

AuthModel.hasMany(ProductReviewModel, { foreignKey: "userid" });

ProductModel.hasMany(ProductImagesModel, {
  foreignKey: "productid",
  onDelete: "CASCADE",
});

ProductImagesModel.belongsTo(ProductModel, {
  foreignKey: "productid",
});

ProductModel.hasMany(ProductReviewModel, {
  foreignKey: "productid",
  onDelete: "CASCADE",
});

ProductReviewModel.belongsTo(ProductModel, {
  foreignKey: "productid",
});
