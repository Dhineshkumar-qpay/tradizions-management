import { CartModel } from "../../model/cart_model.js";
import { ProductModel } from "../../model/product_gift_model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { AuthModel } from "../../model/auth_model.js";
import { sequelize } from "../../../connection.js";
import { AddressModel } from "../../model/address_model.js";
import { OrderItemModel, OrderModel } from "../../model/order_model.js";
import { MonthlyCalculatorModel } from "../../model/monthly_calculator_model.js";
import {
  sendEmail,
  monthlyProductsOrders,
} from "../../admin/controller/mailController.js";
import { last1Month, last6Months, last7Days } from "../../utils/date_utile.js";
import { Op } from "sequelize";

export const getCalculatedProducts = asyncHandler(async (req, res) => {
  try {
    const { categoryid, bid } = req.body;

    if (!categoryid || !bid) {
      throw new ApiError(400, "Category ID and Business ID are required");
    }

    const products = await ProductModel.findAll({
      where: { categoryid: categoryid, unit: "kg" },
      attributes: [
        "bid",
        "productid",
        "productname",
        "productimage",
        "price",
        "sellingprice",
        "weight",
        "unit",
      ],
    });
    return res.status(200).json(new ApiResponse(200, products));
  } catch (error) {
    throw error;
  }
});

export const addToMonthlyCart = asyncHandler(async (req, res) => {
  try {
    const userid = req.user?.userid;
    const { products } = req.body;

    if (!userid) throw new ApiError(401, "User not authenticated");

    if (!products || !Array.isArray(products) || products.length === 0) {
      throw new ApiError(400, "Products array is required");
    }

    await MonthlyCalculatorModel.destroy({
      where: { userid },
    });

    const cartData = products.map((item) => {
      if (
        !item.bid ||
        !item.productid ||
        !item.gramsperday ||
        !item.dayspermonth ||
        !item.familymembers
      ) {
        throw new ApiError(
          400,
          "bid, productid, gramsperday, dayspermonth, familymembers are required for all products",
        );
      }
      return {
        userid,
        bid: item.bid,
        productid: item.productid,
        gramsperday: item.gramsperday,
        dayspermonth: item.dayspermonth,
        familymembers: item.familymembers,
      };
    });

    await MonthlyCalculatorModel.bulkCreate(cartData);

    return res
      .status(200)
      .json(new ApiResponse(200, "Items added successfully"));
  } catch (error) {
    throw error;
  }
});

