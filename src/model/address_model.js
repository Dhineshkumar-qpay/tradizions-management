import { Model } from "sequelize";
import { sequelize } from "../../connection.js";
import { DataTypes } from "sequelize";
import { AuthModel } from "./auth_model.js";

class AddressModel extends Model {}

AddressModel.init(
  {
    addressid: {
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
    addressas: {
      type: DataTypes.ENUM("Home", "Office", "Other"),
      defaultValue: "Home",
    },
    addressline: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    landmark: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    district: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    districtid: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    stateid: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pincode: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 6],
      },
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    addresslabel: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize: sequelize,
    tableName: "address",
    modelName: "AddressModel",
    timestamps: true,
  },
);

export { AddressModel };
