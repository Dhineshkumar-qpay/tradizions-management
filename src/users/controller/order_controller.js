import { sequelize } from "../../../connection.js";
import { AddressModel } from "../../model/address_model.js";
import { CartModel } from "../../model/cart_model.js";
import { OrderItemModel, OrderModel } from "../../model/order_model.js";
import { ProductModel } from "../../model/product_gift_model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const placeOrder = asyncHandler(async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const userid = req.user?.userid;
    const { addressid } = req.body;

    if (!userid) {
      throw new ApiError(401, "User not authenticated");
    }

    if (!addressid) {
      throw new ApiError(400, "Address ID is required");
    }

    // CHECK ADDRESS
    const existingAddress = await AddressModel.findOne({
      where: { addressid, userid },
    });

    if (!existingAddress) {
      throw new ApiError(404, "Address not found");
    }

    // GET CART ITEMS
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
      lock: true,
    });

    if (!cartItems.length) {
      throw new ApiError(400, "Cart is empty");
    }

    let totalamount = 0;

    // VALIDATE STOCK AND CALCULATE TOTAL
    for (const item of cartItems) {
      const product = item.product;

      if (product.availablestock < item.quantity) {
        throw new ApiError(
          400,
          `${product.productname} only ${product.availablestock} stock available`,
        );
      }

      const price = parseFloat(product.sellingprice) || parseFloat(product.price);
      // Note: giftcardprice and giftmessage are assumed to be in CartModel or handled if present
      const giftCardPrice = parseFloat(item.giftcardprice || 0);

      totalamount += (price + giftCardPrice) * item.quantity;
    }

    // CREATE MAIN ORDER
    const order = await OrderModel.create(
      {
        userid,
        addressid,
        totalamount,
        orderstatus: "pending",
        paymentstatus: "pending",
      },
      { transaction },
    );

    // CREATE ORDER ITEMS AND UPDATE STOCK
    for (const item of cartItems) {
      const product = item.product;
      const price = parseFloat(product.sellingprice) || parseFloat(product.price);
      const giftCardPrice = parseFloat(item.giftcardprice || 0);
      const singleItemPrice = price + giftCardPrice;
      const totalItemPrice = singleItemPrice * item.quantity;

      // CREATE ORDER ITEM
      await OrderItemModel.create(
        {
          orderid: order.orderid,
          bid: product.bid,
          userid,
          productid: product.productid,
          quantity: item.quantity,
          price,
          giftcardid: item.giftcardid || null,
          giftmessage: item.giftmessage || null,
          giftcardprice: giftCardPrice,
          totalprice: totalItemPrice,
          itemstatus: "pending",
        },
        { transaction },
      );

      // REDUCE STOCK
      product.availablestock -= item.quantity;
      await product.save({ transaction });
    }

    // CLEAR CART
    await CartModel.destroy({
      where: { userid },
      transaction,
    });

    await transaction.commit();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          orderid: order.orderid,
          totalamount,
        },
        "Order placed successfully",
      ),
    );
  } catch (error) {
    if (transaction) await transaction.rollback();
    throw error;
  }
});
