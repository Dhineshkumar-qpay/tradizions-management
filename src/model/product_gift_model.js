import { ENUM, Model } from "sequelize";
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
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
      get() {
        const rawValue = this.getDataValue("price");
        return rawValue ? parseFloat(Number(rawValue).toFixed(2)) : 0;
      },
    },
    sellingprice: {
      type: DataTypes.FLOAT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue("sellingprice");
        return rawValue ? parseFloat(Number(rawValue).toFixed(2)) : 0;
      },
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    healthgoalids: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    unit: {
      type: DataTypes.ENUM("kg", "g", "Pcs", "ml", "l"),
      defaultValue: "g",
    },
    availablestock: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isFavourite: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isTrending: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isBestSeller: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isNewArrivals: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
    productlist: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    packingtype: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    itemtype: {
      type: DataTypes.ENUM("product", "gift"),
      defaultValue: "product",
    },
    gifttype: {
      type: DataTypes.ENUM("nuts", "pooja"),
      defaultValue: "nuts",
    },
    healthgoalids: {
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

class GiftcardModel extends Model {}

GiftcardModel.init(
  {
    giftcardid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    cardname: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cardimage: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },
    userid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize: sequelize,
    tableName: "giftcards",
    modelName: "GiftcardModel",
    timestamps: false,
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
    },
    productname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: BusinessModel,
        key: "bid",
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

class HealthGoalsModel extends Model {}

HealthGoalsModel.init(
  {
    goalid: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    goalimage: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    goalname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize: sequelize,
    tableName: "healthgoals",
    modelName: "HealthGoalsModel",
    timestamps: false,
  },
);

class ProductHealthGoal extends Model {}

ProductHealthGoal.init(
  {
    id: {
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
    goalid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: HealthGoalsModel,
        key: "goalid",
      },
    },
  },
  {
    sequelize: sequelize,
    tableName: "producthealthgoals",
    modelName: "ProductHealthGoal",
    timestamps: false,
  },
);

class GiftPackModel extends Model {}

GiftPackModel.init(
  {
    giftpackid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    bid: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    giftpackimage: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    giftpackname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    giftpackprice: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize: sequelize,
    timestamps: false,
    modelName: "GiftPackModel",
    tableName: "giftpacks",
  },
);

class CustomGiftItemModel extends Model {}

CustomGiftItemModel.init(
  {
    customgiftitemid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    giftpackid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: GiftPackModel,
        key: "giftpackid",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },

    productid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: ProductModel,
        key: "productid",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },

    productname: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    productimage: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    sellingprice: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },

    itemtype: {
      type: ENUM("customgift"),
      defaultValue: "customgift",
    },

    totalprice: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    userid: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize: sequelize,
    tableName: "customgiftitems",
    modelName: "CustomGiftItemModel",
    timestamps: true,
  },
);

export {
  ProductModel,
  ProductImagesModel,
  ProductReviewModel,
  GiftcardModel,
  HealthGoalsModel,
  ProductHealthGoal,
  GiftPackModel,
  CustomGiftItemModel,
};

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

HealthGoalsModel.belongsToMany(ProductModel, {
  through: "product_healthgoals",
  foreignKey: "goalid",
  otherKey: "productid",
});

ProductModel.belongsToMany(HealthGoalsModel, {
  through: "product_healthgoals",
  foreignKey: "productid",
  otherKey: "goalid",
});
