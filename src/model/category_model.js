import { sequelize } from "../../connection.js";
import { DataTypes, Model } from "sequelize";

class CategoryModel extends Model { }

CategoryModel.init(
  {
    categoryid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    categoryimage: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    categoryname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize: sequelize,
    tableName: "categories",
    modelName: "CategoryModel",
    timestamps: true,
  },
);

export { CategoryModel };
