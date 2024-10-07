const { object, string } = require("yup");
var _ = require("lodash");
const { v4: uuidv4 } = require("uuid");
const { UserHistory, User, Song, Artist, Album, Genre } = require("../../models/index");

module.exports = {
     getAllUserHistory: async (req, res) => {
          try {
               const userHistories = await UserHistory.findAll({
                    include: [
                         {
                              model: User,
                         },
                         {
                              model: Song,
                              include: [
                                   {
                                        model: Artist,
                                   },
                                   {
                                        model: Album,
                                   },
                                   {
                                        model: Genre,
                                   },
                              ],
                         },
                    ],
               });

               if (!userHistories.length) {
                    return res.status(404).json({
                         status: 404,
                         message: "Không tìm thấy lịch sử nghe nhạc",
                    });
               }

               res.status(200).json({
                    status: 200,
                    success: true,
                    message: "Lấy dữ liệu lịch sử nghe nhạc thành công",
                    data: userHistories,
               });
          } catch (error) {
               console.error("Lỗi khi lấy lịch sử nghe nhạc:", error);
               return res.status(500).json({
                    status: 500,
                    success: false,
                    message: "Lỗi khi lấy lịch sử nghe nhạc",
               });
          }
     },
};



