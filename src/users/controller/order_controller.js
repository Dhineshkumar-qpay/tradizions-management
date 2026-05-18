import { or } from "sequelize";
import { sequelize } from "../../../connection.js";
import { AddressModel } from "../../model/address_model.js";
import { CartModel } from "../../model/cart_model.js";
import { OrderItemModel, OrderModel } from "../../model/order_model.js";
import { GiftcardModel, ProductModel } from "../../model/product_gift_model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AuthModel } from "../../model/auth_model.js";

export const placeOrder = asyncHandler(async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const userid = req.user?.userid;
    const { addressid, issameaddress, addressids } = req.body;

    if (!addressid && issameaddress) {
      throw new ApiError(400, "Address ID is required");
    }

    if (issameaddress === undefined) {
      throw new ApiError(400, "Issameaddress is required");
    }

    /// ------- SINGLE ADDRESS VALIDATION -------
    let existingAddress = null;

    if (issameaddress) {
      if (!addressid) {
        throw new ApiError(400, "Address ID is required");
      }

      existingAddress = await AddressModel.findOne({
        where: {
          addressid,
          userid,
        },
        transaction,
      });

      if (!existingAddress) {
        throw new ApiError(404, "Address not found");
      }
    }

    /// ------- MULTIPLE ADDRESS VALIDATION -------
    if (!issameaddress) {
      if (!addressids || !Array.isArray(addressids)) {
        throw new ApiError(400, "Addressids must be an array");
      }

      if (addressids.length === 0) {
        throw new ApiError(400, "Addressids is empty");
      }

      for (const item of addressids) {
        if (!item.productid || !item.addressid) {
          throw new ApiError(400, "Productid and Addressid are required");
        }

        const checkAddress = await AddressModel.findOne({
          where: {
            addressid: item.addressid,
            userid: userid,
          },
          transaction,
        });
        if (!checkAddress) {
          throw new ApiError(
            404,
            `Address not found for product ${item.productid}`,
          );
        }
      }
    }

    /// ------- GET CART ITEMS -------
    const cartItems = await CartModel.findAll({
      where: { userid },
      include: [
        {
          model: ProductModel,
          as: "product",
          required: true,
        },
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!cartItems.length) {
      throw new ApiError(400, "Cart is empty");
    }

    let totalamount = 0;

    /// ------- VALIDATE STOCK AND CALCULATE TOTAL -------
    for (const item of cartItems) {
      const product = item.product;
      if (!product) {
        throw new ApiError(404, "Product not found");
      }

      if (product.availablestock < item.quantity) {
        throw new ApiError(
          400,
          `${product.productname} only ${product.availablestock} stock available`,
        );
      }

      let giftCardPrice = 0;
      if (item.giftcardid) {
        const giftcard = await GiftcardModel.findByPk(item.giftcardid, {
          transaction,
        });
        if (giftcard) {
          giftCardPrice = parseFloat(giftcard.cardprice || 0);
        }
      }
      const price = parseFloat(product.sellingprice || product.price || 0);
      totalamount += (price + giftCardPrice) * item.quantity;
    }

    /// ------- CREATE MAIN ORDER -------
    const order = await OrderModel.create(
      {
        userid,
        addressid: issameaddress ? addressid : 0,
        totalamount,
        orderstatus: "pending",
        paymentstatus: "pending",
      },
      { transaction },
    );

    /// ------- CREATE ORDER ITEMS AND UPDATE STOCK -------
    for (const item of cartItems) {
      const product = item.product;
      const price = parseFloat(product.sellingprice || product.price || 0);
      let giftCardPrice = 0;
      if (item.giftcardid) {
        const giftcard = await GiftcardModel.findByPk(item.giftcardid, {
          transaction,
        });
        if (giftcard) {
          giftCardPrice = parseFloat(giftcard.cardprice || 0);
        }
      }
      const singleItemPrice = price + giftCardPrice;
      const totalItemPrice = singleItemPrice * item.quantity;

      let itemAddressId = null;

      /// ------- SAME ADDRESS -------
      if (issameaddress) {
        itemAddressId = addressid;
      }

      if (!issameaddress) {
        const productAddress = addressids.find(
          (x) => Number(x.productid) === Number(product.productid),
        );

        if (!productAddress) {
          throw new ApiError(
            400,
            `Address missing for product ${product.productid}`,
          );
        }

        itemAddressId = productAddress.addressid;
      }

      /// ------- CREATE ORDER ITEM -------
      await OrderItemModel.create(
        {
          orderid: order.orderid,
          bid: product.bid,
          userid,
          itemtype: product.itemtype,
          productid: product.productid,
          quantity: item.quantity,
          price,
          addressid: itemAddressId,
          giftcardid: item.giftcardid || null,
          giftmessage: item.giftmessage || null,
          giftcardprice: giftCardPrice,
          totalprice: totalItemPrice,
          itemstatus: "pending",
        },
        { transaction },
      );

      /// ------- REDUCE STOCK -------
      product.availablestock -= item.quantity;

      await product.save({ transaction });
    }

    /// ------- CLEAR CART -------
    await CartModel.destroy({
      where: { userid },
      transaction,
    });

    await transaction.commit();

    return res.status(200).json(
      new ApiResponse(200, {
        orderid: order.orderid,
        totalamount,
      }),
    );
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

export const getOrderItems = asyncHandler(async (req, res) => {
  try {
    const userid = req.user?.userid;
    const { itemtype } = req.body;

    const orderItems = await OrderItemModel.findAll({
      where: { userid, itemtype: itemtype },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });

    const updatedOrderItems = await Promise.all(
      orderItems.map(async (item) => {
        const product = await ProductModel.findOne({
          where: { productid: item.productid },
        });

        if (!product) return null;

        return {
          ...item.dataValues,
          productname: product.productname,
          productimage: product.productimage,
          categoryname: product.categoryname,
        };
      }),
    );

    return res.status(200).json(new ApiResponse(200, updatedOrderItems));
  } catch (error) {
    throw error;
  }
});

export const orderDetails = asyncHandler(async (req, res) => {
  try {
    const userid = req.user?.userid;
    const { orderitemid } = req.body;

    if (!orderitemid) throw new ApiError(400, "Order Id is required");

    const orderItem = await OrderItemModel.findOne({
      where: { userid, orderitemid },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });

    if (!orderItem) throw new ApiError(404, "Order Item not found");

    const address = await AddressModel.findOne({
      where: { addressid: orderItem.addressid },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });

    const product = await ProductModel.findOne({
      where: { productid: orderItem.productid },
      attributes: ["productid", "bid", "productname", "productimage"],
    });

    let giftDetails = null;
    let orderDetails;

    orderDetails = {
      orderitemid: orderItem.orderitemid,
      orderid: orderItem.orderid,
      quantity: orderItem.quantity,
      price: orderItem.price,
      totalprice: orderItem.totalprice,
      itemstatus: orderItem.itemstatus,
    };

    if (orderItem.giftcardid) {
      const giftcard = await GiftcardModel.findOne({
        where: {
          giftcardid: orderItem.giftcardid,
        },
      });

      giftDetails = {
        giftcardid: giftcard.giftcardid,
        giftcardimage: giftcard.cardimage,
        giftcardname: giftcard.cardname,
        giftcardprice: giftcard.cardprice,
        giftmessage: orderItem.giftmessage,
      };
    }

    return res.status(200).json(
      new ApiResponse(200, {
        orderdetails: orderDetails,
        product: product,
        giftcard: giftDetails,
        address: address,
      }),
    );
  } catch (error) {
    throw error;
  }
});

// ------------------------ Merchant Orders ------------------------

export const getMerchantOrders = asyncHandler(async (req, res) => {
  try {
    const { bid } = req.body;

    if (!bid) {
      throw new ApiError(400, "Business id is required");
    }

    const orders = await OrderItemModel.findAll({
      where: { bid },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
      include: [
        {
          model: OrderModel,
          as: "order",
          attributes: ["userid", "totalamount", "orderstatus"],
        },
        {
          model: ProductModel,
          as: "product",
          attributes: ["productid", "productname", "productimage"],
        },
        {
          model: AddressModel,
          as: "address",
          attributes: [
            "addressline",
            "landmark",
            "city",
            "district",
            "state",
            "pincode",
          ],
        },
        {
          model: AuthModel,
          as: "user",
          attributes: ["username", "email", "phone"],
        },
      ],
    });

    return res.status(200).json(new ApiResponse(200, orders));
  } catch (error) {
    throw error;
  }
});
