import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../connection.js";

class AuthModel extends Model {}

AuthModel.init(
  {
    userid: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    profileimage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    otp_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [2, 100],
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("admin", "user","merchant"),
      defaultValue: "user",
    },
  },
  {
    sequelize,
    tableName: "users",
    modelName: "AuthModel",
    timestamps: true,
  },
);

class NewsLetterModel extends Model {}

NewsLetterModel.init(
  {
    newsletterid: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    tableName: "newsletter",
    modelName: "NewsLetterModel",
    timestamps: true,
  },
);

export { AuthModel, NewsLetterModel };
