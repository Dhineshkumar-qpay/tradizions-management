import { where } from "sequelize";
import {
  ContactUsModel,
  ThinamOruKuralModel,
  TradizionsReviewModel,
} from "../../model/home_model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  ProductImagesModel,
  ProductModel,
} from "../../model/product_gift_model.js";
import { type } from "os";
import { Op } from "sequelize";
import fs from "fs";
import { OrderItemModel } from "../../model/order_model.js";
import { BusinessModel } from "../../model/business_model.js";
import { AuthModel } from "../../model/auth_model.js";

// export const addThinamoruKural = asyncHandler(async (req, res) => {
//   try {
//     const { kuralList } = req.body;

//     if (!Array.isArray(kuralList)) {
//       throw new ApiError(400, "Kural list is required");
//     }

//     const result = ThinamOruKuralModel.bulkCreate(kuralList, {
//       validate: true,
//       ignoreDuplicates: true,
//     });

//     return res
//       .status(200)
//       .json(new ApiResponse(200, "Kural Added Successfully"));
//   } catch (error) {
//     throw error;
//   }
// });

export const addThinamoruKural = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      throw new ApiError(400, "Json file is required");
    }
    const filePath = req.file.path;
    const fileData = fs.readFileSync(filePath, "utf-8");
    const kurals = JSON.parse(fileData);
    const result = ThinamOruKuralModel.bulkCreate(kurals, {
      validate: true,
      ignoreDuplicates: true,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, "Kural Added Successfully"));
  } catch (error) {
    throw error;
  }
});

export const getKural = asyncHandler(async (req, res) => {
  try {
    const kural = await ThinamOruKuralModel.findAll();
    return res.status(200).json(new ApiResponse(200, kural));
  } catch (error) {
    throw error;
  }
});

// -------------------- Home Product --------------------

export const getMerchantDashboardCounts = asyncHandler(async (req, res) => {
  try {
    const { bid } = req.body;
    if (!bid) throw new ApiError(400, "Business id is required");

    const [totalProducts, totalOrders] = await Promise.all([
      await ProductModel.count({
        where: {
          bid: bid,
        },
      }),
      await OrderItemModel.count({
        where: {
          bid: bid,
        },
      }),
    ]);

    return res.status(200).json(
      new ApiResponse(200, {
        totalproducts: totalProducts,
        totalorders: totalOrders,
      }),
    );
  } catch (error) {
    throw error;
  }
});

export const getProductStocks = asyncHandler(async (req, res) => {
  try {
    const { bid } = req.body;

    const attributes = [
      "productid",
      "bid",
      "productname",
      "productimage",
      "availablestock",
      "price",
      "sellingprice",
    ];

    const [inStockProducts, lowStockProducts, outofstockProdcuts] =
      await Promise.all([
        await ProductModel.findAll({
          where: {
            bid: bid,
            availablestock: {
              [Op.gt]: 10,
            },
          },
          attributes: attributes,
        }),
        await ProductModel.findAll({
          where: {
            bid: bid,
            availablestock: {
              [Op.gt]: 0,
              [Op.lte]: 10,
            },
          },
          attributes: attributes,
        }),
        await ProductModel.findAll({
          where: {
            bid: bid,
            availablestock: 0,
          },
          attributes: attributes,
        }),
      ]);

    return res.status(200).json(
      new ApiResponse(200, {
        instock: inStockProducts,
        lowstock: lowStockProducts,
        outofstock: outofstockProdcuts,
      }),
    );
  } catch (error) {
    throw error;
  }
});

export const updateProductStock = asyncHandler(async (req, res) => {
  try {
    const { productid, bid, availablestock } = req.body;
    if (!productid || !bid || !availablestock) {
      throw new ApiError(400, "Product id, business id and stock is required");
    }

    const product = await ProductModel.findOne({
      where: {
        productid: productid,
        bid: bid,
      },
    });

    if (!product) throw new ApiError(400, "Product not found");
    await product.update({
      availablestock: availablestock,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, "Stock updated successfully"));
  } catch (error) {
    throw error;
  }
});

// ---------------------- Super Admin Dashboard Page ----------------------

export const getSuperAdminDashboardData = asyncHandler(async (req, res) => {
  try {
    const [totalMerchants, totalOrders, totalUsers] = await Promise.all([
      await BusinessModel.count(),
      await OrderItemModel.count(),
      await AuthModel.count({
        where: {
          role: "user",
        },
      }),
    ]);

    return res.status(200).json(
      new ApiResponse(200, {
        totalmerchants: totalMerchants,
        totalorders: totalOrders,
        totalusers: totalUsers,
        totalrevenue: 30000,
      }),
    );
  } catch (error) {
    throw error;
  }
});

export const getTotalStocksData = asyncHandler(async (req, res) => {
  try {
    const [
      totalShops,
      totalProducts,
      totalAvailableStock,
      totalLowStockProducts,
      totalOutofStockProducts,
    ] = await Promise.all([
      await ProductModel.count(),
      await ProductModel.count({
        where: {
          availablestock: {
            [Op.gt]: 10,
          },
        },
      }),
      await ProductModel.count({
        where: {
          availablestock: {
            [Op.gt]: 0,
            [Op.lte]: 10,
          },
        },
      }),
      await ProductModel.count({
        where: {
          availablestock: 0,
        },
      }),
    ]);
    return res.status(200).json(
      new ApiResponse(200, {
        totalshops: totalShops,
        totalProducts: totalProducts,
        totalavailable: totalAvailableStock,
        totallowstock: totalLowStockProducts,
        totaloutofstock: totalOutofStockProducts,
      }),
    );
  } catch (error) {
    throw error;
  }
});
