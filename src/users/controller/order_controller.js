import { Op, or } from "sequelize";
import { sequelize } from "../../../connection.js";
import { AddressModel } from "../../model/address_model.js";
import { CartModel } from "../../model/cart_model.js";
import { OrderItemModel, OrderModel } from "../../model/order_model.js";
import { GiftcardModel, ProductModel } from "../../model/product_gift_model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AuthModel } from "../../model/auth_model.js";
import {
  sendEmail,
  normalProductsOrder,
} from "../../admin/controller/mailController.js";

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
        bid: cartItems[0].product.bid,
        addressid: issameaddress ? addressid : 0,
        totalamount,
        orderstatus: "pending",
        paymentstatus: "pending",
      },
      { transaction },
    );

    const mailItems = [];
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

      mailItems.push({
        productName: product.productname,
        productImage: product.productimage,
        quantity: item.quantity,
        price: singleItemPrice,
        total: totalItemPrice,
        addressid: null, // will be set after itemAddressId is resolved
      });

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

      // store the resolved addressid on the corresponding mailItem
      mailItems[mailItems.length - 1].addressid = itemAddressId;

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

    try {
      // Collect all unique addressids used across items
      const uniqueAddressIds = [
        ...new Set(mailItems.map((i) => i.addressid).filter(Boolean)),
      ];

      // Fetch all address records in one query
      const addressRecords = await AddressModel.findAll({
        where: { addressid: uniqueAddressIds },
      });
      const addressMap = {};
      for (const addr of addressRecords) {
        addressMap[addr.addressid] = addr;
      }

      // Attach full address object to each mail item
      const enrichedMailItems = mailItems.map((mi) => ({
        ...mi,
        address: addressMap[mi.addressid] || null,
      }));

      // Use same-address record for customer info, fallback to first found address
      const primaryAddress = issameaddress
        ? await AddressModel.findOne({ where: { addressid, userid } })
        : addressRecords[0] || null;

      if (primaryAddress) {
        const targetEmail = "dinesh@vidyutinfo.in";
        const orderData = {
          customerName: primaryAddress.fullname || "Customer",
          customerEmail: targetEmail,
          customerPhone: primaryAddress.mobilenumber || "",
          orderId: order.orderid,
          orderDate: new Date().toLocaleDateString(),
          issameaddress,
          // shared address (only used when issameaddress = true)
          addressLine1: primaryAddress.addressline || "",
          addressLine2: primaryAddress.landmark || "",
          city: primaryAddress.city || "",
          pincode: primaryAddress.pincode || "",
          state: primaryAddress.state || "",
          country: primaryAddress.country || "",
          items: enrichedMailItems,
          subtotal: totalamount,
          deliveryCharge: 0,
          tax: 0,
          grandTotal: totalamount,
        };

        const emailHtml = normalProductsOrder(orderData).html;
        await sendEmail(
          targetEmail,
          `Order Confirmation - #${order.orderid}`,
          `Your order #${order.orderid} has been successfully placed.`,
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

export const getAllOrders = asyncHandler(async (req, res) => {
  try {
    const { ordertype } = req.body;
    const orders = await OrderModel.findAll({
      where: {
        userid: req.user?.userid,
        ordertype: ordertype,
      },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
      order: [["createdAt", "DESC"]],
    });
    const updatedOrders = await Promise.all(
      orders.map(async (order) => {
        const orderItems = await OrderItemModel.findAll({
          where: {
            orderid: order.orderid,
          },
          include: [
            {
              model: ProductModel,
              as: "product",
              attributes: ["productid", "productname", "productimage"],
            },
            {
              model: GiftcardModel,
              as: "giftcard",
              attributes: ["giftcardid", "cardname", "cardimage"],
            },
          ],
        });

        const items = orderItems.map((item) => ({
          ...item.product.dataValues,
        }));

        return {
          ...order.dataValues,
          items: items,
        };
      }),
    );

    return res.status(200).json(new ApiResponse(200, updatedOrders));
  } catch (error) {
    throw error;
  }
  s;
});

export const orderDetails = asyncHandler(async (req, res) => {
  try {
    const { orderid } = req.body;

    if (!orderid) {
      throw new ApiError(400, "Order ID is required");
    }

    const order = await OrderModel.findOne({
      where: { orderid },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    const orderItems = await OrderItemModel.findAll({
      where: {
        orderid: orderid,
      },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
      include: [
        {
          model: ProductModel,
          as: "product",
          required: false,
          attributes: [
            "productid",
            "bid",
            "productname",
            "productimage",
            "price",
            "sellingprice",
            "itemtype",
          ],
        },
        {
          model: GiftcardModel,
          as: "giftcard",
          required: false,
          attributes: ["giftcardid", "cardname", "cardimage", "cardprice"],
        },
        {
          model: AddressModel,
          as: "address",
          required: false,
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

    let formattedAddress = null;

    const formattedItems = orderItems.map((item) => {
      const product = item.product || null;
      let giftcard = item.giftcard || null;
      const address = item.address || null;

      if (address) {
        formattedAddress = `${address.addressline}, ${address.landmark}, ${address.city}, ${address.district}, ${address.state}, ${address.pincode}`;
      }

      let quantitypersonkg = null;
      let totalquantitykg = null;
      let calculatedprice = null;

      if (item.gramsperday && item.dayspermonth && item.familymembers) {
        const activePrice = parseFloat(
          product?.sellingprice || product?.price || 0,
        );

        quantitypersonkg = (item.gramsperday * item.dayspermonth) / 1000;

        totalquantitykg = quantitypersonkg * item.familymembers;

        calculatedprice = Math.round(activePrice * totalquantitykg);
      }

      if (giftcard) {
        giftcard = {
          giftcardid: giftcard.giftcardid,
          cardname: giftcard.cardname,
          cardimage: giftcard.cardimage,
          cardprice: giftcard.cardprice,
          giftmessage: item.giftmessage,
        };
      }

      return {
        orderitemid: item.orderitemid,
        orderid: item.orderid,
        userid: item.userid,
        quantity: item.quantity,
        price: item.price,
        giftmessage: item.giftmessage,
        totalprice: item.totalprice,
        itemstatus: item.itemstatus,
        ordertype: item.ordertype,

        gramsperday: item.gramsperday || null,
        dayspermonth: item.dayspermonth || null,
        familymembers: item.familymembers || null,

        quantitypersonkg:
          quantitypersonkg !== null
            ? parseFloat(quantitypersonkg.toFixed(2))
            : null,

        totalquantitykg:
          totalquantitykg !== null
            ? parseFloat(totalquantitykg.toFixed(2))
            : null,

        calculatedprice: calculatedprice,

        product: product,
        giftcard: giftcard,
        address: address,
      };
    });

    return res.status(200).json(
      new ApiResponse(200, {
        order: {
          orderid: order.orderid,
          totalamount: order.totalamount,
          orderstatus: order.orderstatus,
          paymentstatus: order.paymentstatus,
          paymentmethod: order.paymentmethod,
          ordertype: order.ordertype,
          address: formattedAddress,
        },
        items: formattedItems,
      }),
    );
  } catch (error) {
    throw error;
  }
});
// ------------------------ User Orders ------------------------

export const getAlluserOrders = asyncHandler(async (req, res) => {
  try {
    const userid = req.user?.userid;

    const orders = await OrderModel.findAll({
      where: { userid },
      include: [
        {
          model: OrderItemModel,
          as: "items",
          include: [
            {
              model: ProductModel,
              as: "product",
              attributes: ["productid", "productname", "productimage"],
            },
            {
              model: GiftcardModel,
              as: "giftcard",
              attributes: ["giftcardid", "cardname", "cardimage"],
            },
            {
              model: AddressModel,
              as: "address",
              attributes: ["addressline", "city", "pincode"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json(new ApiResponse(200, orders));
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

    const orders = await OrderModel.findAll({
      where: {
        bid: bid,
        ordertype: "normal",
      },
      attributes: {
        exclude: ["updatedAt"],
      },
      order: [["createdAt", "DESC"]],
    });

    const updatedOrders = await Promise.all(
      orders.map(async (order) => {
        const orderItems = await OrderItemModel.findAll({
          where: {
            orderid: order.orderid,
          },
          include: [
            {
              model: ProductModel,
              as: "product",
              attributes: ["productid", "productname", "productimage"],
            },
            {
              model: GiftcardModel,
              as: "giftcard",
              attributes: ["giftcardid", "cardname", "cardimage"],
            },
          ],
        });

        const items = orderItems.map((item) => ({
          ...item.product.dataValues,
        }));

        return {
          ...order.dataValues,
          createdAt: order.createdAt
            .toLocaleDateString("en-GB")
            .replace(/\//g, "-"),
          items: items,
        };
      }),
    );

    return res.status(200).json(new ApiResponse(200, updatedOrders));
  } catch (error) {
    throw error;
  }
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  try {
    const { orderid, orderstatus } = req.body;

    if (!orderid) {
      throw new ApiError(400, "Order Id is required");
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

    order.orderstatus = orderstatus;
    await order.save();

    await OrderItemModel.update(
      {
        itemstatus: orderstatus,
      },
      {
        where: {
          orderid: orderid,
        },
      },
    );

    return res
      .status(200)
      .json(new ApiResponse(200, "Order Status Updated Successfully"));
  } catch (error) {
    throw error;
  }
});

export const updateOrderItemStatus = asyncHandler(async (req, res) => {
  try {
    const { orderitemid, itemstatus } = req.body;

    if (!orderitemid) {
      throw new ApiError(400, "Order Item Id is required");
    }

    const orderItem = await OrderItemModel.findOne({
      where: { orderitemid },
    });

    if (!orderItem) {
      throw new ApiError(404, "Order Item not found");
    }

    orderItem.itemstatus = itemstatus;
    await orderItem.save();

    return res
      .status(200)
      .json(new ApiResponse(200, "Order Status Updated Successfully"));
  } catch (error) {
    throw error;
  }
});

export const getAdminOrdersList = asyncHandler(async (req, res) => {
  try {
    const { bid, fromdate, todate } = req.body;

    if (!bid) {
      throw new ApiError(400, "Business id is required");
    }

    const currentDate = new Date();

    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );

    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const startDate = fromdate
      ? new Date(`${fromdate}T00:00:00.000Z`)
      : startOfMonth;

    const endDate = todate ? new Date(`${todate}T23:59:59.999Z`) : endOfMonth;

    const ordersItems = await OrderItemModel.findAll({
      where: {
        bid,
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },

      include: [
        {
          model: OrderModel,
          as: "order",
          attributes: ["orderid", "userid", "totalamount", "orderstatus"],
        },

        {
          model: ProductModel,
          as: "product",
          attributes: ["productid", "productname", "productimage", "itemtype"],
        },

        {
          model: AddressModel,
          as: "address",
          attributes: [
            "addressid",
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

      order: [["createdAt", "DESC"]],
    });

    const updatedOrderItems = await Promise.all(
      ordersItems.map(async (item) => {
        let giftDetails = {};

        const order = item.order?.dataValues || {};
        const product = item.product?.dataValues || {};
        const address = item.address?.dataValues || {};
        const user = item.user?.dataValues || {};

        const [year, month, day] = item.createdAt
          .toISOString()
          .split("T")[0]
          .split("-");

        const formatedDate = `${day}-${month}-${year}`;

        if (item.giftcardid) {
          giftDetails = await GiftcardModel.findOne({
            where: {
              giftcardid: item.giftcardid,
            },
          });
        }

        return {
          orderid: order.orderid || 0,
          orderitemid: item.orderitemid,
          userid: order.userid || 0,
          orderstatus: order.orderstatus || "",
          username: user.username || "",
          email: user.email || "",
          phone: user.phone || "",
          itemtype: product.itemtype || "",
          productname: product.productname || "",
          productimage: product.productimage || "",
          quantity: item.quantity,
          price: item.price,
          addressid: address.addressid || 0,
          addressline: address.addressline || "",
          landmark: address.landmark || "",
          city: address.city || "",
          district: address.district || "",
          state: address.state || "",
          pincode: address.pincode || "",
          totalprice: item.totalprice,
          itemstatus: item.itemstatus,
          ordertype: item.ordertype || "normal",
          gramsperday: item.gramsperday || null,
          dayspermonth: item.dayspermonth || null,
          familymembers: item.familymembers || null,
          giftcardid: giftDetails?.giftcardid || 0,
          giftcardname: giftDetails?.cardname || "",
          giftcardimage: giftDetails?.cardimage || null,
          giftcardprice: giftDetails?.cardprice || null,
          giftmessage: item.giftmessage || null,
          orderdate: formatedDate,
        };
      }),
    );

    return res.status(200).json(new ApiResponse(200, updatedOrderItems));
  } catch (error) {
    throw error;
  }
});
