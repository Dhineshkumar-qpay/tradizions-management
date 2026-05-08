import { sequelize } from "../../connection.js";
import { DataTypes, Model } from "sequelize";

class CategoryModel extends Model {}

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

class SubCategoryModel extends Model {}

SubCategoryModel.init(
  {
    subcategoryid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    subcategoryname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    categoryid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: CategoryModel,
        key: "categoryid",
      },
    },
    categoryname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize: sequelize,
    tableName: "subcategories",
    timestamps: false,
    modelName: "SubCategoryModel",
  },
);

export { CategoryModel, SubCategoryModel };

SubCategoryModel.belongsTo(CategoryModel, { foreignKey: "categoryid" });
CategoryModel.hasMany(SubCategoryModel, { foreignKey: "categoryid" });
