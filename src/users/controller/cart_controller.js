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

    if (itemtype === "product" && !productid) {
      throw new ApiError(400, "Product ID is required");
    }
    if (itemtype === "gift" && !giftid) {
      throw new ApiError(400, "Gift ID is required");
    }

    let cartItem = await CartModel.findOne({
      where: {
        userid,
        bid,
        productid: productid || null,
        giftid: giftid || null,
      },
    });

    if (cartItem) {
      cartItem.quantity += parseInt(quantity) || 1;
      await cartItem.save();
    } else {
      cartItem = await CartModel.create({
        userid,
        bid,
        productid,
        giftid,
        quantity: quantity || 1,
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

      if (data.product) {
        const producttotalprice =
          data.quantity * data.product.sellingprice ||
          data.quantity * data.product.price;

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

      if (data.gift) {
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

    const cartItem = await CartModel.findOne({ where: { cartid, userid } });

    if (!cartItem) throw new ApiError(404, "Cart item not found");

    if (quantity <= 0) {
      await cartItem.destroy();
      return res
        .status(200)
        .json(new ApiResponse(200, null, "Item removed from cart"));
    }

    cartItem.quantity = quantity;
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
      .json(new ApiResponse(200, null, "Item removed from cart"));
  } catch (error) {
    throw error;
  }
});
