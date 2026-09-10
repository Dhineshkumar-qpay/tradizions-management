import { CartModel } from "../../model/cart_model.js";
import {
  CustomGiftItemModel,
  GiftcardModel,
  GiftPackModel,
  ProductModel,
} from "../../model/product_gift_model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const addToCart = asyncHandler(async (req, res) => {
  try {
    const userid = req.user?.userid;
    const { bid, productid, giftid, quantity, itemtype, isbuynow } = req.body;

    if (!userid) throw new ApiError(401, "User not authenticated");
    if (!bid) throw new ApiError(400, "Business ID is required");
    if (!itemtype || !["product", "gift"].includes(itemtype)) {
      throw new ApiError(400, "Valid itemtype (product or gift) is required");
    }

    const parsedQuantity = parseFloat(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      throw new ApiError(400, "Quantity must be a positive number");
    }

    if (itemtype === "product") {
      if (!productid) {
        throw new ApiError(400, "Product ID is required");
      }
      const product = await ProductModel.findOne({
        where: { productid, bid, itemtype: "product" },
      });
      if (!product) {
        throw new ApiError(
          404,
          "Product not found or does not belong to this business",
        );
      }
      if (product.availablestock <= 0) {
        throw new ApiError(400, "Product is out of stock");
      }
    } else if (itemtype === "gift") {
      if (!giftid) {
        throw new ApiError(400, "Gift ID is required");
      }
      const gift = await ProductModel.findOne({
        where: { productid: giftid, bid, itemtype: "gift" },
      });
      if (!gift) {
        throw new ApiError(
          404,
          "Gift card not found or does not belong to this business",
        );
      }
      if (gift.availablestock <= 0) {
        throw new ApiError(400, "Gift card is out of stock");
      }
    }

    const searchWhere = {
      userid,
      bid,
    };
    if (itemtype === "product") {
      searchWhere.productid = productid;
      searchWhere.itemtype = "product";
    } else {
      searchWhere.productid = giftid;
      searchWhere.itemtype = "gift";
    }

    let cartItem = await CartModel.findOne({
      where: searchWhere,
    });

    if (cartItem) {
      const newQuantity =
        isbuynow == true ? parsedQuantity : cartItem.quantity + parsedQuantity;
      if (itemtype === "product") {
        const product = await ProductModel.findOne({
          where: { productid, bid, itemtype: "product" },
        });
        if (product && product.availablestock < newQuantity) {
          throw new ApiError(
            400,
            `Cannot add quantity. Only ${product.availablestock} units in stock, and you already have ${cartItem.quantity} in your cart.`,
          );
        }
      } else {
        const gift = await ProductModel.findOne({
          where: { productid: giftid, bid, itemtype: "gift" },
        });
        if (gift && gift.availablestock < newQuantity) {
          throw new ApiError(
            400,
            `Cannot add quantity. Only ${gift.availablestock} units in stock, and you already have ${cartItem.quantity} in your cart.`,
          );
        }
      }

      cartItem.quantity = newQuantity;
      await cartItem.save();
    } else {
      // Double check stock for initial add
      if (itemtype === "product") {
        const product = await ProductModel.findOne({
          where: { productid, bid, itemtype: "product" },
        });
        if (product && product.availablestock < parsedQuantity) {
          throw new ApiError(
            400,
            `Only ${product.availablestock} units in stock`,
          );
        }
      } else {
        const gift = await ProductModel.findOne({
          where: { productid: giftid, bid, itemtype: "gift" },
        });
        if (gift && gift.availablestock < parsedQuantity) {
          throw new ApiError(400, `Only ${gift.availablestock} units in stock`);
        }
      }

      cartItem = await CartModel.create({
        userid,
        bid,
        productid: itemtype === "product" ? productid : giftid,
        giftid: null,
        quantity: parsedQuantity,
        itemtype,
      });
    }

    return res.status(200).json(
      new ApiResponse(200, {
        message: "Item added to cart",
        cartid: cartItem.cartid,
      }),
    );
  } catch (error) {
    throw error;
  }
});

