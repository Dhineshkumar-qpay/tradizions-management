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
      unique: true,
    },
    meaning: {
      type: DataTypes.STRING,
      allowNull: false,
      unique:true
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
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    review: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize: sequelize,
    tableName: "tradizionsreview",
    modelName: "TradizionsReviewModel",
    timestamps: true,
  },
);

class ContactUsModel extends Model {}

ContactUsModel.init(
  {
    contactid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isNumeric: true,
        len: [10, 10],
      },
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM("normal", "corporate"),
      defaultValue: "normal",
    },
  },
  {
    sequelize: sequelize,
    tableName: "contactus",
    modelName: "ContactUsModel",
    timestamps: true,
  },
);

export { ThinamOruKuralModel, TradizionsReviewModel, ContactUsModel };
