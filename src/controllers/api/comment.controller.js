const { object, string } = require("yup");
var _ = require("lodash");
const { v4: uuidv4 } = require("uuid");
const { UserHiddenSong, SongPart, User, Comment, PlaylistSong, UserFavorite, Song, Artist, Album, Genre, UserHistory } = require("../../models/index");
const { Op, Sequelize } = require("sequelize");
module.exports = {
     handleAdd: async (req, res) => {
          const { userId, songId, content } = req.body;
          if (!userId || !songId || !content) {
               return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
          }

          try {
               const newComment = await Comment.create({
                    id: uuidv4(),
                    user_id: userId,
                    song_id: songId,
                    content: content,
               });

               return res.status(201).json({
                    success: true,
                    message: 'Bình luận đã được thêm thành công',
                    data: newComment,
               });
          } catch (error) {
               console.error('Lỗi khi thêm bình luận:', error);
               return res.status(500).json({
                    success: false,
                    message: 'Lỗi khi thêm bình luận',
               });
          }
     },
     handleGetSongDetail: async (req, res) => {
          const { id } = req.params;
          try {
               const comments = await Comment.findAll({
                    where: { song_id: id },
                    include: [
                         {
                              model: User,
                         },
                    ],
                    order: [['created_at', 'DESC']],
               });

               return res.status(200).json({
                    success: true,
                    message: 'Lấy danh sách bình luận thành công',
                    data: comments,
               });
          } catch (error) {
               console.error('Lỗi khi lấy danh sách bình luận:', error);
               return res.status(500).json({
                    success: false,
                    message: 'Lỗi khi lấy danh sách bình luận',
               });
          }
     }
};
