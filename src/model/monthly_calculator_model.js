import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../connection.js";
import { AuthModel } from "./auth_model.js";
import { ProductModel } from "./product_gift_model.js";
import { BusinessModel } from "./business_model.js";

class MonthlyCalculatorModel extends Model {}

MonthlyCalculatorModel.init(
  {
    mcid: {
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
    gramsPerDay: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    daysPerMonth: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    familyMembers: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    totalprice: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled"
      ),
      defaultValue: "pending",
    },
  },
  {
    sequelize,
    tableName: "monthly_calculator_orders",
    modelName: "MonthlyCalculatorModel",
    timestamps: true,
  }
);

export { MonthlyCalculatorModel };

// Associations
MonthlyCalculatorModel.belongsTo(ProductModel, { foreignKey: "productid", as: "product" });
MonthlyCalculatorModel.belongsTo(AuthModel, { foreignKey: "userid", as: "user" });
MonthlyCalculatorModel.belongsTo(BusinessModel, { foreignKey: "bid", as: "business" });
