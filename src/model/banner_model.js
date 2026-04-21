import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../connection.js";

class BannerModel extends Model { }

BannerModel.init(
    {
        bannerid: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        bannername: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        bannerimage: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: "banners",
        modelName: "BannerModel",
        timestamps: true,
    },
);

export { BannerModel };
