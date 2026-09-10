import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../connection.js";
import { AuthModel } from "./auth_model.js";

class WalletModel extends Model {}

WalletModel.init(
  {
    walletid: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: AuthModel,
        key: "userid",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: "wallets",
    modelName: "WalletModel",
    timestamps: true,
  },
);

AuthModel.hasOne(WalletModel, {
  foreignKey: "userid",
  as: "wallet",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

WalletModel.belongsTo(AuthModel, {
  foreignKey: "userid",
  as: "user",
});

export { WalletModel };
