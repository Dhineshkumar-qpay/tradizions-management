import { Model } from "sequelize";
import { sequelize } from "../../connection.js";
import { DataTypes } from "sequelize";

class ThinamOruKuralModel extends Model {}

ThinamOruKuralModel.init(
  {
    kuralid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    kural: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    meaning: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize: sequelize,
    tableName: "thinamorukural",
    modelName: "ThinamOruKuralModel",
    timestamps: true,
  },
);

class TradizionsReviewModel extends Model {}

TradizionsReviewModel.init(
  {
    reviewid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userid: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rating: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    review: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize: sequelize,
    tableName: "tradizionsreview",
    modelName: "TradizionsReviewModel",
    timestamps: true,
  },
);

export { ThinamOruKuralModel, TradizionsReviewModel };
