import { Op, where } from "sequelize";
import {
  BasicInfoModel,
  BusinessAddressModel,
  BusinessBankModel,
  BusinessInfoModel,
  BusinessModel,
  KYCModel,
} from "../../model/business_model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import fs from "fs";
import { sequelize } from "../../../connection.js";
import { ProductModel } from "../../model/product_gift_model.js";
import { AuthModel } from "../../model/auth_model.js";

export const addBusiness = asyncHandler(async (req, res) => {
  try {
    const { username, phone, businessname, description, email } = req.body;

    if (!username) {
      throw new ApiError(400, "Username is required");
    }

    if (!phone) {
      throw new ApiError(400, "Phone is required");
    }

    if (!businessname) {
      throw new ApiError(400, "Business name is required");
    }

    if (!description) {
      throw new ApiError(400, "Description is required");
    }

    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    let user = await AuthModel.findOne({
      where: {
        phone,
      },
    });

    if (user) throw new ApiError(400, "User already exists with same phone");

    if (!user) {
      user = await AuthModel.create({
        username: username.trim(),
        phone: phone.trim(),
        role: "user",
      });
    }

    const existingBusiness = await BusinessModel.findOne({
      where: {
        userid: user.userid,
        businessname,
      },
    });

    if (existingBusiness) {
      throw new ApiError(400, "Business already exists");
    }

    const business = await BusinessModel.create({
      userid: user.userid,
      username: username.trim(),
      phone: phone.trim(),
      email: email.trim(),
      businessname: businessname.trim(),
      description: description.trim(),
    });

    if (!business) {
      throw new ApiError(500, "Business creation failed");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Business added successfully"));
  } catch (error) {
    throw error;
  }
});

export const deleteBusiness = asyncHandler(async (req, res) => {
  try {
    const userid = req.user?.userid;
    const { bid } = req.body;

    if (!bid) {
      throw new ApiError(400, "Business ID is required");
    }

    const business = await BusinessModel.findOne({
      where: {
        bid,
        userid,
      },
    });

    if (!business) {
      throw new ApiError(404, "Business not found");
    }
    if (business.verified) {
      throw new ApiError(400, "Verified business cannot be deleted");
    }

    await business.destroy();

    return res
      .status(200)
      .json(new ApiResponse(200, "Business deleted successfully"));
  } catch (error) {
    throw error;
  }
});

export const activeBusinessStatus = asyncHandler(async (req, res) => {
  try {
    const { bid, status } = req.body;

    if (!bid) {
      throw new ApiError(400, "Business ID is required");
    }

    if (!status) {
      throw new ApiError(400, "Status is required");
    }

    const existingBusiness = await BusinessModel.findByPk(bid);

    if (!existingBusiness) {
      throw new ApiError(404, "Business not found");
    }

    await existingBusiness.update({
      status,
    });

    await ProductModel.update(
      {
        isActive: status === "active",
      },
      {
        where: {
          bid,
        },
      },
    );

    return res
      .status(200)
      .json(new ApiResponse(200, `Business status updated successfully`));
  } catch (error) {
    throw error;
  }
});

export const getAllBusiness = asyncHandler(async (req, res) => {
  try {
    const businesses = await BusinessModel.findAll({
      where: {
        userid: req.user?.userid,
      },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });
    return res.status(200).json(new ApiResponse(200, businesses || []));
  } catch (error) {
    throw error;
  }
});

/* ------------------------- Admin business API's -------------------------  */

export const getTotalBusiness = asyncHandler(async (req, res) => {
  try {
    const totalBusiness = await BusinessModel.findAll({
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });
    return res.status(200).json(new ApiResponse(200, totalBusiness));
  } catch (error) {
    throw error;
  }
});



/* ------------------ Business Onboard ------------------ */

export const addBasicInfo = asyncHandler(async (req, res) => {
  const { basicinfoid, bid, ownername, designation, mobile, whatsapp, email } =
    req.body;

  if (
    !bid ||
    !ownername?.trim() ||
    !designation?.trim() ||
    !mobile?.trim() ||
    !email?.trim()
  ) {
    throw new ApiError(400, "All required fields must be provided");
  }

  const mobileRegex = /^[0-9]{10}$/;
  if (!mobileRegex.test(mobile)) {
    throw new ApiError(400, "Invalid mobile number");
  }

  if (whatsapp && !mobileRegex.test(whatsapp)) {
    throw new ApiError(400, "Invalid WhatsApp number");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  let basicDetail;

  if (basicinfoid) {
    const existingRecord = await BasicInfoModel.findByPk(basicinfoid);

    if (!existingRecord) {
      throw new ApiError(404, "Basic info not found");
    }

    await existingRecord.update({
      bid,
      ownername: ownername.trim(),
      designation: designation.trim(),
      mobile,
      whatsapp,
      email: email.toLowerCase().trim(),
    });
    basicDetail = existingRecord;
  } else {
    basicDetail = await BasicInfoModel.create({
      bid,
      ownername: ownername.trim(),
      designation: designation.trim(),
      mobile,
      whatsapp,
      email: email.toLowerCase().trim(),
    });
  }

  if (!basicDetail) {
    throw new ApiError(500, "Basic info save failed");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        `Basic info ${basicinfoid ? "updated" : "created"} successfully`,
      ),
    );
});

export const getBasicInfo = asyncHandler(async (req, res) => {
  const { bid } = req.body;
  if (!bid) throw new ApiError(400, "Bid is required");

  const businessInfo = await BasicInfoModel.findOne({
    where: {
      bid: bid,
    },
  });

  return res.status(200).json(new ApiResponse(200, businessInfo ?? null));
});

/* ------------------ Business Info ------------------ */

export const addBusinessInfo = asyncHandler(async (req, res) => {
  const {
    businessinfoid,
    bid,
    businessname,
    legalbusinessname,
    description,
    opentime,
    closetime,
  } = req.body;

  if (
    !bid ||
    !businessname?.trim() ||
    !legalbusinessname?.trim() ||
    !description?.trim() ||
    !opentime ||
    !closetime
  ) {
    throw new ApiError(400, "All required fields must be provided");
  }

  let businessInfo;
  let isUpdate = false;

  if (businessinfoid) {
    const existingBusinessInfo = await BusinessInfoModel.findOne({
      where: { businessinfoid },
    });

    if (!existingBusinessInfo) {
      throw new ApiError(404, "Business info not found");
    }

    let imagePath = existingBusinessInfo.businessimage;

    if (req.file) {
      if (existingBusinessInfo.businessimage) {
        const oldPath = existingBusinessInfo.businessimage.startsWith("/")
          ? existingBusinessInfo.businessimage.slice(1)
          : existingBusinessInfo.businessimage;

        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      imagePath = `/${req.file.path.replace(/\\/g, "/")}`;
    }

    await existingBusinessInfo.update({
      bid,
      businessimage: imagePath,
      businessname: businessname.trim(),
      legalbusinessname: legalbusinessname.trim(),
      description: description.trim(),
      opentime,
      closetime,
    });

    businessInfo = existingBusinessInfo;
    isUpdate = true;
  } else {
    const alreadyExists = await BusinessInfoModel.findOne({
      where: { bid },
    });

    if (alreadyExists) {
      throw new ApiError(400, "Business info already exists for this business");
    }

    if (!req.file) {
      throw new ApiError(400, "Business image is required");
    }

    businessInfo = await BusinessInfoModel.create({
      bid,
      businessimage: `/${req.file.path.replace(/\\/g, "/")}`,
      businessname: businessname.trim(),
      legalbusinessname: legalbusinessname.trim(),
      description: description.trim(),
      opentime,
      closetime,
    });
  }

  if (!businessInfo) {
    throw new ApiError(500, "Business info save failed");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        `Business info ${isUpdate ? "updated" : "created"} successfully`,
        businessInfo,
      ),
    );
});

export const getBusinessInfo = asyncHandler(async (req, res) => {
  const { bid } = req.body;

  if (!bid) throw new ApiError(400, "Bid is required");

  const busiessInfo = await BusinessInfoModel.findOne({
    where: {
      bid,
    },
  });
  return res.status(200).json(new ApiResponse(200, busiessInfo ?? null));
});

/* ------------------ Address Info ------------------ */

export const addAddressInfo = asyncHandler(async (req, res) => {
  const {
    addressid,
    addressline,
    landmark,
    city,
    district,
    districtid,
    state,
    stateid,
    country,
    pincode,
    latitude,
    longitude,
    bid,
  } = req.body;

  if (
    !bid ||
    !addressline?.trim() ||
    !city?.trim() ||
    !district?.trim() ||
    !state?.trim() ||
    !country?.trim() ||
    !pincode?.toString().trim()
  ) {
    throw new ApiError(400, "Required fields are missing");
  }

  const pin = String(pincode).trim();

  if (!/^[1-9][0-9]{5}$/.test(pin)) {
    throw new ApiError(400, "Invalid pincode");
  }
  let address;
  if (addressid) {
    const existingAddress = await BusinessAddressModel.findByPk(addressid);
    if (!existingAddress) throw new ApiError(404, "Address not found");
    address = await existingAddress.update({
      addressline: addressline.trim(),
      landmark: landmark?.trim(),
      city: city.trim(),
      district: district.trim(),
      districtid,
      state: state.trim(),
      stateid,
      country: country.trim(),
      pincode,
      latitude,
      longitude,
      bid,
    });
  } else {
    const existingAddress = await BusinessAddressModel.findOne({
      where: { bid },
    });

    if (existingAddress)
      throw new ApiError(400, "Address already exists for this business");

    if (!req.body.latitude || !req.body.longitude)
      throw new ApiError(400, "Latitude and Longitude are required");

    address = await BusinessAddressModel.create({
      addressline: addressline.trim(),
      landmark: landmark?.trim(),
      city: city.trim(),
      district: district.trim(),
      districtid,
      state: state.trim(),
      stateid,
      country: country.trim(),
      pincode,
      latitude,
      longitude,
      bid,
    });
  }

  if (!address) throw new ApiError(500, "Address adding failed");

  return res
    .status(200)
    .json(new ApiResponse(200, "Address added successfully"));
});

export const getAddressInfo = asyncHandler(async (req, res) => {
  const { bid } = req.body;
  if (!bid) throw new ApiError(400, "Bid is required");

  const addressData = await BusinessAddressModel.findOne({
    where: { bid },
  });

  return res.status(200).json(new ApiResponse(200, addressData ?? null));
});

/* ------------------ KYC Info ------------------ */

export const addKyc = asyncHandler(async (req, res) => {
  const { bid, aadhaar, pan } = req.body;
  const files = req.files || {};

  try {
    const existingKyc = await KYCModel.findOne({ where: { bid } });
    if (existingKyc) {
      throw new ApiError(400, "KYC already exists for this business");
    }

    if (!bid || !aadhaar?.trim() || !pan?.trim()) {
      throw new ApiError(400, "Required fields are missing");
    }

    const aadhaarFrontPath = files?.aadhaarfront?.[0]?.path || null;
    const aadhaarBackPath = files?.aadhaarback?.[0]?.path || null;
    const panPicPath = files?.panpic?.[0]?.path || null;

    if (!aadhaarFrontPath || !aadhaarBackPath || !panPicPath) {
      throw new ApiError(400, "All KYC images are required");
    }

    const kycData = await KYCModel.create({
      bid,
      aadhaar: aadhaar.trim(),
      aadhaarfront: `/${aadhaarFrontPath.replace(/\\/g, "/")}`,
      aadhaarback: `/${aadhaarBackPath.replace(/\\/g, "/")}`,
      pan: pan.trim(),
      panpic: `/${panPicPath.replace(/\\/g, "/")}`,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "KYC added successfully", kycData));
  } catch (error) {
    Object.values(files)
      .flat()
      .forEach((file) => {
        if (file?.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    throw error;
  }
});

export const updateKyc = asyncHandler(async (req, res) => {
  const { bid, aadhaar, pan, kycid } = req.body;
  const files = req.files || {};

  try {
    if (!bid || !aadhaar?.trim() || !pan?.trim() || !kycid) {
      throw new ApiError(400, "Required fields are missing");
    }

    const existingKyc = await KYCModel.findOne({
      where: { bid, kycid },
    });

    if (!existingKyc) {
      throw new ApiError(404, "KYC not exists for this business");
    }

    const oldAadhaarFront = existingKyc.aadhaarfront;
    const oldAadhaarBack = existingKyc.aadhaarback;
    const oldPanPic = existingKyc.panpic;

    const newAadhaarFrontPath = files?.aadhaarfront?.[0]?.path;
    const newAadhaarBackPath = files?.aadhaarback?.[0]?.path;
    const newPanPicPath = files?.panpic?.[0]?.path;

    const aadhaarFrontPath = newAadhaarFrontPath
      ? `/${newAadhaarFrontPath.replace(/\\/g, "/")}`
      : oldAadhaarFront;

    const aadhaarBackPath = newAadhaarBackPath
      ? `/${newAadhaarBackPath.replace(/\\/g, "/")}`
      : oldAadhaarBack;

    const panPicPath = newPanPicPath
      ? `/${newPanPicPath.replace(/\\/g, "/")}`
      : oldPanPic;

    const kycData = await existingKyc.update({
      bid,
      aadhaar: aadhaar.trim(),
      aadhaarfront: aadhaarFrontPath,
      aadhaarback: aadhaarBackPath,
      pan: pan.trim(),
      panpic: panPicPath,
    });

    if (newAadhaarFrontPath && oldAadhaarFront) {
      const p = oldAadhaarFront.startsWith("/")
        ? oldAadhaarFront.slice(1)
        : oldAadhaarFront;
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    if (newAadhaarBackPath && oldAadhaarBack) {
      const p = oldAadhaarBack.startsWith("/")
        ? oldAadhaarBack.slice(1)
        : oldAadhaarBack;
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    if (newPanPicPath && oldPanPic) {
      const p = oldPanPic.startsWith("/") ? oldPanPic.slice(1) : oldPanPic;
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "KYC updated successfully", kycData));
  } catch (error) {
    Object.values(files)
      .flat()
      .forEach((file) => {
        if (file?.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    throw error;
  }
});

export const getKyc = asyncHandler(async (req, res) => {
  const { bid } = req.body;
  if (!bid) throw new ApiError(400, "Bid is required");

  const kycData = await KYCModel.findOne({
    where: {
      bid: bid,
    },
  });
  return res.status(200).json(new ApiResponse(200, kycData ?? null));
});

/* ------------------ Bank Info ------------------ */

export const addBank = asyncHandler(async (req, res) => {
  const { bid, accountholdername, accountnumber, bankname, branchname, ifsc } =
    req.body;
  const file = req.file;

  try {
    const existingBank = await BusinessBankModel.findOne({ where: { bid } });
    if (existingBank) {
      throw new ApiError(400, "Bank already exits this business");
    }

    if (!file) {
      throw new ApiError(400, "Passbook image is required");
    }

    if (
      !bid ||
      !accountholdername?.trim() ||
      !accountnumber ||
      !bankname?.trim() ||
      !branchname?.trim() ||
      !ifsc?.trim()
    ) {
      throw new ApiError(400, "All fields are required");
    }

    const bankData = await BusinessBankModel.create({
      bid,
      passbook: `/${file.path.replace(/\\/g, "/")}`,
      accountholdername: accountholdername.trim(),
      accountnumber,
      bankname: bankname.trim(),
      branchname: branchname.trim(),
      ifsc: ifsc.trim(),
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Bank data added successfully", bankData));
  } catch (error) {
    if (file && file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw error;
  }
});

export const updateBank = asyncHandler(async (req, res) => {
  const {
    bid,
    bankid,
    accountholdername,
    accountnumber,
    bankname,
    branchname,
    ifsc,
  } = req.body;
  const file = req.file;

  try {
    if (!bid || !bankid) {
      throw new ApiError(400, "Business ID and Bank ID are required");
    }

    const existingBank = await BusinessBankModel.findOne({
      where: { bid, bankid },
    });

    if (!existingBank) {
      throw new ApiError(404, "Bank details not found for this business");
    }

    const oldPassbook = existingBank.passbook;
    const newPassbookPath = file?.path;

    const passbook = newPassbookPath
      ? `/${newPassbookPath.replace(/\\/g, "/")}`
      : oldPassbook;

    const bankData = await existingBank.update({
      accountholdername:
        accountholdername?.trim() || existingBank.accountholdername,
      accountnumber: accountnumber || existingBank.accountnumber,
      bankname: bankname?.trim() || existingBank.bankname,
      branchname: branchname?.trim() || existingBank.branchname,
      ifsc: ifsc?.trim() || existingBank.ifsc,
      passbook,
    });

    if (newPassbookPath && oldPassbook) {
      const p = oldPassbook.startsWith("/")
        ? oldPassbook.slice(1)
        : oldPassbook;
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, "Bank details updated successfully", bankData),
      );
  } catch (error) {
    if (file && file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw error;
  }
});

export const getBankInfo = asyncHandler(async (req, res) => {
  const { bid } = req.body;
  if (!bid) throw new ApiError(400, "Bid is required");

  const bankData = await BusinessBankModel.findOne({
    where: { bid },
  });

  return res.status(200).json(new ApiResponse(200, bankData ?? null));
});
