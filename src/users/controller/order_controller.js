import { Op } from "sequelize";
import { sequelize } from "../../../connection.js";
import crypto from "crypto";
import Razorpay from "razorpay";
import { AddressModel } from "../../model/address_model.js";
import { CartModel } from "../../model/cart_model.js";
import { OrderItemModel, OrderModel } from "../../model/order_model.js";
import {
  GiftcardModel,
  ProductModel,
  GiftPackModel,
  CustomGiftItemModel,
} from "../../model/product_gift_model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  sendEmail,
  normalProductsOrder,
} from "../../admin/controller/mailController.js";
import { last1Month, last6Months, last7Days } from "../../utils/date_utile.js";
import { CouponModel } from "../../model/coupon_model.js";

export const placeOrder = asyncHandler(async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const userid = req.user?.userid;
    const { addressid, issameaddress, addressids, coupon_code } = req.body;

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
        if ((!item.productid && !item.giftpackid) || !item.addressid) {
          throw new ApiError(
            400,
            "Productid or Giftpackid and Addressid are required",
          );
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
            `Address not found for item ${item.productid || item.giftpackid}`,
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
          required: false,
        },
        {
          model: GiftPackModel,
          as: "giftpack",
          required: false,
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
      if (item.itemtype === "customgift") {
        const giftpack = item.giftpack;
        if (!giftpack) {
          throw new ApiError(404, "Custom gift pack not found");
        }
        const giftItems = await CustomGiftItemModel.findAll({
          where: { giftpackid: item.giftpackid },
          transaction,
        });
        let giftItemsTotal = 0;
        for (const gItem of giftItems) {
          giftItemsTotal += Number(gItem.totalprice || 0);
        }
        const packingPrice = Number(giftpack.giftpackprice || 0);
        const singlePrice = giftItemsTotal + packingPrice;
        item.calculatedPrice = singlePrice;
        // new changes for order
        item.customFirstProductId =
          giftItems.length > 0 ? giftItems[0].productid : 0;
        totalamount += singlePrice * Number(item.quantity || 1);
      } else {
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

        const price = parseFloat(product.sellingprice || product.price || 0);
        item.calculatedPrice = price;
        totalamount += price * item.quantity;
      }
    }

    /// ------- APPLY COUPON IF PROVIDED -------
    let discountAmount = 0;
    if (coupon_code) {
      const coupon = await CouponModel.findOne({ where: { code: coupon_code.toUpperCase(), is_active: true }, transaction });
      if (coupon) {
        if (coupon.discount_type === "percentage") {
          discountAmount = (totalamount * coupon.discount_value) / 100;
        } else {
          discountAmount = coupon.discount_value;
        }
        discountAmount = Math.min(discountAmount, totalamount); // Ensure discount is not greater than total amount
        totalamount -= discountAmount;
      }
    }

    /// ------- CREATE MAIN ORDER -------
    const order = await OrderModel.create(
      {
        userid,
        bid: cartItems[0].bid,
        addressid: issameaddress ? addressid : 0,
        totalamount,
        coupon_code: coupon_code ? coupon_code.toUpperCase() : null,
        discount_amount: discountAmount,
        orderstatus: "pending",
        paymentstatus: "pending",
      },
      { transaction },
    );

    const mailItems = [];
    /// ------- CREATE ORDER ITEMS AND UPDATE STOCK -------
    for (const item of cartItems) {
      const singleItemPrice = item.calculatedPrice;
      const totalItemPrice = singleItemPrice * item.quantity;
      let productName = "";
      let productImage = "";
      let productBid = item.bid;
      let itemid = null;
      let giftpackid = null;

      if (item.itemtype === "customgift") {
        productName = item.giftpack.giftpackname;
        productImage = item.giftpack.giftpackimage;
        giftpackid = item.giftpackid;
        // new changes for order
        itemid = item.customFirstProductId;
      } else {
        productName = item.product.productname;
        productImage = item.product.productimage;
        itemid = item.product.productid;
        productBid = item.product.bid;
      }

      mailItems.push({
        productName: productName,
        productImage: productImage,
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
        let productAddress = null;
        if (item.itemtype === "customgift") {
          productAddress = addressids.find(
            (x) =>
              x.giftpackid && Number(x.giftpackid) === Number(item.giftpackid),
          );
        } else {
          productAddress = addressids.find(
            (x) => x.productid && Number(x.productid) === Number(itemid),
          );
        }

        if (!productAddress) {
          throw new ApiError(400, `Address missing for item`);
        }

        itemAddressId = productAddress.addressid;
      }

      // store the resolved addressid on the corresponding mailItem
      mailItems[mailItems.length - 1].addressid = itemAddressId;

      /// ------- CREATE ORDER ITEM -------
      await OrderItemModel.create(
        {
          orderid: order.orderid,
          bid: productBid,
          userid,
          itemtype: item.itemtype,
          productid: itemid,
          giftpackid: giftpackid || null,
          quantity: item.quantity,
          price: singleItemPrice,
          addressid: itemAddressId,
          giftcardid: item.giftcardid || null,
          giftmessage: item.giftmessage || null,
          totalprice: totalItemPrice,
          itemstatus: "pending",
          sendername: item.sendername || null,
        },
        { transaction },
      );

      /// ------- REDUCE STOCK -------
      if (item.itemtype !== "customgift") {
        item.product.availablestock -= item.quantity;
        await item.product.save({ transaction });
      }
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
          `Tradizions - Your order #${order.orderid} has been successfully placed.`,
          emailHtml,
        );
      }
    } catch (mailError) {
      console.error("Error sending order confirmation email:", mailError);
    }

    const options = {
      amount: Math.round(totalamount * 100),
      currency: "INR",
      receipt: `receipt_${order.orderid}`,
    };
    const paymentOrder = await razorpay.orders.create(options);

    return res.status(200).json(
      new ApiResponse(200, {
        orderid: order.orderid,
        totalamount: parseFloat(totalamount.toFixed(2)),
        paymentOrder,
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
        ordertype,
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
              required: false,
            },
            {
              model: GiftcardModel,
              as: "giftcard",
              attributes: ["giftcardid", "cardname", "cardimage"],
              required: false,
            },
            // new changes for order
            {
              model: GiftPackModel,
              as: "giftpack",
              attributes: ["giftpackid", "giftpackname", "giftpackimage"],
              required: false,
            },
          ],
        });

        let giftCard = null;
        let giftPack = null;

        const items = orderItems.map((item) => {
          if (item.giftcard) {
            giftCard = item.giftcard;
          }

          // new changes for order
          if (item.itemtype === "customgift" && item.giftpack) {
            giftPack = item.giftpack;

            return {
              giftpackid: item.giftpack.giftpackid,
              giftpackname: item.giftpack.giftpackname,
              giftpackimage: item.giftpack.giftpackimage,
            };
          }

          if (item.product) {
            return {
              ...item.product.dataValues,
            };
          }

          return {};
        });

        return {
          ...order.dataValues,
          totalamount: order.totalamount,
          giftcard: giftCard,
          items,
        };
      }),
    );

    return res.status(200).json(new ApiResponse(200, updatedOrders));
  } catch (error) {
    throw error;
  }
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
          attributes: ["giftcardid", "cardname", "cardimage"],
        },
        {
          model: GiftPackModel,
          as: "giftpack",
          required: false,
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

    const formattedItems = await Promise.all(
      orderItems.map(async (item) => {
        let product = null;
        if (item.itemtype === "product" || item.itemtype === "gift") {
          product = item.product || null;
        }

        let giftpack = item.giftpack || null;

        let giftpackproducts = [];

        // Only this change
        if (item.itemtype === "customgift" && item.giftpack) {
          giftpackproducts = await CustomGiftItemModel.findAll({
            where: {
              giftpackid: giftpack.giftpackid,
            },
          });
        }

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
            sendername: item.sendername || null,
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
          calculatedprice:
            calculatedprice !== null
              ? parseFloat(calculatedprice.toFixed(2))
              : null,
          giftpack,
          product,
          giftpackproducts,
          giftcard,
          address,
        };
      }),
    );

    return res.status(200).json(
      new ApiResponse(200, {
        order: {
          orderid: order.orderid,
          totalamount: order.totalamount,
          coupon_code: order.coupon_code,
          discount_amount: order.discount_amount,
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
    const { bid, orderstatus, paymentstatus, date } = req.body;

    if (!bid) {
      throw new ApiError(400, "Business id is required");
    }

    if (!bid) {
      throw new ApiError(400, "Business id is required");
    }
    let where = {
      bid: bid,
      ordertype: "normal",
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
            // new changes for order
            {
              model: GiftPackModel,
              as: "giftpack",
              attributes: ["giftpackid", "giftpackname", "giftpackimage"],
            },
          ],
        });

        const items = orderItems.map((item) => {
          let productData = {};
          // new changes for order
          if (item.itemtype === "customgift" && item.giftpack) {
            productData = {
              productid: item.giftpack.giftpackid,
              productname: item.giftpack.giftpackname,
              productimage: item.giftpack.giftpackimage,
            };
          } else if (item.itemtype !== "customgift" && item.product) {
            productData = { ...item.product.dataValues };
          } else if (item.giftcard) {
            productData = {
              productid: item.giftcard.giftcardid,
              productname: item.giftcard.cardname,
              productimage: item.giftcard.cardimage,
            };
          }

          return {
            ...item.dataValues,
            ...productData,
          };
        });

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
    const { orderid, orderstatus, trackingnumber } = req.body;

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

    if (orderstatus === "shipped" || orderstatus === "delivered") {
      try {
        const targetEmail = "dinesh@vidyutinfo.in";
        let subject = `Order Status Update - #${order.orderid}`;
        let text = `Tradizions - Your order #${order.orderid} status has been updated to ${orderstatus}.`;
        let html = "";

        const currentDate = new Date().toLocaleDateString();

        if (orderstatus === "shipped") {
          subject = `Your Order #${order.orderid} has been Shipped!`;
          text = `Good news! Your order has been shipped and is on its way to you.`;
          const trackingNum = trackingnumber || "N/A";

          html = `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; background-color: #f0f2f5;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="${process.env.BASEURL}/assets/app-logo.png" alt="Tradizions" style="height: 60px; max-width: 100%; object-fit: contain;" />
            </div>
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 16px rgba(0,0,0,0.09);">
              <div style="background: #1a2c52; padding: 20px; border-radius: 8px 8px 0 0; margin: -30px -30px 20px -30px; text-align: center;">
                <h2 style="color: #ffffff; margin: 0; font-size: 22px;">Order Shipped</h2>
              </div>
              <p style="color: #333; font-size: 16px;">Dear Customer,</p>
              <p style="color: #333; font-size: 15px; line-height: 1.6;">Good news! Your order has been shipped and is on its way to you.</p>
              
              <h3 style="color: #1a2c52; margin-top: 25px; margin-bottom: 15px;">Order Details:</h3>
              <ul style="color: #555; font-size: 15px; line-height: 1.8;">
                <li><strong>Order ID:</strong> #${order.orderid}</li>
                <li><strong>Shipping Date:</strong> ${currentDate}</li>
                <li><strong>Tracking Number:</strong> ${trackingNum}</li>
              </ul>
              
              <p style="color: #333; font-size: 15px; line-height: 1.6;">You can track your shipment using the tracking number provided above. We will notify you once your order has been delivered.</p>
              <p style="color: #333; font-size: 15px; line-height: 1.6;">Thank you for shopping with us. We appreciate your trust and look forward to serving you again.</p>
              
              <p style="color: #555; font-size: 15px; line-height: 1.6; margin-top: 30px;">
                Best Regards,<br>
                <strong>The Tradizions Team</strong>
              </p>
            </div>
          </div>
        `;
        } else if (orderstatus === "delivered") {
          subject = `Tradizions - Your Order #${order.orderid} has been Delivered!`;
          text = `We're pleased to inform you that your order has been successfully delivered.`;

          html = `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; background-color: #f0f2f5;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="${process.env.BASEURL}/assets/app-logo.png" alt="Tradizions" style="height: 60px; max-width: 100%; object-fit: contain;" />
            </div>
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 16px rgba(0,0,0,0.09);">
              <div style="background: #1a2c52; padding: 20px; border-radius: 8px 8px 0 0; margin: -30px -30px 20px -30px; text-align: center;">
                <h2 style="color: #ffffff; margin: 0; font-size: 22px;">Order Delivered</h2>
              </div>
              <p style="color: #333; font-size: 16px;">Dear Customer,</p>
              <p style="color: #333; font-size: 15px; line-height: 1.6;">We're pleased to inform you that your order has been successfully delivered.</p>
              
              <h3 style="color: #1a2c52; margin-top: 25px; margin-bottom: 15px;">Order Details:</h3>
              <ul style="color: #555; font-size: 15px; line-height: 1.8;">
                <li><strong>Order ID:</strong> #${order.orderid}</li>
                <li><strong>Delivery Date:</strong> ${currentDate}</li>
              </ul>
              
              <p style="color: #333; font-size: 15px; line-height: 1.6;">We hope you enjoy your purchase. Your satisfaction is important to us, and we would love to hear about your experience.</p>
              <p style="color: #333; font-size: 15px; line-height: 1.6;">If you have any questions or need assistance, please feel free to contact our support team.</p>
              
              <p style="color: #333; font-size: 15px; line-height: 1.6;">Thank you for choosing us.</p>
              
              <p style="color: #555; font-size: 15px; line-height: 1.6; margin-top: 30px;">
                Best Regards,<br>
                <strong>The Tradizions Team</strong>
              </p>
            </div>
          </div>
        `;
        }

        await sendEmail(targetEmail, subject, text, html);
      } catch (mailError) {
        console.error("Error sending order status email:", mailError);
      }
    }

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
  const { bid, date } = req.body;

  if (!bid) {
    throw new ApiError(400, "Business id is required");
  }

  // Dynamic where condition
  const where = {
    bid,
  };

  // Date filter
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
          {
            model: GiftPackModel,
            as: "giftpack",
            attributes: ["giftpackid", "giftpackname", "giftpackimage"],
          },
        ],
      });

      const items = orderItems.map((item) => {
        if (item.itemtype === "customgift" && item.giftpack) {
          return {
            productid: item.giftpack.giftpackid,
            productname: item.giftpack.giftpackname,
            productimage: item.giftpack.giftpackimage,
          };
        }
        if (item.itemtype !== "customgift" && item.product)
          return { ...item.product.dataValues };
        if (item.giftcard)
          return {
            productid: item.giftcard.giftcardid,
            productname: item.giftcard.cardname,
            productimage: item.giftcard.cardimage,
          };
        return {};
      });

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
});

