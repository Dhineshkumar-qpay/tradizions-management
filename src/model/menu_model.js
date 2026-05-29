import { Model } from "sequelize";
import { sequelize } from "../../connection.js";

class MenuModel extends Model {}

MenuModel.init(
  {
    menuid: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    menuname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userid: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize: sequelize,
    tableName: "menus",
    modelName: "MenuModel",
    timestamps: false,
  },
);

export { MenuModel };
