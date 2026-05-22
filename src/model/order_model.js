import { DataTypes, Model } from "sequelize";
import { BusinessModel } from "./business_model.js";
import { AuthModel } from "./auth_model.js";
import { GiftcardModel, ProductModel } from "./product_gift_model.js";
import { sequelize } from "../../connection.js";
import { AddressModel } from "./address_model.js";

class OrderModel extends Model {}

OrderModel.init(
  {
    orderid: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: AuthModel,
        key: "userid",
      },
    },
    addressid: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    bid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: BusinessModel,
        key: "bid",
      },
    },
    totalamount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    ordertype: {
      type: DataTypes.ENUM("normal", "monthly"),
      defaultValue: "normal",
    },

    orderstatus: {
      type: DataTypes.ENUM(
        "pending",
        "confirmed",
        "processing",
        "packed",
        "shipped",
        "outfordelivery",
        "delivered",
      ),
      allowNull: false,
      defaultValue: "pending",
    },
    paymentstatus: {
      type: DataTypes.ENUM("pending", "paid", "failed"),
      allowNull: false,
      defaultValue: "pending",
    },
    paymentid: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize: sequelize,
    tableName: "orders",
    modelName: "OrderModel",
    timestamps: true,
  },
);

class OrderItemModel extends Model {}

OrderItemModel.init(
  {
    orderitemid: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    orderid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: OrderModel,
        key: "orderid",
      },
    },
    bid: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ordertype: {
      type: DataTypes.ENUM("normal", "monthly"),
      defaultValue: "normal",
    },
    userid: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    itemtype: {
      type: DataTypes.ENUM("product", "gift"),
      allowNull: false,
    },
    productid: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    giftcardid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    giftmessage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    giftcardprice: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0.0,
    },
    totalprice: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    addressid: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    gramsperday: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    dayspermonth: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    familymembers: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    itemstatus: {
      type: DataTypes.ENUM(
        "pending",
        "confirmed",
        "processing",
        "packed",
        "shipped",
        "outfordelivery",
        "delivered",
      ),
      allowNull: false,
      defaultValue: "pending",
    },
  },
  {
    sequelize,
    tableName: "orderitems",
    modelName: "OrderItemModel",
    timestamps: true,
  },
);

export { OrderModel, OrderItemModel };

// ASSOCIATIONS
OrderModel.hasMany(OrderItemModel, {
  foreignKey: "orderid",
  as: "items",
});

OrderItemModel.belongsTo(OrderModel, {
  foreignKey: "orderid",
  as: "order",
});

OrderItemModel.belongsTo(ProductModel, {
  foreignKey: "productid",
  as: "product",
});

OrderItemModel.belongsTo(GiftcardModel, {
  foreignKey: "giftcardid",
  as: "giftcard",
});

OrderItemModel.belongsTo(AuthModel, {
  foreignKey: "userid",
  as: "user",
});

OrderItemModel.belongsTo(BusinessModel, {
  foreignKey: "bid",
  as: "business",
});

OrderItemModel.belongsTo(AddressModel, {
  foreignKey: "addressid",
  as: "address",
});