export const getMonthlyCart = asyncHandler(async (req, res) => {
  try {
    const userid = req.user?.userid;

    if (!userid) throw new ApiError(401, "User not authenticated");

    const items = await MonthlyCalculatorModel.findAll({
      where: { userid },
      include: [
        {
          model: ProductModel,
          as: "product",
          required: true,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    let totalamount = 0;

    const formattedItems = items.map((item) => {
      const product = item.product.dataValues;
      const itemData = item.dataValues;

      const activePrice = parseFloat(
        product.sellingprice || product.price || 0,
      );

      const qtyPerPersonKg =
        (itemData.gramsperday * itemData.dayspermonth) / 1000;

      const totalQuantityKg = qtyPerPersonKg * itemData.familymembers;
      const calcultedprice = Math.round(activePrice * totalQuantityKg);

      totalamount += Math.round(totalQuantityKg * activePrice);

      return {
        monthlycartid: item.monthlycartid,
        bid: itemData.bid,
        userid: itemData.userid,
        productid: product.productid,
        productname: product.productname,
        productimage: product.productimage,
        gramsperday: itemData.gramsperday,
        dayspermonth: itemData.dayspermonth,
        familymembers: itemData.familymembers,
        quantitypersonkg: parseFloat(qtyPerPersonKg.toFixed(2)),
        totalquantitykg: parseFloat(totalQuantityKg.toFixed(2)),
        sellingprice: product.sellingprice,
        price: product.price,
        calcultedprice: calcultedprice,
        itemtype: product.itemtype,
      };
    });

    return res.status(200).json(
      new ApiResponse(200, {
        items: formattedItems,
        totalamount: totalamount,
      }),
    );
  } catch (error) {
    throw error;
  }
});

export const placeMonthlyOrder = asyncHandler(async (req, res) => {
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

    /// ------- ADDRESS VALIDATION -------
    const existingAddress = await AddressModel.findOne({
      where: {
        addressid,
        userid,
      },
      transaction,
    });

    if (!existingAddress) {
      throw new ApiError(404, "Address not found");
    }

    const cartItems = await MonthlyCalculatorModel.findAll({
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

    if (!cartItems || cartItems.length === 0) {
      throw new ApiError(400, "Monthly cart is empty");
    }

    let totalamount = 0;
    const orderItemsData = [];
    const mailItems = [];

    /// ------- CALCULATE TOTAL AND PREPARE ITEMS -------
    for (const item of cartItems) {
      const { gramsperday, dayspermonth, familymembers, product } = item;

      const activePrice = parseFloat(
        product.sellingprice || product.price || 0,
      );

      const qtyPerPersonKg = (gramsperday * dayspermonth) / 1000;
      const totalQuantityKg = qtyPerPersonKg * familymembers;
      const totalBudget = Math.round(totalQuantityKg * activePrice);

      if (product.availablestock < totalQuantityKg) {
        throw new ApiError(
          400,
          `${product.productname} only ${product.availablestock} stock available`,
        );
      }

      totalamount += totalBudget;

      orderItemsData.push({
        product,
        gramsperday,
        dayspermonth,
        familymembers,
        quantity: parseFloat(totalQuantityKg.toFixed(2)),
        price: activePrice,
        totalprice: totalBudget,
      });

      mailItems.push({
        productName: product.productname,
        productImage: product.productimage,
        quantity: parseFloat(totalQuantityKg.toFixed(2)) + " kg",
        price: activePrice,
        total: totalBudget,
        gramsperday,
        dayspermonth,
        familymembers,
      });
    }

    /// ------- CREATE MAIN ORDER -------
    const order = await OrderModel.create(
      {
        userid,
        bid: cartItems[0].product.bid,
        addressid: addressid,
        totalamount,
        orderstatus: "pending",
        paymentstatus: "pending",
        ordertype: "monthly",
      },
      { transaction },
    );

    /// ------- CREATE ORDER ITEMS AND UPDATE STOCK -------
    for (const item of orderItemsData) {
      const {
        product,
        quantity,
        price,
        totalprice,
        gramsperday,
        dayspermonth,
        familymembers,
      } = item;

      /// ------- CREATE ORDER ITEM -------
      await OrderItemModel.create(
        {
          orderid: order.orderid,
          bid: product.bid,
          userid,
          itemtype: "monthly",
          productid: product.productid,
          quantity: quantity,
          price: price,
          addressid: addressid,
          giftcardid: null,
          giftmessage: null,
          giftcardprice: 0,
          totalprice: totalprice,
          itemstatus: "pending",
          gramsperday,
          dayspermonth,
          familymembers,
          itemtype: "product",
          ordertype: "monthly",
        },
        { transaction },
      );

      /// ------- REDUCE STOCK -------
      product.availablestock -= quantity;
      await product.save({ transaction });
    }

    await MonthlyCalculatorModel.destroy({
      where: { userid },
      transaction,
    });

    await transaction.commit();

    try {
      const mailAddress = await AddressModel.findOne({
        where: { addressid, userid },
      });

      if (mailAddress) {
        const targetEmail = "dinesh@vidyutinfo.in";
        const orderData = {
          customerName: mailAddress.fullname || "Customer",
          customerEmail: targetEmail,
          customerPhone: mailAddress.mobilenumber || "",
          orderId: order.orderid,
          orderDate: new Date().toLocaleDateString(),
          addressLine1: mailAddress.addressline || "",
          addressLine2: mailAddress.landmark || "",
          city: mailAddress.city || "",
          pincode: mailAddress.pincode || "",
          state: mailAddress.state || "",
          country: mailAddress.country || "",
          items: mailItems,
          subtotal: totalamount,
          deliveryCharge: 0,
          tax: 0,
          grandTotal: totalamount,
        };

        const emailHtml = monthlyProductsOrders(orderData).html;
        await sendEmail(
          targetEmail,
          `Monthly Order Confirmation - #${order.orderid}`,
          `Your monthly order #${order.orderid} has been successfully placed.`,
          emailHtml,
        );
      }
    } catch (mailError) {
      console.error("Error sending order confirmation email:", mailError);
    }

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

export const getMonthlyOrders = asyncHandler(async (req, res) => {
  try {
    const userid = req.user?.userid;

    const orders = await OrderModel.findAll({
      where: { userid, ordertype: "monthly" },
    });

    const updatedOrders = orders.map((item) => {
      return {
        orderid: item.orderid,
        userid: item.userid,
        addressid: item.addressid,
        totalamount: item.totalamount,
        ordertype: item.ordertype,
        orderstatus: item.orderstatus,
        paymentstatus: item.paymentstatus,
        paymentid: item.paymentid,
        orderdate: item.createdAt
          .toLocaleDateString("en-GB")
          .replace(/\//g, "-"),
      };
    });

    return res.status(200).json(new ApiResponse(200, updatedOrders));
  } catch (error) {
    throw error;
  }
});

export const getMonthlyOrderDetails = asyncHandler(async (req, res) => {
  try {
    const { orderid } = req.body;

    if (!orderid) {
      throw new ApiError(400, "Order ID is required");
    }

    const orderItems = await OrderItemModel.findAll({
      where: { orderid },
      include: [
        {
          model: ProductModel,
          as: "product",
          required: true,
          attributes: ["productid", "productname", "productimage", "itemtype"],
        },
        {
          model: AddressModel,
          as: "address",
          required: true,
          attributes: [
            "addressid",
            "title",
            "fullname",
            "mobilenumber",
            "email",
            "addressline",
            "landmark",
            "city",
            "district",
            "state",
            "pincode",
          ],
        },
      ],
    });

    const order = await OrderModel.findOne({
      where: { orderid },
      attributes: ["totalamount", "orderstatus", "paymentstatus"],
    });
    let updatedAddress = null;
    let fullname = null;
    let email = null;
    let mobilenumber = null;

    const formattedItems = orderItems.map((item) => {
      const product = item.product.dataValues;
      const address = item.address.dataValues;
      fullname = address.fullname;
      email = address.email;
      mobilenumber = address.mobilenumber;
      updatedAddress = `${address.title}, ${address.addressline}, ${address.landmark}, ${address.city}, ${address.district}, ${address.state}, ${address.pincode}`;

      const activePrice = parseFloat(
        product.sellingprice || product.price || 0,
      );

      const qtyPerPersonKg = (item.gramsperday * item.dayspermonth) / 1000;

      const totalQuantityKg = qtyPerPersonKg * item.familymembers;
      const calcultedprice = Math.round(activePrice * totalQuantityKg);

      return {
        orderitemid: item.orderitemid,
        orderid: item.orderid,
        productid: product.productid,
        productname: product.productname,
        productimage: product.productimage,
        itemtype: product.itemtype,
        quantitypersonkg: parseFloat(qtyPerPersonKg.toFixed(2)),
        totalquantitykg: parseFloat(totalQuantityKg.toFixed(2)),
        price: item.price,
        totalprice: item.totalprice,
        gramsperday: item.gramsperday,
        dayspermonth: item.dayspermonth,
        familymembers: item.familymembers,
      };
    });

    return res.status(200).json(
      new ApiResponse(200, {
        order: {
          orderid: orderid,
          totalamount: order.totalamount,
          orderstatus: order.orderstatus,
          paymentstatus: order.paymentstatus,
          fullname: fullname,
          email: email,
          mobilenumber: mobilenumber,
          address: updatedAddress,
        },
        items: formattedItems,
      }),
    );
  } catch (error) {
    throw error;
  }
});

export const updateMonthlyOrderStatus = asyncHandler(async (req, res) => {
  const { orderid, orderstatus } = req.body;

  if (!orderid) {
    throw new ApiError(400, "Order ID is required");
  }

  if (!orderstatus) {
    throw new ApiError(400, "Order Status is required");
  }

  const order = await OrderModel.findOne({
    where: { orderid },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  await OrderItemModel.update(
    { itemstatus: orderstatus },
    { where: { orderid } },
  );

  order.orderstatus = orderstatus;
  await order.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Order Status Updated Successfully"));
});

export const getMerchantMonthlyOrders = asyncHandler(async (req, res) => {
  try {
    const { bid, orderstatus, paymentstatus, date } = req.body;

    if (!bid) {
      throw new ApiError(400, "Business id is required");
    }
    let where = {
      bid: bid,
      ordertype: "monthly",
    };
    if (orderstatus && orderstatus !== "all") {
      where.orderstatus = orderstatus;
    }
    if (paymentstatus && paymentstatus !== "all") {
      where.paymentstatus = paymentstatus;
    }

    if (date && date !== "all") {
      switch (date) {
        case "last7days":
          where.createdAt = {
            [Op.between]: [last7Days.from, last7Days.to],
          };
          break;

        case "last1month":
          where.createdAt = {
            [Op.between]: [last1Month.from, last1Month.to],
          };
          break;

        case "last6months":
          where.createdAt = {
            [Op.between]: [last6Months.from, last6Months.to],
          };
          break;
        default:
          break;
      }
    }

    const orders = await OrderModel.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    const updatedOrders = orders.map((item) => {
      return {
        orderid: item.orderid,
        userid: item.userid,
        addressid: item.addressid,
        totalamount: item.totalamount,
        ordertype: item.ordertype,
        orderstatus: item.orderstatus,
        paymentstatus: item.paymentstatus,
        paymentid: item.paymentid,
        orderdate: item.createdAt
          .toLocaleDateString("en-GB")
          .replace(/\//g, "-"),
      };
    });

    return res.status(200).json(new ApiResponse(200, updatedOrders));
  } catch (error) {
    throw error;
  }
});
