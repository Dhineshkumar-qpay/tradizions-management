import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../connection.js";
import { AuthModel } from "./auth_model.js";
import { GiftcardModel, ProductModel } from "./product_gift_model.js";
import { BusinessModel } from "./business_model.js";

class CartModel extends Model {}

CartModel.init(
  {
    cartid: {
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
    userid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: AuthModel,
        key: "userid",
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
    quantity: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1,
    },
    giftcardid: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: GiftcardModel,
        key: "giftcardid",
      },
    },
    giftmessage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    itemtype: {
      type: DataTypes.ENUM("product", "gift"),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "cart",
    modelName: "CartModel",
    timestamps: true,
  },
);

export { CartModel };

// Associations
CartModel.belongsTo(ProductModel, { foreignKey: "productid", as: "product" });
CartModel.belongsTo(AuthModel, { foreignKey: "userid", as: "user" });
CartModel.belongsTo(BusinessModel, { foreignKey: "bid", as: "business" });
