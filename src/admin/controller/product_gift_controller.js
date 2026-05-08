import { where } from "sequelize";
import {
  ProductModel,
  ProductImagesModel,
  GiftModel,
  ProductReviewModel,
} from "../../model/product_gift_model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as fs from "fs";
import { sequelize } from "../../../connection.js";
import { BusinessModel } from "../../model/business_model.js";
import { CartModel } from "../../model/cart_model.js";

export const addProductImage = asyncHandler(async (req, res) => {
  let file;

  try {
    file = req.file;
    const { oldimage } = req.body;

    if (!file && !oldimage) {
      throw new ApiError(400, "Product image is required");
    }

    let productImagePath;

    if (file && file.path) {
      productImagePath = `/${file.path.replace(/\\/g, "/")}`;

      if (
        oldimage &&
        oldimage.startsWith("/uploads") &&
        fs.existsSync(`.${oldimage}`)
      ) {
        fs.unlinkSync(`.${oldimage}`);
      }
    } else {
      productImagePath = oldimage;
    }

    return res.status(200).json(new ApiResponse(200, productImagePath));
  } catch (error) {
    if (file && file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw error;
  }
});

export const addProduct = asyncHandler(async (req, res) => {
  const {
    bid,
    productname,
    categoryid,
    categoryname,
    subcategoryid,
    subcategoryname,
    brandname,
    description,
    sellingprice,
    price,
    weight,
    unit,
    availablestock,
    productimage,
    isFeatured,
    isTrending,
    isBestSeller,
    isActive,
    ingredients,
    shelflife,
    storageinfo,
    calories,
    protien,
    fibre,
    fat,
    carbohydrates,
    country,
  } = req.body;

  try {
    if (!bid) throw new ApiError(400, "Bid is required");

    const business = await BusinessModel.findByPk(bid);

    if (!business) throw new ApiError(400, "Business not found ");

    if (
      !productname?.trim() ||
      !categoryid ||
      !categoryname?.trim() ||
      !subcategoryid ||
      !subcategoryname?.trim() ||
      !brandname?.trim() ||
      !description?.trim() ||
      price === undefined ||
      weight === undefined ||
      !unit ||
      availablestock === undefined ||
      !productimage
    ) {
      throw new ApiError(400, "All fields are required");
    }

    const product = await ProductModel.create({
      bid,
      productimage,
      productname: productname.trim(),
      categoryid,
      categoryname: categoryname.trim(),
      subcategoryid,
      subcategoryname: subcategoryname.trim(),
      brandname: brandname.trim(),
      description: description.trim(),
      sellingprice,
      price,
      weight,
      unit,
      availablestock,
      isFeatured: isFeatured !== undefined ? isFeatured : false,
      isTrending: isTrending !== undefined ? isTrending : true,
      isBestSeller: isBestSeller !== undefined ? isBestSeller : true,
      isActive: isActive !== undefined ? isActive : true,
      ingredients: ingredients || null,
      shelflife: shelflife || null,
      storageinfo: storageinfo || null,
      calories: calories !== undefined ? calories : 0.0,
      protien: protien !== undefined ? protien : 0.0,
      fibre: fibre !== undefined ? fibre : 0.0,
      fat: fat !== undefined ? fat : 0.0,
      carbohydrates: carbohydrates !== undefined ? carbohydrates : 0.0,
      country: country || "India",
    });

    return res
      .status(201)
      .json(new ApiResponse(201, "Product added successfully"));
  } catch (error) {
    throw error;
  }
});

export const updateProduct = asyncHandler(async (req, res) => {
  try {
    const {
      productid,
      bid,
      productname,
      categoryid,
      categoryname,
      brandname,
      description,
      sellingprice,
      price,
      weight,
      unit,
      availablestock,
      productimage,
      isFeatured,
      isTrending,
      isBestSeller,
      isActive,
      ingredients,
      shelflife,
      storageinfo,
      calories,
      protien,
      fibre,
      fat,
      carbohydrates,
      country,
    } = req.body;

    if (!productid) throw new ApiError(400, "Product id is required");
    if (!bid) throw new ApiError(400, "Bid is required");

    const existingProduct = await ProductModel.findOne({
      where: { productid, bid },
    });

    if (!existingProduct) throw new ApiError(404, "Product not found");

    let finalImage =
      productimage !== undefined ? productimage : existingProduct.productimage;

    await existingProduct.update({
      productimage: finalImage,
      productname: productname?.trim() || existingProduct.productname,
      categoryid: categoryid ?? existingProduct.categoryid,
      categoryname: categoryname?.trim() || existingProduct.categoryname,
      brandname: brandname?.trim() || existingProduct.brandname,
      description: description?.trim() || existingProduct.description,
      sellingprice:
        sellingprice !== undefined
          ? sellingprice
          : existingProduct.sellingprice,
      price: price !== undefined ? price : existingProduct.price,
      weight: weight !== undefined ? weight : existingProduct.weight,
      unit: unit || existingProduct.unit,
      availablestock:
        availablestock !== undefined
          ? availablestock
          : existingProduct.availablestock,
      isFeatured:
        isFeatured !== undefined ? isFeatured : existingProduct.isFeatured,
      isTrending:
        isTrending !== undefined ? isTrending : existingProduct.isTrending,
      isBestSeller:
        isBestSeller !== undefined
          ? isBestSeller
          : existingProduct.isBestSeller,
      isActive: isActive !== undefined ? isActive : existingProduct.isActive,
      ingredients:
        ingredients !== undefined ? ingredients : existingProduct.ingredients,
      shelflife:
        shelflife !== undefined ? shelflife : existingProduct.shelflife,
      storageinfo:
        storageinfo !== undefined ? storageinfo : existingProduct.storageinfo,
      calories: calories !== undefined ? calories : existingProduct.calories,
      protien: protien !== undefined ? protien : existingProduct.protien,
      fibre: fibre !== undefined ? fibre : existingProduct.fibre,
      fat: fat !== undefined ? fat : existingProduct.fat,
      carbohydrates:
        carbohydrates !== undefined
          ? carbohydrates
          : existingProduct.carbohydrates,
      country: country !== undefined ? country : existingProduct.country,
    });

    return res.status(200).json(
      new ApiResponse(200, {
        message: "Product updated successfully",
        productid: existingProduct.productid,
      }),
    );
  } catch (error) {
    throw error;
  }
});

export const deleteProduct = asyncHandler(async (req, res) => {
  try {
    const { bid, productid } = req.body;

    if (!bid) throw new ApiError(400, "Bid is required");
    if (!productid) throw new ApiError(400, "Product id is required");

    await ProductImagesModel.destroy({ where: { productid } });
    await ProductReviewModel.destroy({ where: { productid } });

    const product = await ProductModel.destroy({
      where: { bid, productid },
    });

    if (product === 0) {
      throw new ApiError(404, "Product not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Product deleted successfully"));
  } catch (error) {
    throw error;
  }
});

export const getAllProducts = asyncHandler(async (req, res) => {
  const { bid } = req.body;

  try {
    if (!bid) throw new ApiError(400, "Bid is required");

    const businessFound = await BusinessModel.findByPk(bid);
    if (!businessFound) throw new ApiError(400, "Business not found");

    const products = await ProductModel.findAll({
      where: { bid },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });

    const updateProductList = await Promise.all(
      products.map(async (product) => {
        const data = product.toJSON();

        const price = Number(data.price);
        const sellingprice = Number(data.sellingprice);

        const discount =
          sellingprice && sellingprice > 0 && price > 0 && sellingprice <= price
            ? Math.round(((price - sellingprice) / price) * 100)
            : 0;

        const productImages = await ProductImagesModel.findOne({
          where: { productid: data.productid },
        });

        return {
          ...data,
          image1: productImages?.image1 ?? null,
          image2: productImages?.image2 ?? null,
          image3: productImages?.image3 ?? null,
          image4: productImages?.image4 ?? null,
          discount,
        };
      }),
    );

    return res.status(200).json(new ApiResponse(200, updateProductList));
  } catch (error) {
    throw error;
  }
});

export const addOrUpdateProductImages = asyncHandler(async (req, res) => {
  let uploadedFiles = [];

  try {
    const { productid, bid } = req.body;

    if (!productid) throw new ApiError(400, "Product id is required");
    if (!bid) throw new ApiError(400, "Bid is required");

    const product = await ProductModel.findOne({
      where: {
        productid,
        bid,
      },
    });

    if (!product) throw new ApiError(404, "Product not found");

    const files = req.files || {};

    Object.values(files).forEach((arr) => {
      arr.forEach((f) => uploadedFiles.push(f.path));
    });

    let productImages = await ProductImagesModel.findOne({
      where: { productid },
    });

    if (!productImages) {
      productImages = await ProductImagesModel.create({
        bid,
        productid,
        image1: null,
        image2: null,
        image3: null,
        image4: null,
      });
    }

    const updateData = {};

    for (let i = 1; i <= 4; i++) {
      const field = `image${i}`;

      if (files[field]?.[0]?.path) {
        const newPath = `/${files[field][0].path.replace(/\\/g, "/")}`;

        const oldImage = productImages[field];
        if (
          oldImage &&
          oldImage.startsWith("/uploads") &&
          fs.existsSync(`.${oldImage}`)
        ) {
          fs.unlinkSync(`.${oldImage}`);
        }

        updateData[field] = newPath;
      }
    }

    if (Object.keys(updateData).length > 0) {
      await productImages.update(updateData);
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Product images saved successfully"));
  } catch (error) {
    uploadedFiles.forEach((path) => {
      if (fs.existsSync(path)) {
        fs.unlinkSync(path);
      }
    });
    throw error;
  }
});

export const deleteProductImage = asyncHandler(async (req, res) => {
  const { bid, productid, imagename } = req.body;

  if (!bid || !productid || !imagename) {
    throw new ApiError(400, "Bid , Product ID and image name required");
  }

  const validFields = ["image1", "image2", "image3", "image4"];
  if (!validFields.includes(imagename)) {
    throw new ApiError(400, "Invalid image field");
  }

  const productImages = await ProductImagesModel.findOne({
    where: { productid, bid },
  });

  if (!productImages) {
    throw new ApiError(404, "Product images not found");
  }

  const imagePath = productImages[imagename];

  if (!imagePath) {
    throw new ApiError(400, "Image already empty");
  }

  const filePath = imagePath.replace("/", "");
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await productImages.update({
    [imagename]: null,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, `${imagename} deleted successfully`));
});

/// --------------------------- Gifts Functions ---------------------------///

export const addGiftImage = asyncHandler(async (req, res) => {
  const { oldimage } = req.body;
  const file = req.file;
  let imagePath;

  try {
    if (!file && !oldimage) {
      throw new ApiError(400, "Gift image is required");
    }

    if (file && file.path) {
      imagePath = `/${file.path.replace(/\\/g, "/")}`;

      if (
        oldimage &&
        !oldimage.startsWith("/uploads") &&
        fs.existsSync(oldimage)
      ) {
        fs.unlinkSync(oldimage);
      }
    } else {
      imagePath = oldimage;
    }

    return res
      .status(200)
      .json(new ApiResponse(200, imagePath, "Image processed successfully"));
  } catch (error) {
    if (file && file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw error;
  }
});

export const addGift = asyncHandler(async (req, res) => {
  const {
    bid,
    giftname,
    giftdescription,
    categoryid,
    categoryname,
    subcategoryid,
    subcategoryname,
    productlist,
    giftprice,
    giftsellingprice,
    stock,
    packingtype,
    giftimage,
  } = req.body;

  try {
    if (!bid) throw new ApiError(400, "Bid is required");
    if (
      !giftname?.trim() ||
      !giftdescription?.trim() ||
      !categoryid ||
      !categoryname?.trim() ||
      !subcategoryid ||
      !subcategoryname?.trim() ||
      !productlist ||
      giftprice === undefined ||
      stock === undefined ||
      !packingtype?.trim() ||
      !giftimage
    ) {
      throw new ApiError(400, "All fields are required");
    }

    let parsedProductList = productlist;
    if (productlist && typeof productlist === "string") {
      try {
        parsedProductList = JSON.parse(productlist);
      } catch (e) {
        throw new ApiError(400, "Invalid productlist JSON format");
      }
    }

    const gift = await GiftModel.create({
      bid,
      giftname: giftname.trim(),
      giftimage,
      categoryid,
      categoryname: categoryname.trim(),
      subcategoryid,
      subcategoryname: subcategoryname.trim(),
      giftdescription: giftdescription.trim(),
      productlist: parsedProductList,
      giftprice,
      giftsellingprice: giftsellingprice !== undefined ? giftsellingprice : null,
      stock,
      packingtype: packingtype.trim(),
    });

    return res
      .status(201)
      .json(new ApiResponse(201, "Gift card added successfully"));
  } catch (error) {
    throw error;
  }
});

export const editGift = asyncHandler(async (req, res) => {
  const {
    giftid,
    bid,
    categoryid,
    categoryname,
    subcategoryid,
    subcategoryname,
    giftname,
    giftdescription,
    productlist,
    giftprice,
    giftsellingprice,
    giftimage,
    stock,
    packingtype,
  } = req.body;

  try {
    if (!giftid) throw new ApiError(400, "Gift id is required");
    if (!bid) throw new ApiError(400, "Bid is required");

    const existingGift = await GiftModel.findOne({
      where: { giftid, bid },
    });

    if (!existingGift) throw new ApiError(404, "Gift not found");

    let parsedProductList = productlist;
    if (productlist && typeof productlist === "string") {
      try {
        parsedProductList = JSON.parse(productlist);
      } catch (e) {
        throw new ApiError(400, "Invalid productlist JSON format");
      }
    }

    await existingGift.update({
      giftname: giftname?.trim() || existingGift.giftname,
      giftimage: giftimage !== undefined ? giftimage : existingGift.giftimage,
      categoryid: categoryid || existingGift.categoryid,
      categoryname: categoryname?.trim() || existingGift.categoryname,
      subcategoryid: subcategoryid || existingGift.subcategoryid,
      subcategoryname: subcategoryname?.trim() || existingGift.subcategoryname,
      giftdescription: giftdescription?.trim() || existingGift.giftdescription,
      productlist:
        parsedProductList !== undefined
          ? parsedProductList
          : existingGift.productlist,
      giftprice: giftprice !== undefined ? giftprice : existingGift.giftprice,
      giftsellingprice:
        giftsellingprice !== undefined
          ? giftsellingprice
          : existingGift.giftsellingprice,
      stock: stock !== undefined ? stock : existingGift.stock,
      packingtype: packingtype?.trim() || existingGift.packingtype,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Gift updated successfully"));
  } catch (error) {
    throw error;
  }
});

export const deleteGift = asyncHandler(async (req, res) => {
  const { giftid, bid } = req.body;

  if (!giftid) throw new ApiError(400, "Gift id is required");
  if (!bid) throw new ApiError(400, "Bid is required");

  const result = await GiftModel.destroy({
    where: { giftid, bid },
  });

  if (result === 0) throw new ApiError(404, "Gift not found");

  return res
    .status(200)
    .json(new ApiResponse(200, "Gift deleted successfully"));
});

export const getMerchantGifts = asyncHandler(async (req, res) => {
  const { bid } = req.body;

  if (!bid) throw new ApiError(400, "Bid is required");

  const gifts = await GiftModel.findAll({
    where: { bid },
  });

  const updatedgifts = gifts.map((gift) => {
    const data = gift.toJSON();
    let parsedProductList = data.productlist;
    if (typeof parsedProductList === "string") {
      try {
        parsedProductList = JSON.parse(parsedProductList);
      } catch (e) {
        parsedProductList = [];
      }
    }
    return {
      ...data,
      productlist: parsedProductList || [],
    };
  });

  return res.status(200).json(new ApiResponse(200, updatedgifts));
});
