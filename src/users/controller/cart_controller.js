import { CartModel } from "../../model/cart_model.js";
import { ProductModel, GiftModel } from "../../model/product_gift_model.js";
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
      const product = await ProductModel.findOne({ where: { productid, bid } });
      if (!product) {
        throw new ApiError(404, "Product not found or does not belong to this business");
      }
      if (product.availablestock <= 0) {
        throw new ApiError(400, "Product is out of stock");
      }
    } else if (itemtype === "gift") {
      if (!giftid) {
        throw new ApiError(400, "Gift ID is required");
      }
      const gift = await GiftModel.findOne({ where: { giftid, bid } });
      if (!gift) {
        throw new ApiError(404, "Gift card not found or does not belong to this business");
      }
      if (gift.stock <= 0) {
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
      searchWhere.giftid = giftid;
      searchWhere.itemtype = "gift";
    }

    let cartItem = await CartModel.findOne({
      where: searchWhere,
    });

    if (cartItem) {
      // Check stock availability for new total quantity
      const newQuantity = cartItem.quantity + parsedQuantity;
      if (itemtype === "product") {
        const product = await ProductModel.findOne({ where: { productid, bid } });
        if (product && product.availablestock < newQuantity) {
          throw new ApiError(
            400,
            `Cannot add quantity. Only ${product.availablestock} units in stock, and you already have ${cartItem.quantity} in your cart.`
          );
        }
      } else {
        const gift = await GiftModel.findOne({ where: { giftid, bid } });
        if (gift && gift.stock < newQuantity) {
          throw new ApiError(
            400,
            `Cannot add quantity. Only ${gift.stock} units in stock, and you already have ${cartItem.quantity} in your cart.`
          );
        }
      }

      cartItem.quantity = newQuantity;
      await cartItem.save();
    } else {
      // Double check stock for initial add
      if (itemtype === "product") {
        const product = await ProductModel.findOne({ where: { productid, bid } });
        if (product && product.availablestock < parsedQuantity) {
          throw new ApiError(400, `Only ${product.availablestock} units in stock`);
        }
      } else {
        const gift = await GiftModel.findOne({ where: { giftid, bid } });
        if (gift && gift.stock < parsedQuantity) {
          throw new ApiError(400, `Only ${gift.stock} units in stock`);
        }
      }

      cartItem = await CartModel.create({
        userid,
        bid,
        productid: itemtype === "product" ? productid : null,
        giftid: itemtype === "gift" ? giftid : null,
        quantity: parsedQuantity,
        itemtype,
      });
    }

    return res.status(200).json(new ApiResponse(200, { message: "Item added to cart" }));
  } catch (error) {
    throw error;
  }
});

export const getCart = asyncHandler(async (req, res) => {
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
        {
          model: GiftModel,
          as: "gift",
          required: false,
        },
      ],
    });

    const populatedCart = cartItems.map((item) => {
      const data = item.toJSON();

      if (data.itemtype === "product" && data.product) {
        const producttotalprice =
          data.quantity * (data.product.sellingprice || data.product.price);

        return {
          cartid: data.cartid,
          itemtype: "product",
          quantity: data.quantity,
          totalprice: producttotalprice,
          productid: data.product.productid,
          name: data.product.productname,
          image: data.product.productimage || null,
          price: data.product.price,
          sellingprice: data.product.sellingprice,
        };
      }

      if (data.itemtype === "gift" && data.gift) {
        const price = data.gift.giftsellingprice ?? data.gift.giftprice;
        const gifttotalprice = data.quantity * price;

        return {
          cartid: data.cartid,
          itemtype: "gift",
          quantity: data.quantity,
          totalprice: gifttotalprice,
          giftid: data.gift.giftid,
          name: data.gift.giftname,
          image: data.gift.giftimage || null,
          price: data.gift.giftprice,
          sellingprice: data.gift.giftsellingprice,
        };
      }
      return null;
    });

    return res
      .status(200)
      .json(new ApiResponse(200, populatedCart.filter(Boolean)));
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
      include: [
        { model: ProductModel, as: "product", required: false },
        { model: GiftModel, as: "gift", required: false },
      ],
    });

    if (!cartItem) throw new ApiError(404, "Cart item not found");

    if (parsedQuantity <= 0) {
      await cartItem.destroy();
      return res
        .status(200)
        .json(new ApiResponse(200, { message: "Item removed from cart" }));
    }

    // Check stock availability
    if (cartItem.itemtype === "product" && cartItem.product) {
      if (cartItem.product.availablestock < parsedQuantity) {
        throw new ApiError(
          400,
          `Only ${cartItem.product.availablestock} units of this product are in stock`
        );
      }
    } else if (cartItem.itemtype === "gift" && cartItem.gift) {
      if (cartItem.gift.stock < parsedQuantity) {
        throw new ApiError(
          400,
          `Only ${cartItem.gift.stock} units of this gift are in stock`
        );
      }
    }

    cartItem.quantity = parsedQuantity;
    await cartItem.save();

    return res.status(200).json(new ApiResponse(200, cartItem));
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
