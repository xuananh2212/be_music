const { object, string } = require("yup");
var _ = require("lodash");
const { v4: uuidv4 } = require("uuid");
const songServices = require("../../services/song.services");
const albumServices = require("../../services/album.services");
const genreServices = require("../../services/genre.services");
const { UserHiddenSong, User, UserFavorite, Song, Artist, Album, Genre } = require("../../models/index");
const { Op } = require("sequelize");
module.exports = {
     handleCreate: async (req, res) => {
          const response = {};
          try {
               let songSchema = object({
                    title: string()
                         .required("không được để trống tile")
               });
               const { albumId, genreId } = req.body;
               const album = await albumServices.findAlbumById(albumId);
               if (!album) {
                    return res.status(400).json({
                         status: 400,
                         message: "không tồn tại albumId",
                    });
               }
               const genre = await genreServices.findByPk(genreId);
               if (!genre) {
                    return res.status(400).json({
                         status: 400,
                         message: "không tồn tại genrId",
                    });
               }

               const body = await songSchema.validate(
                    req.body,
                    { abortEarly: false }
               );
               const { title, fileUrl, videoUrl, urlImage, duration, releaseDate, views, favorites, lyrics } = body;
               const song = await songServices.createSong({
                    title,
                    file_url: fileUrl,
                    image_url: urlImage,
                    video_url: videoUrl,
                    duration,
                    release_date: releaseDate,
                    views,
                    favorites,
                    lyrics,
                    album_id: albumId,
                    genre_id: genreId,
                    approved: false,

               });
               Object.assign(response, {
                    status: 201,
                    message: "error",
                    song: song.dataValues,
               });
          } catch (e) {
               console.log(e);
               let errors = {};
               if (e?.inner) {
                    errors = Object.fromEntries(
                         e.inner.map((item) => [item.path, item.message])
                    );
               }
               Object.assign(response, {
                    status: 400,
                    message: "Yêu cầu không hợp lệ",
                    errors: _.isEmpty(errors) ? e?.message : errors,
               });
          }
          return res.status(response.status).json(response);
     },
     handleGetDetail: async (req, res) => {
          const response = {};
          try {
               const songId = req.params.id;
               const song = await songServices.findSongById(songId, {
                    include: [{
                         model: Album,
                    }, {
                         model: Genre,
                    }]
               });

               if (!song) {
                    Object.assign(response, {
                         status: 404,
                         message: "Song không tồn tại!",
                    });
                    return res.status(response.status).json(response);
               }

               Object.assign(response, {
                    status: 200,
                    message: "Thành công",
                    song: song.dataValues,
               });
          } catch (error) {
               Object.assign(response, {
                    status: 500,
                    message: "Có lỗi xảy ra khi lấy thông tin bài hát",
                    error: error.message,
               });
          }
          return res.status(response.status).json(response);
     },
     handleUpdate: async (req, res) => {
          const response = {};
          const songId = req.params.id;
          try {
               let songSchema = object({
                    title: string().required("Không được để trống title"),
               });

               const body = await songSchema.validate(req.body, { abortEarly: false });

               const { title, fileUrl, videoUrl, duration, releaseDate, views, favorites, lyrics } = body;

               // Find and update the song by ID
               const [updated] = await songServices.updateSong(songId, {
                    title,
                    file_url: fileUrl,
                    video_url: videoUrl,
                    duration,
                    release_date: releaseDate,
                    views,
                    favorites,
                    lyrics,
                    approved: true
               });

               if (updated) {
                    const updatedSong = await songServices.findSongById(songId);
                    Object.assign(response, {
                         status: 200,
                         message: "Song cập nhật thành công",
                         song: updatedSong.dataValues,
                    });
               } else {
                    Object.assign(response, {
                         status: 404,
                         message: "Song không tồn tại",
                    });
               }
          } catch (error) {
               let errors = {};
               if (error?.inner) {
                    errors = Object.fromEntries(
                         error.inner.map((item) => [item.path, item.message])
                    );
               }
               Object.assign(response, {
                    status: 400,
                    message: "Yêu cầu không hợp lệ",
                    errors: _.isEmpty(errors) ? error?.message : errors,
               });
          }
          return res.status(response.status).json(response);
     },
     handleDelete: async (req, res) => {
          const response = {};
          const songId = req.params.id;
          try {
               const deleted = await songServices.deleteSong(songId);

               if (deleted) {
                    Object.assign(response, {
                         status: 200,
                         message: "Xóa bài hát thành công",
                    });
               } else {
                    Object.assign(response, {
                         status: 404,
                         message: "Song không tồn tại",
                    });
               }
          } catch (error) {
               Object.assign(response, {
                    status: 500,
                    message: "Có lỗi xảy ra khi xóa bài hát",
                    error: error.message,
               });
          }
          return res.status(response.status).json(response);
     },
     handleGetAll: async (req, res) => {
          let { page, limit } = req.query;
          page = parseInt(page) || 1;
          limit = parseInt(limit) || 10;
          const offset = (page - 1) * limit;
          try {
               const { count, rows: songs } = await songServices.findSongAndCountAll({
                    limit: limit,
                    offset: offset,
               });

               const totalPages = Math.ceil(count / limit);

               res.json({
                    data: songs,
                    meta: {
                         totalItems: count,
                         currentPage: page,
                         totalPages: totalPages,
                         pageSize: limit
                    }
               });
          } catch (error) {
               console.log(error);
               res.status(500).json({ message: 'Error fetching songs', error });
          }
     },
     handleGetFavouriteSongs: async (req, res) => {
          try {
               const { userId } = req.query;
               if (!userId) {
                    return res.status(400).json({
                         status: 400,
                         error: false,
                         message: 'userId là bắt buộc',
                    });
               }
               const user = await User.findByPk(userId);
               console.log("user", user)
               if (!user) {
                    return res.status(404).json({
                         status: 404,
                         error: false,
                         message: 'Người dùng không tồn tại',
                    });
               }

               const hiddenSongs = await UserHiddenSong.findAll({
                    where: { userId: userId },
                    attributes: ['songId'],
               });

               // Tạo một danh sách các songId bị ẩn
               const hiddenSongIds = hiddenSongs.map(hidden => hidden.songId);

               // Truy vấn bảng User_Favorites để lấy danh sách bài hát yêu thích, ngoại trừ các bài hát bị ẩn
               const favoriteSongs = await UserFavorite.findAll({
                    where: {
                         userId: userId,
                         songId: { [Op.notIn]: hiddenSongIds }, // Loại bỏ các bài hát bị ẩn
                    },
                    include: [
                         {
                              model: Song,
                              include: [
                                   { model: Artist },
                                   { model: Album },
                                   { model: Genre },
                              ],
                         },
                    ],
               });

               // Nếu không có bài hát yêu thích nào
               if (!favoriteSongs || favoriteSongs.length === 0) {
                    return res.status(200).json({
                         status: 200,
                         error: true,
                         message: 'Người dùng chưa có bài hát yêu thích',
                         data: [],
                    });
               }

               // Trả về danh sách các bài hát yêu thích (không bao gồm các bài hát bị ẩn)
               res.status(200).json({
                    status: 200,
                    error: true,
                    message: 'Danh sách các bài hát yêu thích',
                    data: favoriteSongs.map(favorite => ({
                         favorite_id: favorite.favorite_id,
                         added_at: favorite.added_at,
                         song: favorite.Song, // Thông tin bài hát
                    })),
               });
          } catch (error) {
               console.error('Lỗi khi lấy danh sách bài hát yêu thích:', error);
               res.status(500).json({
                    status: 500,
                    error: false,
                    message: 'Lỗi khi lấy danh sách bài hát yêu thích',
               });
          }

     },
     handleAddFavouriteSongs: async (req, res) => {
          try {
               const { userId, songId } = req.body;

               // Kiểm tra xem userId và songId có được cung cấp không
               if (!userId || !songId) {
                    return res.status(400).json({
                         status: 400,
                         success: false,
                         message: 'userId và songId là bắt buộc',
                    });
               }

               // Kiểm tra xem người dùng có tồn tại không
               const user = await User.findByPk(userId);
               if (!user) {
                    return res.status(404).json({
                         status: 404,
                         success: false,
                         message: 'Người dùng không tồn tại',
                    });
               }

               // Kiểm tra xem bài hát có tồn tại không
               const song = await Song.findByPk(songId);
               if (!song) {
                    return res.status(404).json({
                         status: 404,
                         success: false,
                         message: 'Bài hát không tồn tại',
                    });
               }

               // Kiểm tra xem bài hát đã được thêm vào danh sách yêu thích chưa
               const existingFavorite = await UserFavorite.findOne({
                    where: { user_id: userId, song_id: songId }
               });

               if (existingFavorite) {
                    return res.status(400).json({
                         status: 400,
                         success: false,
                         message: 'Bài hát đã có trong danh sách yêu thích của người dùng',
                    });
               }

               // Thêm bài hát vào danh sách yêu thích của người dùng
               const favorite = await UserFavorite.create({
                    id: uuidv4(),
                    user_id: userId, song_id: songId
               });

               // Cập nhật trường favorites trong bảng Song
               await Song.update(
                    { favorites: song.favorites + 1 }, // Tăng giá trị của favorites lên 1
                    { where: { id: songId } }
               );

               return res.status(201).json({
                    success: true,
                    message: 'Bài hát đã được thêm vào danh sách yêu thích và cập nhật số lượt yêu thích',
                    data: favorite
               });
          } catch (error) {

               console.error('Lỗi khi thêm bài hát vào danh sách yêu thích:', error);
               return res.status(500).json({
                    success: false,
                    message: 'Lỗi khi thêm bài hát vào danh sách yêu thích',
               });
          }
     },
     handleRemoveFavouriteSongs: async (req, res) => {

     }



};