// ------------------------ Payment Integration ------------------------

const razorpay = new Razorpay({
  key_id: "rzp_test_TRz4Jt08XnAOja",
  key_secret: "v2qSE80tKRq1GjjP446G9S42",
});

export const createOrderPayment = asyncHandler(async (req, res) => {
  try {
    const { orderid } = req.body;

    if (!orderid) {
      throw new ApiError(400, "Order ID is required");
    }

    const order = await OrderModel.findOne({ where: { orderid } });
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    // Example (Razorpay):
    const options = {
      amount: Math.round(order.totalamount * 100),
      currency: "INR",
      receipt: `receipt_${order.orderid}`,
    };
    const paymentOrder = await razorpay.orders.create(options);

    return res.status(200).json(
      new ApiResponse(200, {
        paymentOrder: paymentOrder,
        orderid: order.orderid,
        amount: order.totalamount,
      }),
    );
  } catch (error) {
    throw error;
  }
});

export const verifyOrderPayment = asyncHandler(async (req, res) => {
  try {
    const { orderid, payment_id, payment_order_id, signature } = req.body;

    if (!orderid || !payment_id) {
      throw new ApiError(400, "Order ID and Payment ID are required");
    }

    const order = await OrderModel.findOne({ where: { orderid } });
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    const body = payment_order_id + "|" + payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", "v2qSE80tKRq1GjjP446G9S42") // Use the same secret as in Razorpay initialization
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== signature) {
      throw new ApiError(400, "Invalid payment signature");
    }

    // Update order status after successful payment
    order.paymentstatus = "success";
    order.paymentmethod = "online";
    await order.save();

    return res.status(200).json(
      new ApiResponse(200, {
        message: "Payment verified successfully",
        orderid: order.orderid,
        paymentstatus: order.paymentstatus,
      }),
    );
  } catch (error) {
    throw error;
  }
});
