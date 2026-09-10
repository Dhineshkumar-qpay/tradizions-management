import { Model } from "sequelize";
import { sequelize } from "../../connection.js";
import { DataTypes } from "sequelize";

class DistrictModel extends Model {}

DistrictModel.init(
  {
    districtid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    district: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    stateid: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
  },
  {
    sequelize: sequelize,
    tableName: "districts",
    modelName: "DistrictModel",
    timestamps: false,
  },
);

class StateModel extends Model {}

StateModel.init(
  {
    stateid: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize: sequelize,
    tableName: "states",
    modelName: "StateModel",
    timestamps: false,
  },
);

export { DistrictModel, StateModel };
