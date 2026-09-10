import { CouponModel } from "../../model/coupon_model.js";
import { CartModel } from "../../model/cart_model.js";
import { ProductModel, GiftPackModel, CustomGiftItemModel } from "../../model/product_gift_model.js";
import { Op } from "sequelize";

// Merchant creates a coupon
export const createCoupon = async (req, res, next) => {
  try {
    const { code, discount_type, discount_value } = req.body;

    if (!code || !discount_type || discount_value === undefined) {
      return res.status(400).json({ success: false, message: "Code, discount_type, and discount_value are required" });
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 10);

    const newCoupon = await CouponModel.create({
      code: code.toUpperCase(),
      discount_type,
      discount_value,
      is_active: true,
      expiryDate
    });

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon: newCoupon,
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: "Coupon code already exists" });
    }
    next(error);
  }
};

// User applies coupon (validates and calculates discount on their current cart)
export const applyCoupon = async (req, res, next) => {
  try {
    const userid = req.user?.userid;
    const { code } = req.body;

    if (!userid || !code) {
      return res.status(400).json({ success: false, message: "User ID and coupon code are required" });
    }

    const coupon = await CouponModel.findOne({ where: { code: code.toUpperCase() } });
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Invalid coupon code." });
    }

    if (!coupon.is_active) {
      return res.status(400).json({ success: false, message: "Invalid coupon code." });
    }

    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({ success: false, message: "This coupon has expired." });
    }

    // Calculate user cart total
    const cartItems = await CartModel.findAll({
      where: { userid },
      include: [
        { model: ProductModel, as: "product" },
        { model: GiftPackModel, as: "giftpack" },
      ],
    });

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    let cartTotal = 0;
    for (const item of cartItems) {
      if (item.itemtype === "customgift") {
        if (item.giftpack) {
          const giftItems = await CustomGiftItemModel.findAll({
            where: { giftpackid: item.giftpackid },
          });
          let giftItemsTotal = 0;
          for (const gItem of giftItems) {
            giftItemsTotal += Number(gItem.totalprice || 0);
          }
          const packingPrice = Number(item.giftpack.giftpackprice || 0);
          cartTotal += (giftItemsTotal + packingPrice) * item.quantity;
        }
      } else {
        if (item.product) {
          cartTotal += parseFloat(item.product.sellingprice || item.product.price || 0) * item.quantity;
        }
      }
    }

    if (cartTotal <= 5000) {
      return res.status(400).json({ success: false, message: "Coupons can only be applied to orders above ₹5,000." });
    }

    let discountAmount = 0;
    if (coupon.discount_type === "percentage") {
      discountAmount = (cartTotal * coupon.discount_value) / 100;
    } else {
      discountAmount = coupon.discount_value;
    }

    // Ensure discount doesn't exceed cart total
    discountAmount = Math.min(discountAmount, cartTotal);
    const finalAmount = cartTotal - discountAmount;

    return res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      discount_amount: parseFloat(discountAmount.toFixed(2)),
      final_amount: parseFloat(finalAmount.toFixed(2)),
      cart_total: parseFloat(cartTotal.toFixed(2)),
      coupon: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value
      }
    });
  } catch (error) {
    next(error);
  }
};

// User lists active coupons
export const getActiveCoupons = async (req, res, next) => {
  try {
    const coupons = await CouponModel.findAll({
      where: { 
        is_active: true,
        [Op.or]: [
          { expiryDate: { [Op.gt]: new Date() } },
          { expiryDate: null }
        ]
      },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Active coupons retrieved successfully",
      coupons: coupons,
    });
  } catch (error) {
    next(error);
  }
};

// Merchant lists all coupons
export const getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await CouponModel.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Coupons retrieved successfully",
      coupons: coupons,
    });
  } catch (error) {
    next(error);
  }
};

// Merchant toggles coupon status
export const toggleCouponStatus = async (req, res, next) => {
  try {
    const { code, is_active } = req.body;

    if (!code || is_active === undefined) {
      return res.status(400).json({ success: false, message: "Coupon code and is_active status are required" });
    }

    const coupon = await CouponModel.findOne({ where: { code: code.toUpperCase() } });
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    coupon.is_active = is_active;
    await coupon.save();

    return res.status(200).json({
      success: true,
      message: `Coupon status updated to ${is_active ? 'active' : 'inactive'}`,
      coupon: coupon
    });
  } catch (error) {
    next(error);
  }
};

// Merchant edits a coupon
export const editCoupon = async (req, res, next) => {
  try {
    const { couponid, code, discount_type, discount_value, is_active } = req.body;

    if (!couponid || !code || !discount_type || discount_value === undefined) {
      return res.status(400).json({ success: false, message: "Coupon ID, code, discount_type, and discount_value are required" });
    }

    const coupon = await CouponModel.findByPk(couponid);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    // Check if the new code already exists for a different coupon
    if (code.toUpperCase() !== coupon.code) {
      const existingCoupon = await CouponModel.findOne({ where: { code: code.toUpperCase() } });
      if (existingCoupon) {
        return res.status(400).json({ success: false, message: "Coupon code already exists" });
      }
    }

    coupon.code = code.toUpperCase();
    coupon.discount_type = discount_type;
    coupon.discount_value = discount_value;
    
    if (is_active !== undefined) {
      coupon.is_active = is_active;
    }

    await coupon.save();

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon: coupon
    });
  } catch (error) {
    next(error);
  }
};

// Merchant deletes a coupon
export const deleteCoupon = async (req, res, next) => {
  try {
    const { couponid } = req.params;

    if (!couponid) {
      return res.status(400).json({ success: false, message: "Coupon ID is required" });
    }

    const coupon = await CouponModel.findByPk(couponid);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    await coupon.destroy();

    return res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
