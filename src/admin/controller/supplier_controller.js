import {
  SupplierModel,
  SupplierProductModel,
} from "../../model/supplier_model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ProductModel } from "../../model/product_gift_model.js";
import { sequelize } from "../../../connection.js";
import { Op } from "sequelize";

const isValidAvgProductPrice = (value) =>
  value !== null && value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0;

// ---------- Supplier Controllers ----------

export const addSupplier = asyncHandler(async (req, res) => {
  const { name, companyname, phone, email, gst, address, logo, brandname, location, status } = req.body;

  if (!name?.trim() || !phone?.trim()) {
    throw new ApiError(400, "Name and phone are required");
  }

  const uploadedLogo = req.file ? `/uploads/suppliers/${req.file.filename}` : undefined;

  const supplier = await SupplierModel.create({
    name: name.trim(),
    companyname: companyname?.trim(),
    phone: phone.trim(),
    email: email?.trim(),
    gst: gst?.trim(),
    address: address?.trim(),
    logo: uploadedLogo || logo?.trim(),
    brandname: brandname?.trim(),
    location: location?.trim(),
    status: status || "active",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, supplier));
});

export const updateSupplier = asyncHandler(async (req, res) => {
  const { id, name, companyname, phone, email, gst, address, logo, brandname, location, status } =
    req.body;

  if (!id) {
    throw new ApiError(400, "Supplier ID is required");
  }

  const supplier = await SupplierModel.findByPk(id);
  if (!supplier) {
    throw new ApiError(404, "Supplier not found");
  }

  const uploadedLogo = req.file ? `/uploads/suppliers/${req.file.filename}` : undefined;

  await supplier.update({
    name: name?.trim() || supplier.name,
    companyname:
      companyname !== undefined ? companyname.trim() : supplier.companyname,
    phone: phone?.trim() || supplier.phone,
    email: email !== undefined ? email.trim() : supplier.email,
    gst: gst !== undefined ? gst.trim() : supplier.gst,
    address: address !== undefined ? address.trim() : supplier.address,
    logo: uploadedLogo || (logo !== undefined ? logo.trim() : supplier.logo),
    brandname: brandname !== undefined ? brandname.trim() : supplier.brandname,
    location: location !== undefined ? location.trim() : supplier.location,
    status: status || supplier.status,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, supplier));
});

export const deleteSupplier = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) {
    throw new ApiError(400, "Supplier ID is required");
  }

  const supplier = await SupplierModel.findByPk(id);
  if (!supplier) {
    throw new ApiError(404, "Supplier not found");
  }

  await supplier.destroy();

  return res
    .status(200)
    .json(new ApiResponse(200, "Supplier deleted successfully"));
});

export const getAllSuppliers = asyncHandler(async (req, res) => {
  const { status } = req.body;

  let where = {};
  if (status && status !== "all") {
    where.status = status;
  }

  const suppliers = await SupplierModel.findAll({
    where,
    order: [["createdAt", "DESC"]],
  });

  return res.status(200).json(new ApiResponse(200, suppliers));
});

export const getSupplierById = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) {
    throw new ApiError(400, "Supplier ID is required");
  }

  const supplier = await SupplierModel.findByPk(id, {
    include: [{ model: SupplierProductModel, include: [{ model: ProductModel, as: "product" }] }],
  });

  if (!supplier) {
    throw new ApiError(404, "Supplier not found");
  }

  return res.status(200).json(new ApiResponse(200, supplier));
});

// ---------- Supplier Product Controllers ----------

export const addSupplierProduct = asyncHandler(async (req, res) => {
  const { supplierid, productid, productname, totalweight, unit, perproductkgprice, avgproductprice, markuppercentage } = req.body;

  if (!supplierid || !productid || totalweight === undefined || !unit?.trim() || perproductkgprice === undefined || avgproductprice === undefined) {
    throw new ApiError(400, "All fields (supplierid, productid, totalweight, unit, perproductkgprice, avgproductprice) are required");
  }

  if (!isValidAvgProductPrice(avgproductprice)) {
    throw new ApiError(400, "avgproductprice must be a non-negative number");
  }

  const supplier = await SupplierModel.findByPk(supplierid);
  if (!supplier) {
    throw new ApiError(404, "Supplier not found");
  }

  const catalogProduct = await ProductModel.findByPk(productid);
  if (!catalogProduct) {
    throw new ApiError(404, "Catalog product not found");
  }

  const result = await sequelize.transaction(async (t) => {
    const totalprice = Number(totalweight) * Number(perproductkgprice);
    const markup = markuppercentage !== undefined ? Number(markuppercentage) : 30.00;
    const sellingprice = Number(perproductkgprice) + (Number(perproductkgprice) * markup / 100);

    const product = await SupplierProductModel.create({
      supplierid,
      productid,
      productname: catalogProduct.productname || productname?.trim(),
      totalweight,
      remainingweight: totalweight,
      unit: unit.trim(),
      totalprice,
      perproductkgprice,
      avgproductprice: Number(avgproductprice),
      markuppercentage: markup
    }, { transaction: t });

    await catalogProduct.update({
      sellingprice: sellingprice
    }, { transaction: t });

    return product;
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result));
});

