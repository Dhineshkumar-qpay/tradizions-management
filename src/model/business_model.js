import { Model } from "sequelize";
import { sequelize } from "../../connection.js";
import { DataTypes } from "sequelize";

class BusinessModel extends Model {}

BusinessModel.init(
  {
    bid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    businessname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "inactive",
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [10, 10],
      },
    },
    userid: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize: sequelize,
    tableName: "businesses",
    modelName: "BusinessModel",
    timestamps: true,
  },
);

class BasicInfoModel extends Model {}

BasicInfoModel.init(
  {
    basicinfoid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    bid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: BusinessModel,
        key: "bid",
      },
    },
    ownername: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    designation: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mobile: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [10, 10],
      },
    },
    whatsapp: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [10, 10],
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
  },
  {
    sequelize: sequelize,
    tableName: "basicinfo",
    modelName: "BasicInfoModel",
    timestamps: true,
  },
);

class BusinessInfoModel extends Model {}

BusinessInfoModel.init(
  {
    businessinfoid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    bid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: BusinessModel,
        key: "bid",
      },
    },
    businessimage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    businessname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    legalbusinessname: { type: DataTypes.STRING, allowNull: false },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    opentime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    closetime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
  },
  {
    sequelize: sequelize,
    tableName: "businessinfo",
    modelName: "BusinessInfoModel",
    timestamps: true,
  },
);

class BusinessAddressModel extends Model {}

BusinessAddressModel.init(
  {
    addressid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    bid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: BusinessModel,
        key: "bid",
      },
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
  },
  {
    sequelize: sequelize,
    tableName: "businessaddress",
    modelName: "BusinessAddressModel",
    timestamps: true,
  },
);

class KYCModel extends Model {}

KYCModel.init(
  {
    kycid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    bid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: BusinessModel,
        key: "bid",
      },
    },
    aadhaar: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [12, 12],
      },
    },
    aadhaarfront: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    aadhaarback: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pan: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [10, 10],
      },
    },
    panpic: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize: sequelize,
    tableName: "kyc",
    modelName: "KYCModel",
    timestamps: true,
  },
);

class BusinessBankModel extends Model {}

BusinessBankModel.init(
  {
    bankid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    bid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: BusinessModel,
        key: "bid",
      },
    },
    passbook: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    accountholdername: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    accountnumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bankname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    branchname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ifsc: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize: sequelize,
    tableName: "businessbank",
    modelName: "BusinessBankModel",
    timestamps: true,
  },
);

export {
  BusinessModel,
  BasicInfoModel,
  BusinessInfoModel,
  BusinessAddressModel,
  KYCModel,
  BusinessBankModel,
};
