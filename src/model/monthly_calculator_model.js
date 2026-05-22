import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../connection.js";
import { AuthModel } from "./auth_model.js";
import { ProductModel } from "./product_gift_model.js";
import { BusinessModel } from "./business_model.js";

class MonthlyCalculatorModel extends Model {}

MonthlyCalculatorModel.init(
  {
    monthlycartid: {
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
      allowNull: false,
      references: {
        model: ProductModel,
        key: "productid",
      },
    },
    gramsperday: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dayspermonth: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    familymembers: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "monthlycart",
    modelName: "MonthlyCalculatorModel",
    timestamps: true,
  }
);

export { MonthlyCalculatorModel };

// Associations
MonthlyCalculatorModel.belongsTo(ProductModel, { foreignKey: "productid", as: "product" });
MonthlyCalculatorModel.belongsTo(AuthModel, { foreignKey: "userid", as: "user" });
MonthlyCalculatorModel.belongsTo(BusinessModel, { foreignKey: "bid", as: "business" });
