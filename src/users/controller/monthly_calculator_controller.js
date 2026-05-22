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

export const monthlyOrderSummary = asyncHandler(async (req, res) => {
  try {
    const userid = req.user?.userid;

    if (!userid) {
      throw new ApiError(401, "User not authenticated");
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
    });

    if (!cartItems || cartItems.length === 0) {
      throw new ApiError(400, "Monthly cart is empty");
    }

    const calculatedProducts = [];
    let grandTotal = 0;

    for (const item of cartItems) {
      const { gramsperday, dayspermonth, familymembers, product } = item;

      const activePrice = parseFloat(
        product.sellingprice || product.price || 0,
      );

      const qtyPerPersonKg = (gramsperday * dayspermonth) / 1000;
      const totalQuantityKg = qtyPerPersonKg * familymembers;
      const totalBudget = Math.round(totalQuantityKg * activePrice);

      calculatedProducts.push({
        monthlycartid: item.monthlycartid,
        productid: product.productid,
        productname: product.productname,
        productimage: product.productimage,
        categoryname: product.categoryname,
        gramsperday,
        dayspermonth,
        familymembers,
        qtyPerPersonKg: parseFloat(qtyPerPersonKg.toFixed(2)),
        totalQuantityKg: parseFloat(totalQuantityKg.toFixed(2)),
        pricePerKg: activePrice,
        totalBudget,
      });

      grandTotal += totalBudget;
    }

    const addresses = await AddressModel.findAll({
      where: { userid },
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          addresses,
          products: calculatedProducts,
          grandTotal,
        },
        "Monthly order summary fetched successfully",
      ),
    );
  } catch (error) {
    throw error;
  }
});

export const placeMonthlySubscriptionOrder = asyncHandler(async (req, res) => {
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
    }

    /// ------- CREATE MAIN ORDER -------
    const order = await OrderModel.create(
      {
        userid,
        addressid: addressid,
        totalamount,
        orderstatus: "pending",
        paymentstatus: "pending",
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
          ordertype: "monthly",
          itemtype: "product"
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

// ------------ DATABASE STORAGE FUNCTIONS ------------

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

      totalamount += Math.round(totalQuantityKg * activePrice);

      return {
        monthlycartid: item.monthlycartid,
        bid: itemData.bid,
        userid: itemData.userid,
        gramsperday: itemData.gramsperday,
        dayspermonth: itemData.dayspermonth,
        familymembers: itemData.familymembers,
        productid: product.productid,
        productname: product.productname,
        productimage: product.productimage,
        sellingprice: product.sellingprice,
        price: product.price,
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
