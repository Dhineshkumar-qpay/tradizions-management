import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../connection.js";

class CouponModel extends Model {}

CouponModel.init({
  couponid: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  discount_type: {
    type: DataTypes.ENUM("fixed", "percentage"),
    allowNull: false,
    defaultValue: "fixed",
  },
  discount_value: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  sequelize,
  tableName: "coupons",
  modelName: "CouponModel",
  timestamps: true,
});

export { CouponModel };
