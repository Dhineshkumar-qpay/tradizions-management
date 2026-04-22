import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../connection.js";
import { AuthModel } from "./auth_model.js";
import { ProductModel } from "./product_gift_model.js";

class FavouriteProductModel extends Model {}

FavouriteProductModel.init(
  {
    favouriteid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
      allowNull: false,
      references: {
        model: ProductModel,
        key: "productid",
      },
    },
  },
  {
    sequelize,
    tableName: "favourite_products",
    modelName: "FavouriteProductModel",
    timestamps: true,
  },
);

FavouriteProductModel.belongsTo(AuthModel, {
  foreignKey: "userid",
  as: "user",
});
FavouriteProductModel.belongsTo(ProductModel, {
  foreignKey: "productid",
  as: "product",
});

export { FavouriteProductModel };
