import { CartModel } from "../../model/cart_model.js";
import { GiftcardModel, ProductModel } from "../../model/product_gift_model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const addToCart = asyncHandler(async (req, res) => {
  try {
    const userid = req.user?.userid;
    const { bid, productid, giftid, quantity, itemtype } = req.body;

    if (!userid) throw new ApiError(401, "User not authenticated");
    if (!bid) throw new ApiError(400, "Business ID is required");
    if (!itemtype || !["product", "gift"].includes(itemtype)) {
      throw new ApiError(400, "Valid itemtype (product or gift) is required");
    }

    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      throw new ApiError(400, "Quantity must be a positive integer");
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
      // Check stock availability for new total quantity
      const newQuantity = cartItem.quantity + parsedQuantity;
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

    return res.status(200).json(new ApiResponse(200, "Item added to cart"));
  } catch (error) {
    throw error;
  }
});

export const getCart = asyncHandler(async (req, res) => {
  try {
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

    const updatedCart = await Promise.all(
      cartItems
        .map(async (item) => {
          const data = item.toJSON();

          if (!data.product) {
            return null;
          }

          let giftCards;
          let giftCard;
          let cardPrice = 0;

          if (data.itemtype === "gift") {
            giftCards = await GiftcardModel.findAll({
              where: {
                bid: data.bid,
              },
            });

            giftCard = await GiftcardModel.findByPk(data.giftcardid);
          }

          const price =
            parseFloat(data.product.sellingprice) ||
            parseFloat(data.product.price);

          if (data.itemtype === "gift" && giftCard) {
            cardPrice = parseFloat(giftCard.cardprice);
          }

          const itemTotalPrice = data.quantity * price + cardPrice;

          totalamount += itemTotalPrice;

          if (data.itemtype === "product") {
            return {
              cartid: data.cartid,
              itemtype: "product",
              quantity: data.quantity,
              totalprice: itemTotalPrice,
              productid: data.product.productid,
              name: data.product.productname,
              image: data.product.productimage || null,
              price: data.product.price,
              sellingprice: data.product.sellingprice,
              categoryname: data.product.categoryname,
            };
          }

          if (data.itemtype === "gift") {
            return {
              cartid: data.cartid,
              itemtype: "gift",
              quantity: data.quantity,
              totalprice: itemTotalPrice,
              giftcardid: data.giftcardid || 0,
              giftid: data.product.productid,
              name: data.product.productname,
              image: data.product.productimage || null,
              price: data.product.price,
              sellingprice: data.product.sellingprice,
              categoryname: data.product.categoryname,
              giftcard: giftCards,
            };
          }

          return null;
        })
        .filter(Boolean),
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          cart: updatedCart,
          totalamount: totalamount,
        },
        "Cart fetched successfully",
      ),
    );
  } catch (error) {
    throw error;
  }
});

export const selectGiftCard = asyncHandler(async (req, res) => {
  try {
    const userid = req.user?.userid;

    const { cartid, giftcardid } = req.body;

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

      await cart.save();

      return res
        .status(200)
        .json(new ApiResponse(200, "Gift card removed successfully"));
    }

    const existingGiftCard = await GiftcardModel.findByPk(giftcardid);

    if (!existingGiftCard) {
      throw new ApiError(404, "Gift card not found");
    }

    cart.giftcardid = giftcardid;

    await cart.save();

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
    const { cartid, quantity } = req.body;

    if (!userid) throw new ApiError(401, "User not authenticated");
    if (!cartid) throw new ApiError(400, "Cart ID is required");

    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedQuantity)) {
      throw new ApiError(400, "Quantity must be a valid integer");
    }

    const cartItem = await CartModel.findOne({
      where: { cartid, userid },
      include: [{ model: ProductModel, as: "product", required: false }],
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
    const { cartid } = req.body;

    if (!userid) throw new ApiError(401, "User not authenticated");
    if (!cartid) throw new ApiError(400, "Cart ID is required");

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

    const count = await CartModel.count({
      where: { userid },
    });

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
  try {
    const userid = req.user?.userid;

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
    let totalamount = 0;

    const updatedCart = await Promise.all(
      cartItems
        .map(async (item) => {
          const data = item.toJSON();

          if (!data.product) {
            return null;
          }

          let giftCard;
          let cardPrice = 0;

          if (data.itemtype === "gift") {
            giftCard = await GiftcardModel.findByPk(data.giftcardid);
          }

          const price =
            parseFloat(data.product.sellingprice) ||
            parseFloat(data.product.price);

          if (data.itemtype === "gift" && giftCard) {
            cardPrice = parseFloat(giftCard.cardprice);
          }

          const itemTotalPrice = data.quantity * price + cardPrice;

          totalamount += itemTotalPrice;

          if (data.itemtype === "product") {
            return {
              cartid: data.cartid,
              itemtype: "product",
              quantity: data.quantity,
              totalprice: itemTotalPrice,
              productid: data.product.productid,
              name: data.product.productname,
              image: data.product.productimage || null,
              price: data.product.price,
              sellingprice: data.product.sellingprice,
              categoryname: data.product.categoryname,
            };
          }

          if (data.itemtype === "gift") {
            return {
              cartid: data.cartid,
              itemtype: "gift",
              quantity: data.quantity,
              totalprice: itemTotalPrice,
              giftcardid: data.giftcardid || 0,
              giftid: data.product.productid,
              name: data.product.productname,
              image: data.product.productimage || null,
              price: data.product.price,
              sellingprice: data.product.sellingprice,
              categoryname: data.product.categoryname,
              giftcard: giftCard,
            };
          }

          return null;
        })
        .filter(Boolean),
    );

    return res.status(200).json(
      new ApiResponse(200, {
        products: updatedCart,
        totalamount: totalamount,
      }),
    );
  } catch (error) {
    throw error;
  }
});