export const addCustomGiftToCart = asyncHandler(async (req, res) => {
  const userid = req.user.userid;

  const { giftpackid } = req.body;

  if (!giftpackid) {
    throw new ApiError(400, "Custom Gift ID is required");
  }

  // Check Gift Exists
  const customGift = await GiftPackModel.findOne({
    where: {
      giftpackid,
    },
  });

  if (!customGift) {
    throw new ApiError(404, "Custom Gift not found");
  }

  // Check Gift Items
  const giftItems = await CustomGiftItemModel.findAll({
    where: {
      giftpackid,
    },
  });

  if (giftItems.length === 0) {
    throw new ApiError(400, "Gift has no products");
  }

  // Already in cart?
  const existingCart = await CartModel.findOne({
    where: {
      userid,
      itemtype: "customgift",
      giftpackid,
    },
  });

  if (existingCart) {
    existingCart.price = customGift.totalprice;
    existingCart.totalprice = customGift.totalprice;
    await existingCart.save();

    return res
      .status(200)
      .json(new ApiResponse(200, "Custom Gift updated in cart successfully"));
  }

  await CartModel.create({
    userid,
    bid: 1,
    itemtype: "customgift",
    giftpackid,
    quantity: 1,
    price: customGift.totalprice,
    totalprice: customGift.totalprice,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Custom Gift added to cart successfully"));
});

// export const getCart = asyncHandler(async (req, res) => {
//   try {
//     const userid = req.user?.userid;

//     if (!userid) {
//       throw new ApiError(401, "User not authenticated");
//     }

//     const cartItems = await CartModel.findAll({
//       where: { userid },
//       include: [
//         {
//           model: ProductModel,
//           as: "product",
//           required: false,
//         },
//       ],
//       order: [["createdAt", "DESC"]],
//     });

//     let totalamount = 0;

//     const updatedCart = cartItems
//       .map((item) => {
//         const data = item.toJSON();

//         if (!data.product) {
//           return null;
//         }

//         const price =
//           parseFloat(data.product.sellingprice) ||
//           parseFloat(data.product.price) ||
//           0;

//         const itemTotalPrice = data.quantity * price;

//         totalamount += itemTotalPrice;

//         if (data.itemtype === "product") {
//           return {
//             cartid: data.cartid,
//             itemtype: "product",
//             quantity: data.quantity,
//             totalprice: parseFloat(itemTotalPrice.toFixed(2)),
//             productid: data.product.productid,
//             name: data.product.productname,
//             image: data.product.productimage || null,
//             price: data.product.price,
//             sellingprice: data.product.sellingprice,
//           };
//         }

//         if (data.itemtype === "gift") {
//           return {
//             cartid: data.cartid,
//             itemtype: "gift",
//             quantity: data.quantity,
//             totalprice: parseFloat(itemTotalPrice.toFixed(2)),
//             giftid: data.product.productid,
//             name: data.product.productname,
//             image: data.product.productimage || null,
//             price: data.product.price,
//             sellingprice: data.product.sellingprice,
//             giftcardid: data.giftcardid || 0,
//             giftmessage: data.giftmessage,
//           };
//         }

//         return null;
//       })
//       .filter(Boolean);

//     return res.status(200).json(
//       new ApiResponse(200, {
//         cart: updatedCart,
//         totalamount: parseFloat(totalamount.toFixed(2)),
//       }),
//     );
//   } catch (error) {
//     throw error;
//   }
// });

export const getCart = asyncHandler(async (req, res) => {
  const userid = req.user?.userid;

  if (!userid) {
    throw new ApiError(401, "User not authenticated");
  }

  const cartItems = await CartModel.findAll({
    where: { userid },
    include: [
      {
        model: ProductModel,
        as: "product",
        required: false,
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  let totalamount = 0;
  const cartResponse = [];

  for (const item of cartItems) {
    const data = item.toJSON();

    // ---------------- PRODUCT ----------------
    if (data.itemtype === "product") {
      if (!data.product) continue;

      const price = parseFloat(
        data.product.sellingprice || data.product.price || 0,
      );

      const totalprice = price * data.quantity;

      totalamount += totalprice;

      cartResponse.push({
        cartid: data.cartid,
        itemtype: "product",
        quantity: data.quantity,
        totalprice,
        productid: data.product.productid,
        productname: data.product.productname,
        productimage: data.product.productimage,
        price: data.product.price,
        sellingprice: data.product.sellingprice,
      });
    }

    // ---------------- GIFT PRODUCT ----------------
    else if (data.itemtype === "gift") {
      if (!data.product) continue;

      const price = parseFloat(
        data.product.sellingprice || data.product.price || 0,
      );

      const totalprice = price * data.quantity;

      totalamount += totalprice;

      cartResponse.push({
        cartid: data.cartid,
        itemtype: "gift",
        quantity: data.quantity,
        totalprice,
        productid: data.product.productid,
        productname: data.product.productname,
        productimage: data.product.productimage,
        price: data.product.price,
        sellingprice: data.product.sellingprice,
        giftcardid: data.giftcardid,
        giftmessage: data.giftmessage,
      });
    }

    // ---------------- CUSTOM GIFT ----------------
    else if (data.itemtype === "customgift") {
      const customGift = await GiftPackModel.findByPk(data.giftpackid);

      if (!customGift) continue;

      const giftItems = await CustomGiftItemModel.findAll({
        where: {
          giftpackid: data.giftpackid,
        },
      });

      let giftTotalAmount = 0;

      for (const giftItem of giftItems) {
        giftTotalAmount += Number(giftItem.totalprice || 0);
      }

      giftTotalAmount += Number(customGift.giftpackprice || 0);

      const cartItemTotalPrice = giftTotalAmount * Number(data.quantity || 1);

      totalamount += cartItemTotalPrice;

      cartResponse.push({
        cartid: data.cartid,
        itemtype: "customgift",
        quantity: data.quantity,
        giftpackid: customGift.giftpackid,
        totalprice: cartItemTotalPrice,
        giftpackimage: customGift.giftpackimage,
        giftpackname: customGift.giftpackname,
        giftpackprice: customGift.giftpackprice,
        products: giftItems,
      });
    }
  }

  return res.status(200).json(
    new ApiResponse(200, {
      cart: cartResponse,
      totalamount,
    }),
  );
});

export const updateGiftCard = asyncHandler(async (req, res) => {
  try {
    const userid = req.user?.userid;

    const { cartid, giftcardid, giftmessage, sendername } = req.body;

    if (!cartid) {
      throw new ApiError(400, "Cart ID is required");
    }

    const cart = await CartModel.findOne({
      where: {
        cartid,
        userid,
      },
    });

    if (!cart) {
      throw new ApiError(404, "Cart not found");
    }

    if (parseInt(giftcardid) === 0) {
      cart.giftcardid = null;
      ((cart.giftmessage = giftmessage), await cart.save());

      return res
        .status(200)
        .json(new ApiResponse(200, "Gift card removed successfully"));
    }

    const existingGiftCard = await GiftcardModel.findByPk(giftcardid);

    if (!existingGiftCard) {
      throw new ApiError(404, "Gift card not found");
    }

    cart.giftcardid = giftcardid;

    ((cart.giftmessage = giftmessage),
      (cart.sendername = sendername),
      await cart.save());

    return res
      .status(200)
      .json(new ApiResponse(200, "Gift card added successfully"));
  } catch (error) {
    throw error;
  }
});

export const updateCartQuantity = asyncHandler(async (req, res) => {
  try {
    const userid = req.user?.userid;
    const { cartid, quantity, giftpackid } = req.body;

    if (!userid) throw new ApiError(401, "User not authenticated");
    if (!cartid) throw new ApiError(400, "Cart ID is required");

    const parsedQuantity = parseFloat(quantity);
    if (isNaN(parsedQuantity)) {
      throw new ApiError(400, "Quantity must be a valid number");
    }

    const cartItem = await CartModel.findOne({
      where: { cartid, userid },
      include: [
        { model: ProductModel, as: "product", required: false },
        {
          model: GiftPackModel,
          as: "giftpack",
          required: false,
        },
      ],
    });

    if (!cartItem) throw new ApiError(404, "Cart item not found");

    if (parsedQuantity <= 0) {
      await cartItem.destroy();
      return res
        .status(200)
        .json(new ApiResponse(200, "Item removed from cart"));
    }

    // Check stock availability
    if (cartItem.itemtype === "product" && cartItem.product) {
      if (cartItem.product.availablestock < parsedQuantity) {
        throw new ApiError(
          400,
          `Only ${cartItem.product.availablestock} units of this product are in stock`,
        );
      }
    } else if (cartItem.itemtype === "gift" && cartItem.product) {
      if (cartItem.product.availablestock < parsedQuantity) {
        throw new ApiError(
          400,
          `Only ${cartItem.product.availablestock} units of this gift are in stock`,
        );
      }
    } else if (cartItem.itemtype === "customgift" && cartItem.giftpack) {
      const customGiftItems = await CustomGiftItemModel.findAll({
        where: {
          userid,
          giftpackid: cartItem.giftpack.giftpackid,
        },
      });

      let giftItemsTotal = 0;
      for (const gItem of customGiftItems) {
        giftItemsTotal += Number(gItem.totalprice || 0);
      }

      const packingPrice = Number(cartItem.giftpack.giftpackprice || 0);
      const singlePrice = giftItemsTotal + packingPrice;

      cartItem.price = singlePrice;
      cartItem.totalprice = singlePrice * parsedQuantity;
    }

    cartItem.quantity = parsedQuantity;
    await cartItem.save();

    return res
      .status(200)
      .json(new ApiResponse(200, "Cart updated successfully"));
  } catch (error) {
    throw error;
  }
});

export const removeFromCart = asyncHandler(async (req, res) => {
  try {
    const userid = req.user?.userid;
    const { cartid, giftpackid } = req.body;

    if (!userid) throw new ApiError(401, "User not authenticated");
    if (!cartid) throw new ApiError(400, "Cart ID is required");

    if (giftpackid) {
      const customGifts = await CustomGiftItemModel.destroy({
        where: { giftpackid },
      });
    }

    const result = await CartModel.destroy({ where: { cartid, userid } });

    if (result === 0) throw new ApiError(404, "Cart item not found");

    return res
      .status(200)
      .json(new ApiResponse(200, { message: "Item removed from cart" }));
  } catch (error) {
    throw error;
  }
});

export const cartCount = asyncHandler(async (req, res) => {
  try {
    const userid = req.user?.userid;

    if (!userid) throw new ApiError(401, "User not authenticated");

    const cartItems = await CartModel.findAll({
      where: { userid },
      include: [
        {
          model: ProductModel,
          as: "product",
          required: false,
        },
      ],
    });

    let count = 0;

    for (const item of cartItems) {
      const data = item.toJSON();

      if (data.itemtype === "product" || data.itemtype === "gift") {
        if (data.product) {
          count++;
        }
      } else if (data.itemtype === "customgift") {
        const customGift = await GiftPackModel.findByPk(data.giftpackid);
        if (customGift) {
          count++;
        }
      } else {
        count++;
      }
    }

    return res
      .status(200)
      .json(new ApiResponse(200, count, "Cart count fetched successfully"));
  } catch (error) {
    throw error;
  }
});

export const emptyCart = asyncHandler(async (req, res) => {
  try {
    const userid = req.user?.userid;

    if (!userid) throw new ApiError(401, "User not authenticated");

    await CartModel.destroy({
      where: { userid },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Cart emptied successfully"));
  } catch (error) {
    throw error;
  }
});

export const checkoutDetail = asyncHandler(async (req, res) => {
  const userid = req.user?.userid;

  if (!userid) {
    throw new ApiError(401, "User not authenticated");
  }

  const cartItems = await CartModel.findAll({
    where: { userid },
    include: [
      {
        model: ProductModel,
        as: "product",
        required: false,
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  let totalamount = 0;
  const updatedCart = [];

  // Get all selected gift cards
  const giftCardIds = cartItems.map((item) => item.giftcardid).filter(Boolean);

  const selectedGiftCards = await GiftcardModel.findAll({
    where: { giftcardid: giftCardIds },
  });

  const giftCardMap = selectedGiftCards.reduce((acc, card) => {
    acc[card.giftcardid] = card;
    return acc;
  }, {});

  for (const item of cartItems) {
    const data = item.toJSON();

    // ---------------- PRODUCT ----------------
    if (data.itemtype === "product") {
      if (!data.product) continue;

      const price = Number(
        data.product.sellingprice || data.product.price || 0,
      );

      const totalprice = price * Number(data.quantity);

      totalamount += totalprice;

      updatedCart.push({
        cartid: data.cartid,
        itemtype: "product",
        quantity: data.quantity,
        totalprice,
        productid: data.product.productid,
        name: data.product.productname,
        image: data.product.productimage,
        price: data.product.price,
        sellingprice: data.product.sellingprice,
        categoryname: data.product.categoryname,
      });

      continue;
    }

    // ---------------- GIFT ----------------
    if (data.itemtype === "gift") {
      if (!data.product) continue;

      const price = Number(
        data.product.sellingprice || data.product.price || 0,
      );

      const totalprice = price * Number(data.quantity);

      totalamount += totalprice;

      updatedCart.push({
        cartid: data.cartid,
        itemtype: "gift",
        quantity: data.quantity,
        totalprice,
        giftcardid: data.giftcardid,
        giftid: data.product.productid,
        name: data.product.productname,
        image: data.product.productimage,
        price: data.product.price,
        sellingprice: data.product.sellingprice,
        categoryname: data.product.categoryname,
        giftcard: giftCardMap[data.giftcardid] || null,
      });

      continue;
    }

    // ---------------- CUSTOM GIFT ----------------
    if (data.itemtype === "customgift") {
      const customGift = await GiftPackModel.findByPk(data.giftpackid);

      if (!customGift) continue;

      const giftItems = await CustomGiftItemModel.findAll({
        where: {
          giftpackid: data.giftpackid,
        },
      });

      let giftItemsTotal = giftItems.reduce(
        (sum, item) => sum + Number(item.totalprice || 0),
        0,
      );

      const packingPrice = Number(customGift.giftpackprice || 0);

      const totalprice =
        (giftItemsTotal + packingPrice) * Number(data.quantity || 1);

      totalamount += totalprice;

      updatedCart.push({
        cartid: data.cartid,
        itemtype: "customgift",
        quantity: data.quantity,
        giftpackid: customGift.giftpackid,
        giftpackname: customGift.giftpackname,
        giftpackimage: customGift.giftpackimage,
        giftpackprice: packingPrice,
        totalprice,
        products: giftItems,
      });

      continue;
    }
  }

  return res.status(200).json(
    new ApiResponse(200, {
      products: updatedCart,
      totalamount: Number(totalamount.toFixed(2)),
    }),
  );
});

export const buyNowCheckout = asyncHandler(async (req, res) => {
  try {
    const userid = req.user?.userid;

    const { bid, productid, quantity, itemtype, giftid, giftcardid } = req.body;

    if (!userid) {
      throw new ApiError(401, "User not authenticated");
    }

    let product;

    if (itemtype === "product") {
      product = await ProductModel.findOne({
        where: {
          productid,
          bid,
          itemtype: "product",
        },
      });
    } else {
      product = await ProductModel.findOne({
        where: {
          productid: giftid,
          bid,
          itemtype: "gift",
        },
      });
    }

    if (!product) {
      throw new ApiError(404, "Item not found");
    }

    if (product.availablestock < quantity) {
      throw new ApiError(400, `Only ${product.availablestock} items available`);
    }

    const price = parseFloat(product.sellingprice) || parseFloat(product.price);

    const totalprice = quantity * price;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          products: [
            {
              itemtype,
              quantity,
              totalprice: parseFloat(totalprice.toFixed(2)),
              productid: product.productid,
              name: product.productname,
              image: product.productimage,
              price: product.price,
              sellingprice: product.sellingprice,
              categoryname: product.categoryname,
              giftcard: giftCard,
            },
          ],
          totalamount: parseFloat(totalprice.toFixed(2)),
        },
        "Buy now checkout fetched successfully",
      ),
    );
  } catch (error) {
    throw error;
  }
});
