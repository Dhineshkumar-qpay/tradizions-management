import { DataTypes, Model } from "sequelize";
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
    menukey: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    parentid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },
  },
  {
    sequelize: sequelize,
    tableName: "menus",
    modelName: "MenuModel",
    timestamps: false,
  },
);

class AdminMenuPermissions extends Model {}

AdminMenuPermissions.init(
  {
    permissionid: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    menuid: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userid: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize: sequelize,
    tableName: "adminmenupermissions",
    modelName: "AdminMenuPermissions",
    timestamps: false,
  },
);

export { MenuModel,AdminMenuPermissions };
