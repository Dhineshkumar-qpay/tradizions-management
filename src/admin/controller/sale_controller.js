import { SaleModel, SaleItemModel } from "../../model/sale_model.js";
import { SupplierProductModel, SupplierModel } from "../../model/supplier_model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sequelize } from "../../../connection.js";
import { OrderModel, OrderItemModel } from "../../model/order_model.js";
import { ProductModel } from "../../model/product_gift_model.js";
import { AuthModel } from "../../model/auth_model.js";
import { AddressModel } from "../../model/address_model.js";
import { Op } from "sequelize";

export const addSale = asyncHandler(async (req, res) => {
  const { orderid, customername, saledate } = req.body;

  // Validate basic inputs
  if (!orderid?.trim()) throw new ApiError(400, "Order ID is required");
  if (!customername?.trim()) throw new ApiError(400, "Customer name is required");
  if (!saledate?.trim()) throw new ApiError(400, "Sale date is required");

  // Fetch Order and OrderItems
  const order = await OrderModel.findOne({
    where: { orderid },
    include: [{ model: OrderItemModel, as: "items" }]
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (!order.items || order.items.length === 0) {
    throw new ApiError(400, "Order has no items");
  }

  // Use sequelize.transaction()
  const result = await sequelize.transaction(async (t) => {
    let grandTotal = 0;
    let grandTotalCost = 0;
    let grandTotalProfit = 0;
    const saleItemsData = [];

    for (const item of order.items) {
      // Only process product items for supplier stock deduction
      if (item.itemtype !== "product") continue;

      const productid = item.productid;
      const orderQuantity = Number(item.quantity);
      if (orderQuantity <= 0) {
        throw new ApiError(400, "Quantity must be greater than 0");
      }

      // Fetch ProductModel to know the unit
      const product = await ProductModel.findByPk(productid, { transaction: t });
      if (!product) {
        throw new ApiError(404, `Product not found for order item ${item.orderitemid}`);
      }

      const itemUnit = product.unit ? product.unit.trim().toLowerCase() : 'kg';
      const productWeight = Number(product.weight || 0);
      const isMonthlyItem = Number(item.gramsperday) > 0 && Number(item.dayspermonth) > 0;

      let requiredQuantityGrams = 0;
      if (isMonthlyItem) {
        // FIX: Added familymembers
        requiredQuantityGrams = Number(item.gramsperday) * Number(item.dayspermonth) * (Number(item.familymembers) || 1);
      } else if (itemUnit === 'kg') {
        requiredQuantityGrams = productWeight * 1000 * orderQuantity;
      } else if (itemUnit === 'g' || itemUnit === 'grams') {
        requiredQuantityGrams = productWeight * orderQuantity;
      } else {
        requiredQuantityGrams = orderQuantity; // Fallback
      }

      // Preserve customer selling price from order
      // FIX: Use totalprice or price
      const customerPrice = Number(item.totalprice || item.price);

      // Find available SupplierProducts using FIFO (oldest stock first)
      const availableSuppliers = await SupplierProductModel.findAll({
        where: {
          productid: productid,
          remainingweight: { [Op.gt]: 0 }
        },
        order: [["createdAt", "ASC"]],
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      let remainingToFulfillGrams = requiredQuantityGrams;

      for (const sp of availableSuppliers) {
        if (remainingToFulfillGrams <= 0) break;

        const spUnit = sp.unit.trim().toLowerCase();
        let spRemainingGrams = Number(sp.remainingweight);
        if (spUnit === 'kg') {
          spRemainingGrams = spRemainingGrams * 1000;
        }

        const deductGrams = Math.min(spRemainingGrams, remainingToFulfillGrams);
        remainingToFulfillGrams -= deductGrams;

        let deductWeight = deductGrams;
        let deductQuantityForSaleItem = deductGrams;

        if (spUnit === 'kg') {
          deductWeight = deductGrams / 1000;
        }
        if (itemUnit === 'kg') {
          deductQuantityForSaleItem = deductGrams / 1000;
        }

        // Update SupplierProduct stock
        const newRemainingWeight = Number(sp.remainingweight) - deductWeight;
        await sp.update({ remainingweight: newRemainingWeight }, { transaction: t });

        // Calculate financials
        const costprice = Number(sp.perproductkgprice);

        const weightInKg = deductGrams / 1000;
        const totalcost = weightInKg * costprice;

        // Prorate the customer price for this supplier's deduction
        const totalprice = requiredQuantityGrams > 0
          ? customerPrice * (deductGrams / requiredQuantityGrams)
          : 0;

        const profit = totalprice - totalcost;

        grandTotal += totalprice;
        grandTotalCost += totalcost;
        grandTotalProfit += profit;

        saleItemsData.push({
          supplierid: sp.supplierid,
          supplierproductid: sp.id,
          productname: sp.productname,
          quantity: deductQuantityForSaleItem,
          unit: itemUnit,
          quantitygrams: deductGrams,
          price: customerPrice,
          costprice: costprice,
          totalprice: totalprice,
          totalcost: totalcost,
          profit: profit
        });
      }

      // Rollback if there is insufficient stock
      if (remainingToFulfillGrams > 0) {
        throw new ApiError(400, `Insufficient stock for product ${product.productname}. Missing ${remainingToFulfillGrams}g.`);
      }
    }

    // Create the SaleModel
    const finalTotalAmount = Number(order.totalamount) || grandTotal;
    const finalProfit = finalTotalAmount - grandTotalCost;

    const sale = await SaleModel.create({
      orderid: orderid.trim(),
      customername: customername.trim(),
      saledate: new Date(saledate),
      totalamount: finalTotalAmount,
      totalcost: grandTotalCost,
      totalprofit: finalProfit,
      status: "completed"
    }, { transaction: t });

    // Create all SaleItemModel records
    const itemsWithSaleId = saleItemsData.map(data => ({
      ...data,
      saleid: sale.id
    }));
    await SaleItemModel.bulkCreate(itemsWithSaleId, { transaction: t });

    return sale;
  });

  return res.status(200).json(new ApiResponse(200, "Sale created successfully", result));
});

export const getAllSales = asyncHandler(async (req, res) => {
  const sales = await SaleModel.findAll({
    order: [["createdAt", "DESC"]],
  });

  return res.status(200).json(new ApiResponse(200, sales));
});

export const getSaleById = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) throw new ApiError(400, "Sale ID is required");

  const sale = await SaleModel.findByPk(id, {
    include: [
      {
        model: SaleItemModel,
        as: "items",
        include: [
          { model: SupplierModel },
          { model: SupplierProductModel }
        ]
      }
    ]
  });

  if (!sale) throw new ApiError(404, "Sale not found");

  return res.status(200).json(new ApiResponse(200, sale));
});

export const searchOrder = asyncHandler(async (req, res) => {
  const { orderid } = req.body;

  if (!orderid) {
    throw new ApiError(400, "Order ID is required");
  }

  const order = await OrderModel.findOne({
    where: { orderid },
    include: [
      {
        model: OrderItemModel,
        as: "items",
        include: [{
          model: ProductModel,
          as: "product",
          include: [{
            model: SupplierProductModel,
            as: "supplierProducts",
            include: [{ model: SupplierModel }],
          }],
        }],
      },
    ],
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const [user, address] = await Promise.all([
    AuthModel.findByPk(order.userid, {
      attributes: ["userid", "username", "phone", "email"],
    }),
    AddressModel.findByPk(order.addressid),
  ]);

  const orderProducts = order.items.map((item) => item.product).filter(Boolean);
  const legacySupplierProducts = orderProducts.length
    ? await SupplierProductModel.findAll({
      where: {
        [Op.or]: [
          { productid: { [Op.in]: orderProducts.map((product) => product.productid) } },
          { productname: { [Op.in]: orderProducts.map((product) => product.productname) } },
        ],
      },
      include: [{ model: SupplierModel }],
    })
    : [];

  const orderDetails = {
    ...order.toJSON(),
    user,
    address,
  };

  orderDetails.items = orderDetails.items.map((item) => {
    const product = item.product;
    const productUnit = String(product?.unit || "g").toLowerCase();
    const productWeight = Number(product?.weight || 0);
    const isMonthlyItem = Number(item.gramsperday) > 0 && Number(item.dayspermonth) > 0;
    // FIX: added familymembers
    const orderQuantityGrams = isMonthlyItem
      ? Number(item.gramsperday) * Number(item.dayspermonth) * (Number(item.familymembers) || 1)
      : productUnit === "kg"
        ? productWeight * 1000 * Number(item.quantity || 0)
        : productUnit === "g"
          ? productWeight * Number(item.quantity || 0)
          : 0;

    const allSupplierProducts = product?.supplierProducts?.length
      ? product.supplierProducts
      : legacySupplierProducts.filter((supplierProduct) => (
        String(supplierProduct.productid) === String(product?.productid) ||
        supplierProduct.productname?.toLowerCase() === product?.productname?.toLowerCase()
      ));

    // DEDUPLICATE by supplierid
    const uniqueSuppliersMap = new Map();
    (allSupplierProducts || []).forEach(sp => {
      if (!uniqueSuppliersMap.has(sp.supplierid)) {
        uniqueSuppliersMap.set(sp.supplierid, sp);
      }
    });
    const uniqueSupplierProducts = Array.from(uniqueSuppliersMap.values());

    return {
      ...item,
      orderquantitygrams: Number(orderQuantityGrams.toFixed(2)),
      // FIX: totalprice
      orderprice: Number(item.totalprice || item.price || 0),
      supplieroptions: uniqueSupplierProducts.map((supplierProduct) => ({
        id: supplierProduct.id,
        supplierid: supplierProduct.supplierid,
        suppliername: supplierProduct.SupplierModel?.name || "Supplier",
        productid: supplierProduct.productid,
        productname: supplierProduct.productname,
        remainingweight: supplierProduct.remainingweight,
        unit: supplierProduct.unit,
        perproductkgprice: supplierProduct.perproductkgprice,
        avgproductprice: supplierProduct.avgproductprice,
      })),
    };
  });

  return res.status(200).json(new ApiResponse(200, orderDetails));
});

export const searchOrders = asyncHandler(async (req, res) => {
  const search = String(req.body.search || "").trim();

  if (search.length < 1) {
    return res.status(200).json(new ApiResponse(200, []));
  }

  const orders = await OrderModel.findAll({
    where: {
      orderid: { [Op.like]: `%${search}%` },
    },
    attributes: ["orderid", "userid", "totalamount", "orderstatus", "paymentstatus", "createdAt"],
    include: [{
      model: OrderItemModel,
      as: "items",
      attributes: ["orderitemid", "productid", "quantity", "totalprice"],
    }],
    order: [["createdAt", "DESC"]],
    limit: 10,
  });

  const users = await AuthModel.findAll({
    where: { userid: { [Op.in]: orders.map((order) => order.userid) } },
    attributes: ["userid", "username", "phone"],
  });
  const usersById = new Map(users.map((user) => [String(user.userid), user]));

  return res.status(200).json(new ApiResponse(200, orders.map((order) => ({
    orderid: order.orderid,
    customername: usersById.get(String(order.userid))?.username || usersById.get(String(order.userid))?.phone || "Customer",
    totalamount: order.totalamount,
    orderstatus: order.orderstatus,
    paymentstatus: order.paymentstatus,
    createdAt: order.createdAt,
    itemcount: order.items?.length || 0,
  }))));
});

export const getOrderSuppliers = asyncHandler(async (req, res) => {
  const { orderid } = req.body;

  if (!orderid) {
    throw new ApiError(400, "Order ID is required");
  }

  const order = await OrderModel.findOne({
    where: { orderid },
    include: [{
      model: OrderItemModel,
      as: "items",
      include: [{
        model: ProductModel,
        as: "product",
        include: [{
          model: SupplierProductModel,
          as: "supplierProducts",
          include: [{ model: SupplierModel }],
        }],
      }],
    }],
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const productNames = order.items
    .map((item) => item.product?.productname)
    .filter(Boolean);
  const legacySupplierProducts = productNames.length
    ? await SupplierProductModel.findAll({
      where: { productname: { [Op.in]: productNames } },
      include: [{ model: SupplierModel }],
    })
    : [];

  const items = order.items.map((item) => {
    const product = item.product;
    const linkedProducts = product?.supplierProducts?.length
      ? product.supplierProducts
      : legacySupplierProducts.filter((supplierProduct) => (
        String(supplierProduct.productid) === String(product?.productid) ||
        supplierProduct.productname?.toLowerCase() === product?.productname?.toLowerCase()
      ));

    // DEDUPLICATE by supplierid
    const uniqueSuppliersMap = new Map();
    (linkedProducts || []).forEach(sp => {
      if (!uniqueSuppliersMap.has(sp.supplierid)) {
        uniqueSuppliersMap.set(sp.supplierid, sp);
      }
    });
    const uniqueLinkedProducts = Array.from(uniqueSuppliersMap.values());

    return {
      orderitemid: item.orderitemid,
      productid: item.productid,
      productname: product?.productname || "Product",
      suppliers: uniqueLinkedProducts.map((supplierProduct) => ({
        supplierid: supplierProduct.supplierid,
        suppliername: supplierProduct.SupplierModel?.name || "Supplier",
        supplierproductid: supplierProduct.id,
        productid: supplierProduct.productid,
        productname: supplierProduct.productname,
        remainingweight: supplierProduct.remainingweight,
        unit: supplierProduct.unit,
        perproductkgprice: supplierProduct.perproductkgprice,
        avgproductprice: supplierProduct.avgproductprice,
      })),
    };
  });

  return res.status(200).json(new ApiResponse(200, {
    orderid: order.orderid,
    items,
  }));
});

export const updateSale = asyncHandler(async (req, res) => {
  const { id, customername, saledate, status } = req.body;
  if (!id) throw new ApiError(400, "Sale ID is required");

  const sale = await SaleModel.findByPk(id);
  if (!sale) throw new ApiError(404, "Sale not found");

  const updates = {};
  if (customername !== undefined) updates.customername = customername;
  if (saledate !== undefined) updates.saledate = new Date(saledate);
  if (status !== undefined) updates.status = status;

  await sale.update(updates);

  return res.status(200).json(new ApiResponse(200, "Sale updated successfully", sale));
});

export const deleteSale = asyncHandler(async (req, res) => {
  const { id } = req.body;
  if (!id) throw new ApiError(400, "Sale ID is required");

  await sequelize.transaction(async (t) => {
    const sale = await SaleModel.findByPk(id, {
      include: [{ model: SaleItemModel, as: "items" }],
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!sale) throw new ApiError(404, "Sale not found");

    // Revert stock for each sale item
    for (const item of sale.items) {
      if (item.supplierproductid) {
        const sp = await SupplierProductModel.findByPk(item.supplierproductid, { transaction: t, lock: t.LOCK.UPDATE });
        if (sp) {
          const spUnit = sp.unit ? sp.unit.trim().toLowerCase() : 'kg';
          let revertWeight = Number(item.quantitygrams); // the grams deducted
          if (spUnit === 'kg') {
            revertWeight = revertWeight / 1000;
          }
          await sp.update({
            remainingweight: Number(sp.remainingweight) + revertWeight
          }, { transaction: t });
        }
      }
    }

    // Delete items and sale
    await SaleItemModel.destroy({ where: { saleid: id }, transaction: t });
    await sale.destroy({ transaction: t });
  });

  return res.status(200).json(new ApiResponse(200, "Sale deleted and stock reverted successfully"));
});
