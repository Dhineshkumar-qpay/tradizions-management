import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../connection.js";

class BlogModel extends Model {}

BlogModel.init(
  {
    blogid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    blogimage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    author: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },
  },
  {
    sequelize,
    modelName: "BlogModel",
    tableName: "blogs",
    timestamps: true,
  }
);

class CookingGuideModel extends Model {}

CookingGuideModel.init(
  {
    guideid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    guideimage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ingredients: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    instructions: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    prep_time: {
      type: DataTypes.INTEGER, // in minutes
      allowNull: true,
    },
    cook_time: {
      type: DataTypes.INTEGER, // in minutes
      allowNull: true,
    },
    difficulty: {
      type: DataTypes.ENUM("easy", "medium", "hard"),
      defaultValue: "medium",
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },
  },
  {
    sequelize,
    modelName: "CookingGuideModel",
    tableName: "cookingguides",
    timestamps: true,
  }
);

export { BlogModel, CookingGuideModel };
