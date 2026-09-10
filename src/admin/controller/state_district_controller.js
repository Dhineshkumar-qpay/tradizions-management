import { sequelize } from "../../../connection.js";
import { DistrictModel, StateModel } from "../../model/district_state_model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const addState = asyncHandler(async (req, res) => {
  const { state } = req.body;

  if (!state) throw new ApiError(400, "State is required");

  const stateData = await StateModel.create({
    state,
  });

  if (!stateData) throw new ApiError(500, "State creation failed");

  return res
    .status(200)
    .json(new ApiResponse(200, "State addedd successfully"));
});

export const getState = asyncHandler(async (req, res) => {
  const states = await StateModel.findAll();
  return res.status(200).json(new ApiResponse(200, states || []));
});

export const addDistrict = asyncHandler(async (req, res) => {
  const { district, stateid } = req.body;

  if (!district || !stateid)
    throw new ApiError(400, "District and stateid are required");

  const districtData = await DistrictModel.create({
    district,
    stateid,
  });

  if (!districtData) throw new ApiError(500, "District creation failed");

  return res.status(200).json(new ApiResponse(200, "District addedd successfully"));
});

export const getDistricts = asyncHandler(async (req, res) => {
  const { stateid } = req.body;
  const districts = await DistrictModel.findAll({
    where: {
      stateid,
    },
  });
  return res.status(200).json(new ApiResponse(200, districts || []));
});
