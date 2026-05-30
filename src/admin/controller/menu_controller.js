import { Op } from "sequelize";
import { AdminMenuPermissions, MenuModel } from "../../model/menu_model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AuthModel } from "../../model/auth_model.js";

export const addMenu = asyncHandler(async (req, res) => {
  try {
    const { menuname, menukey, icon, parentid } = req.body;
    if (!menuname) throw new ApiError(400, "Menuname is required");
    if (!menukey) throw new ApiError(400, "Menukey is required");

    const existingMenu = await MenuModel.findOne({
      where: {
        [Op.or]: [{ menukey: menukey }, { menuname: menuname }],
      },
    });

    if (existingMenu) throw new ApiError(400, "Menu already exists");

    const menu = await MenuModel.create({
      menuname,
      menukey,
      icon,
      parentid,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Menu created successfully"));
  } catch (error) {
    throw error;
  }
});

export const getAllMenus = asyncHandler(async (req, res) => {
  try {
    const menus = await MenuModel.findAll({ raw: true });

    const mainMenus = menus.filter((menu) => menu.parentid === null);

    const updatedMenus = mainMenus.map((menu) => {
      const children = menus.filter((child) => child.parentid === menu.menuid);

      return {
        menuid: menu.menuid,
        menuname: menu.menuname,
        icon: menu.icon,
        menukey: menu.menukey,
        parentid: menu.parentid,
        status: menu.status,
        children,
      };
    });

    return res.status(200).json(new ApiResponse(200, updatedMenus));
  } catch (error) {
    throw error;
  }
});

export const updateMenu = asyncHandler(async (req, res) => {
  try {
    const { menuid, menuname, menukey, icon, parentid, status } = req.body;

    const menu = await MenuModel.findByPk(menuid);

    if (!menu) throw new ApiError(404, "Menu not found");

    await menu.update({
      menuname: menuname || menu.menuname,
      menukey: menukey || menu.menukey,
      icon: icon || menu.icon,
      parentid: parentid === "" ? null : parentid || menu.parentid,
      status: status !== undefined ? status : menu.status,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Menu updated successfully"));
  } catch (error) {
    throw error;
  }
});

export const getAllMerchantMenus = asyncHandler(async (req, res) => {
  try {
    const userid = req.user?.userid;

    if (!userid) {
      throw new ApiError(401, "Unauthorized");
    }

    // Check user
    const user = await AuthModel.findByPk(userid);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Fetch assigned permissions
    const userPermissions = await AdminMenuPermissions.findAll({
      where: { userid },
      raw: true,
    });

    const assignedMenuIds = userPermissions.map(
      (permission) => permission.menuid
    );

    let assignedMenus = [];

    if (assignedMenuIds.length > 0) {

      // Fetch assigned menus
      const menus = await MenuModel.findAll({
        where: {
          menuid: {
            [Op.in]: assignedMenuIds,
          },
          status: "active",
        },
        order: [["menuid", "ASC"]],
        raw: true,
      });

      // Main menus
      const mainMenus = menus.filter(
        (menu) =>
          menu.parentid === 0 || menu.parentid === null
      );

      // Nested menu structure
      assignedMenus = mainMenus.map((menu) => ({
        menuid: menu.menuid,
        menuname: menu.menuname,
        icon: menu.icon,
        menukey: menu.menukey,
        path: menu.path,
        parentid: menu.parentid,
        status: menu.status,

        children: menus.filter(
          (child) => child.parentid === menu.menuid
        ),
      }));
    }

    return res.status(200).json(
      new ApiResponse(200, {
        assignedmenus: assignedMenus,
      })
    );

  } catch (error) {
    throw error;
  }
});