const { object, string } = require("yup");
var _ = require("lodash");
const { v4: uuidv4 } = require("uuid");
const { UserHistory, User, Song, Artist, Album, Genre } = require("../../models/index");

module.exports = {
     getAllUserHistory: async (req, res) => {
          try {
               // Truy vấn lịch sử nghe nhạc
               const userHistories = await UserHistory.findAll({
                    include: [
                         {
                              model: User, // Liên kết với bảng User
                         },
                         {
                              model: Song, // Liên kết với bảng Song
                              include: [
                                   {
                                        model: Artist, // Liên kết với bảng Artist
                                   },
                                   {
                                        model: Album, // Liên kết với bảng Album
                                   },
                                   {
                                        model: Genre, // Liên kết với bảng Genre
                                   },
                              ],
                         },
                    ],
               });

               // Nếu không có dữ liệu lịch sử
               if (!userHistories.length) {
                    return res.status(404).json({
                         status: 404,
                         message: "Không tìm thấy lịch sử nghe nhạc",
                    });
               }

               // Trả về dữ liệu cho client
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