export const updateSupplierProduct = asyncHandler(async (req, res) => {
  const { id, productid, productname, totalweight, unit, perproductkgprice, avgproductprice, markuppercentage } = req.body;

  if (!id) {
    throw new ApiError(400, "Supplier Product ID is required");
  }

  const product = await SupplierProductModel.findByPk(id);
  if (!product) {
    throw new ApiError(404, "Supplier Product not found");
  }

  if (avgproductprice !== undefined && !isValidAvgProductPrice(avgproductprice)) {
    throw new ApiError(400, "avgproductprice must be a non-negative number");
  }

  let catalogProduct;
  if (productid !== undefined) {
    catalogProduct = await ProductModel.findByPk(productid);
    if (!catalogProduct) {
      throw new ApiError(404, "Catalog product not found");
    }
  } else {
    catalogProduct = await ProductModel.findByPk(product.productid);
  }

  const result = await sequelize.transaction(async (t) => {
    const finalTotalWeight = totalweight !== undefined ? Number(totalweight) : Number(product.totalweight);
    const finalPerProductKgPrice = perproductkgprice !== undefined ? Number(perproductkgprice) : Number(product.perproductkgprice);
    const markup = markuppercentage !== undefined ? Number(markuppercentage) : Number(product.markuppercentage || 30.00);
    
    const totalprice = finalTotalWeight * finalPerProductKgPrice;
    const sellingprice = finalPerProductKgPrice + (finalPerProductKgPrice * markup / 100);

    await product.update({
      productid: productid !== undefined ? productid : product.productid,
      productname: catalogProduct?.productname || productname?.trim() || product.productname,
      totalweight: finalTotalWeight,
      unit: unit?.trim() || product.unit,
      totalprice: totalprice,
      perproductkgprice: finalPerProductKgPrice,
      avgproductprice: avgproductprice !== undefined ? Number(avgproductprice) : product.avgproductprice,
      markuppercentage: markup
    }, { transaction: t });

    if (catalogProduct) {
      await catalogProduct.update({
        sellingprice: sellingprice
      }, { transaction: t });
    }

    return product;
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, result),
    );
});

export const deleteSupplierProduct = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) {
    throw new ApiError(400, "Supplier Product ID is required");
  }

  const product = await SupplierProductModel.findByPk(id);
  if (!product) {
    throw new ApiError(404, "Supplier Product not found");
  }

  await product.destroy();

  return res
    .status(200)
    .json(new ApiResponse(200, "Supplier product deleted successfully"));
});

export const getAllSupplierProducts = asyncHandler(async (req, res) => {
  const { supplierid } = req.body;

  let where = {};
  if (supplierid) {
    where.supplierid = supplierid;
  }

  const products = await SupplierProductModel.findAll({
    where,
    include: [{ model: ProductModel, as: "product" }],
    order: [["createdAt", "DESC"]],
  });

  return res.status(200).json(new ApiResponse(200, products));
});

export const searchProducts = asyncHandler(async (req, res) => {
  const { search = "", supplierid } = req.body;
  const trimmedSearch = String(search).trim();

  if (trimmedSearch.length < 2) {
    return res.status(200).json(new ApiResponse(200, []));
  }

  const products = await ProductModel.findAll({
    where: {
      itemtype: "product",
      isActive: true,
      productname: { [Op.like]: `%${trimmedSearch}%` },
    },
    attributes: ["productid", "productname", "productimage", "brandname", "unit", "price", "sellingprice", "availablestock"],
    include: [{
      model: SupplierProductModel,
      as: "supplierProducts",
      required: false,
      ...(supplierid ? { where: { supplierid } } : {}),
      attributes: ["id", "supplierid", "productid", "productname", "totalweight", "remainingweight", "unit", "totalprice", "perproductkgprice", "avgproductprice"],
    }],
    order: [["productname", "ASC"]],
    limit: 20,
  });

  return res.status(200).json(new ApiResponse(200, products));
});

