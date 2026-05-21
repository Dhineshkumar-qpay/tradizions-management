import { CartModel } from "../../model/cart_model.js";
import { ProductModel } from "../../model/product_gift_model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { AuthModel } from "../../model/auth_model.js";
import { MonthlyCalculatorModel } from "../../model/monthly_calculator_model.js";

export const getCalculatedProducts = asyncHandler(async (req, res) => {
  try {
    const { categoryid, bid } = req.body;

    if (!categoryid || !bid) {
      throw new ApiError(400, "Category ID and Business ID are required");
    }

    const products = await ProductModel.findAll({
      where: { categoryid: categoryid },
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

export const buyNowCalculator = asyncHandler(async (req, res) => {
  const userid = req.user?.userid;
  if (!userid) throw new ApiError(401, "User not authenticated");

  const { items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Items array is required");
  }

  const productsList = [];
  let totalamount = 0;

  for (const item of items) {
    const { bid, productid, gramsPerDay, daysPerMonth, familyMembers } = item;

    if (!bid || !productid || !gramsPerDay || !daysPerMonth || !familyMembers) {
      continue;
    }

    const product = await ProductModel.findOne({
      where: { productid, bid, itemtype: "product" },
    });

    if (!product) continue;

    const totalKg = (gramsPerDay * daysPerMonth * familyMembers) / 1000;
    if (totalKg <= 0) continue;
    console.log(`------------------------- ${familyMembers}`);

    let requiredQuantity = totalKg;
    if (product.unit === "g" && product.weight) {
      const weightInKg = product.weight / 1000;
      requiredQuantity = totalKg / weightInKg;
    } else if (product.unit === "kg" && product.weight) {
      requiredQuantity = totalKg / product.weight;
    }

    requiredQuantity = parseFloat(requiredQuantity.toFixed(2));

    if (product.availablestock < requiredQuantity) {
      throw new ApiError(
        400,
        `Only ${product.availablestock} units in stock for product ${product.productname}`,
      );
    }

    const price = parseFloat(product.sellingprice) || parseFloat(product.price);
    const itemTotalPrice = familyMembers * price;

    totalamount += itemTotalPrice;

    productsList.push({
      itemtype: "product",
      quantity: familyMembers,
      totalprice: itemTotalPrice,
      productid: product.productid,
      name: product.productname,
      image: product.productimage,
      price: product.price,
      sellingprice: product.sellingprice,
      categoryname: product.categoryname,
    });
  }

  return res.status(200).json(
    new ApiResponse(200, {
      products: productsList,
      totalamount,
    }),
  );
});

export const placeCalculatorOrder = asyncHandler(async (req, res) => {
  const userid = req.user?.userid;
  if (!userid) throw new ApiError(401, "User not authenticated");

  const { items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Items array is required");
  }

  const savedOrders = [];

  for (const item of items) {
    const {
      bid,
      productid,
      gramsPerDay,
      daysPerMonth,
      familyMembers,
      quantity,
      totalprice,
    } = item;
    if (
      !bid ||
      !productid ||
      !gramsPerDay ||
      !daysPerMonth ||
      !familyMembers ||
      !quantity ||
      !totalprice
    ) {
      continue;
    }

    const newOrder = await MonthlyCalculatorModel.create({
      userid,
      bid,
      productid,
      gramsPerDay,
      daysPerMonth,
      familyMembers,
      quantity,
      totalprice,
      status: "pending",
    });
    savedOrders.push(newOrder);
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        savedOrders,
        "Calculator orders placed successfully",
      ),
    );
});

export const getUserCalculatorOrders = asyncHandler(async (req, res) => {
  const userid = req.user?.userid;
  if (!userid) throw new ApiError(401, "User not authenticated");

  const orders = await MonthlyCalculatorModel.findAll({
    where: { userid },
    include: [{ model: ProductModel, as: "product" }],
    order: [["createdAt", "DESC"]],
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        orders,
        "User calculator orders fetched successfully",
      ),
    );
});

export const getMerchantCalculatorOrders = asyncHandler(async (req, res) => {
  // Assuming merchant passes bid in body or it's extracted from admin auth
  const { bid } = req.body;
  if (!bid) throw new ApiError(400, "Business ID is required");

  const orders = await MonthlyCalculatorModel.findAll({
    where: { bid },
    include: [
      { model: ProductModel, as: "product" },
      {
        model: AuthModel,
        as: "user",
        attributes: ["userid", "name", "email", "phone"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        orders,
        "Merchant calculator orders fetched successfully",
      ),
    );
});
