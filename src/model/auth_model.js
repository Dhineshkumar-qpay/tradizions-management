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
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
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
      allowNull: true,
      unique: true,
      validate: {
        isNumeric: true,
        len: [10, 10],
      },
    },
    role: {
      type: DataTypes.ENUM("admin", "user"),
      defaultValue: "user",
    },
  },
  {
    sequelize,
    tableName: "users",
    modelName: "AuthModel",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["email"],
      },
      {
        unique: true,
        fields: ["phone"],
      },
    ],
  },
);

export { AuthModel };
