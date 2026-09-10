import { WalletModel } from "../../model/wallet_model.js";
import { AuthModel } from "../../model/auth_model.js";

// Add points to user's wallet based on spent amount
// Rule: 1 point for every ₹100 spent (e.g., ₹1,000 = 10 points, ₹1,500 = 15 points)
export const addPointsForPurchase = async (req, res, next) => {
  try {
    const userid = req.user?.userid;
    const { amount_spent } = req.body;

    if (!userid || amount_spent === undefined) {
      return res.status(400).json({ success: false, message: "userid and amount_spent are required" });
    }

    const user = await AuthModel.findByPk(userid);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Calculate points: 1 point for every 100 spent
    const pointsToAdd = Math.floor(Number(amount_spent) / 100);

    if (pointsToAdd > 0) {
      let wallet = await WalletModel.findOne({ where: { userid } });

      if (!wallet) {
        wallet = await WalletModel.create({ userid, points: pointsToAdd });
      } else {
        wallet.points += pointsToAdd;
        await wallet.save();
      }

      return res.status(200).json({
        success: true,
        message: `${pointsToAdd} points added to wallet successfully`,
        wallet,
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "Amount spent is less than ₹100. No points added.",
        pointsAdded: 0,
      });
    }
  } catch (error) {
    next(error);
  }
};

// Fetch user's wallet balance
export const getWalletBalance = async (req, res, next) => {
  try {
    const userid = req.user?.userid;

    if (!userid) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let wallet = await WalletModel.findOne({ where: { userid } });

    if (!wallet) {
      // If no wallet exists yet, they effectively have 0 points
      return res.status(200).json({
        success: true,
        wallet: { userid, points: 0 },
      });
    }

    return res.status(200).json({
      success: true,
      wallet,
    });
  } catch (error) {
    next(error);
  }
};
