const { object, string } = require("yup");
var _ = require("lodash");
const { v4: uuidv4 } = require("uuid");
const songServices = require("../../services/song.services");
const albumServices = require("../../services/album.services");
const genreServices = require("../../services/genre.services");
const { UserHiddenSong, SongPart, User, PlaylistSong, UserFavorite, Song, Artist, Album, Genre, UserHistory, Sequelize } = require("../../models/index");
const { Op } = require("sequelize");
const playlistServices = require("../../services/playlist.services");
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

async function extractAudioFromVideo(inputPath, outputPath) {
     return new Promise((resolve, reject) => {
          ffmpeg(inputPath)
               .output(outputPath)
               .noVideo()
               .on('end', () => resolve(outputPath))
               .on('error', (err) => reject(err))
               .run();
     });
}

// Function to convert audio to HLS
async function convertAudioToHLS(inputPath, outputPath) {
     return new Promise((resolve, reject) => {
          const outputDir = path.dirname(outputPath);
          if (!fs.existsSync(outputDir)) {
               fs.mkdirSync(outputDir, { recursive: true });
          }

          ffmpeg(inputPath)
               .output(outputPath)
               .audioBitrate('128k') // Adjust audio quality as needed
               .outputOptions([
                    '-hls_time', '10', // Duration of each segment in seconds
                    '-hls_list_size', '0', // Include all segments in the playlist
                    '-hls_segment_filename', `${outputDir}/segment_%03d.ts`
               ])
               .on('end', () => resolve())
               .on('error', (err) => reject(err))
               .run();
     });
}
module.exports = {
     // handleCreate: async (req, res) => {
     //      const response = {};
     //      try {
     //           let songSchema = object({
     //                title: string()
     //                     .required("không được để trống tile")
     //           });
     //           const { albumId, genreId } = req.body;
     //           const album = await albumServices.findAlbumById(albumId);
     //           if (!album) {
     //                return res.status(400).json({
     //                     status: 400,
     //                     message: "không tồn tại albumId",
     //                });
     //           }
     //           const genre = await genreServices.findByPk(genreId);
     //           if (!genre) {
     //                return res.status(400).json({
     //                     status: 400,
     //                     message: "không tồn tại genrId",
     //                });
     //           }

     //           const body = await songSchema.validate(
     //                req.body,
     //                { abortEarly: false }
     //           );
     //           const { title, fileUrl, videoUrl, urlImage, duration, releaseDate, views, favorites, lyrics } = body;
     //           const song = await songServices.createSong({
     //                title,
     //                file_url: fileUrl,
     //                image_url: urlImage,
     //                video_url: videoUrl,
     //                duration,
     //                release_date: releaseDate,
     //                views,
     //                favorites,
     //                lyrics,
     //                album_id: albumId,
     //                genre_id: genreId,
     //                approved: false,

     //           });
     //           Object.assign(response, {
     //                status: 201,
     //                message: "error",
     //                song: song.dataValues,
     //           });
     //      } catch (e) {
     //           console.log(e);
     //           let errors = {};
     //           if (e?.inner) {
     //                errors = Object.fromEntries(
     //                     e.inner.map((item) => [item.path, item.message])
     //                );
     //           }
     //           Object.assign(response, {
     //                status: 400,
     //                message: "Yêu cầu không hợp lệ",
     //                errors: _.isEmpty(errors) ? e?.message : errors,
     //           });
     //      }
     //      return res.status(response.status).json(response);
     // },
     handleListenCount: async (req, res) => {
          try {
               // Lấy thông tin bài hát và số lượt nghe từ cơ sở dữ liệu
               const songs = await Song.findAll({ order: [['views', 'DESC']] });

               // Kiểm tra nếu không có bài hát nào
               if (!songs || songs.length === 0) {
                    return res.status(200).json({
                         status: 200,
                         success: true,
                         message: 'Không có bài hát nào.',
                         data: []
                    });
               }

               // Trả về kết quả dưới dạng JSON
               res.status(200).json({
                    status: 200,
                    success: true,
                    data: songs.map(song => ({
                         ...song,
                         songId: song.id,
                         songTitle: song.title,
                         listenCount: song?.views || 0, // Số lượt nghe, mặc định là 0 nếu không có giá trị
                    })),
               });
          } catch (error) {
               console.error('Lỗi khi lấy số lượt nghe:', error);
               return res.status(500).json({
                    status: 500,
                    success: false,
                    message: 'Lỗi khi lấy số lượt nghe bài hát',
               });
          }
     },
     handleCreate: async (req, res) => {
          const response = {};
          try {
               let songSchema = object({
                    title: string().required("không được để trống title")
               });

               const { albumId, genreId } = req.body;

               // Kiểm tra tồn tại album
               const album = await albumServices.findAlbumById(albumId);
               if (!album) {
                    return res.status(400).json({
                         status: 400,
                         message: "không tồn tại albumId",
                    });
               }

               // Kiểm tra tồn tại genre
               const genre = await genreServices.findByPk(genreId);
               if (!genre) {
                    return res.status(400).json({
                         status: 400,
                         message: "không tồn tại genreId",
                    });
               }

               // Validate dữ liệu đầu vào
               const body = await songSchema.validate(req.body, { abortEarly: false });
               const { title, fileUrl, videoUrl, urlImage, releaseDate, views, favorites, lyrics } = body;

               // Tạo bài nhạc
               const song = await songServices.createSong({
                    title,
                    file_url: fileUrl,
                    image_url: urlImage,
                    video_url: videoUrl,
                    release_date: releaseDate,
                    views: views || 0,
                    favorites: favorites || 0,
                    lyrics,
                    album_id: albumId,
                    genre_id: genreId,
                    approved: false,
               });
               Object.assign(response, {
                    status: 201,
                    message: "Bài nhạc đã được tạo và chuyển đổi thành HLS thành công.",
                    song: song.dataValues,
               });
          } catch (e) {
               console.error('Lỗi khi tạo bài nhạc:', e);
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
                    data: song.dataValues,
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

               const { title, fileUrl, videoUrl, urlImage, duration, releaseDate, views, favorites, lyrics } = body;

               // Find and update the song by ID
               const [updated] = await songServices.updateSong(songId, {
                    title,
                    file_url: fileUrl,
                    video_url: videoUrl,
                    duration,
                    image_url: urlImage || "",
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
               console.log(error);
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
          let { page, limit, keyword } = req.query;
          page = parseInt(page) || 1;
          limit = parseInt(limit) || 10;
          const offset = (page - 1) * limit;
          try {
               const whereCondition = {
               };
               if (keyword) {
                    whereCondition.title = {
                         [Op.iLike]: `%${keyword}%`
                    };
               }
               const { count, rows: songs } = await songServices.findSongAndCountAll({
                    where: whereCondition,
                    order: [['created_at', 'DESC']],
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
     handleGetAllPage: async (req, res) => {
          try {
               const songs = await Song.findAll({
                    include: [
                         {
                              model: Album,
                              include: [
                                   {
                                        model: Artist,
                                        include: [
                                             {
                                                  model: User

                                             }
                                        ]
                                   }
                              ],
                         },
                         {
                              model: Genre,
                         },

                    ],

               });

               if (!songs || songs.length === 0) {
                    return res.status(200).json({
                         status: 200,
                         success: true,
                         message: 'Không có bài hát nào',
                         data: []
                    });
               }

               return res.status(200).json({
                    status: 200,
                    success: true,
                    message: 'Danh sách tất cả các bài hát',
                    data: songs
               });
          } catch (error) {
               console.error('Lỗi khi lấy danh sách bài hát:', error);
               return res.status(500).json({
                    status: 500,
                    success: false,
                    message: 'Lỗi khi lấy danh sách bài hát',
               });
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
               if (!user) {
                    return res.status(404).json({
                         status: 404,
                         error: false,
                         message: 'Người dùng không tồn tại',
                    });
               }

               const hiddenSongs = await UserHiddenSong.findAll({
                    where: { user_id: userId },
                    attributes: ['song_id'],
               });

               // Tạo một danh sách các songId bị ẩn
               const hiddenSongIds = hiddenSongs.map(hidden => hidden.song_id);

               // Truy vấn bảng User_Favorites để lấy danh sách bài hát yêu thích, ngoại trừ các bài hát bị ẩn
               const favoriteSongs = await UserFavorite.findAll({
                    where: {
                         user_id: userId,
                         song_id: { [Op.notIn]: hiddenSongIds }, // Loại bỏ các bài hát bị ẩn
                    },
                    include: [
                         {
                              model: Song,
                              include: [
                                   {
                                        model: Album,
                                        include: [
                                             {
                                                  model: Artist,
                                                  include: [
                                                       {
                                                            model: User
                                                       }
                                                  ]
                                             }
                                        ]
                                   },
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
     handleCheckFavorite: async (req, res) => {
          const { userId, songId } = req.query;
          if (!userId || !songId) {
               return res.status(400).json({
                    success: false,
                    message: 'userId và songId là bắt buộc',
               });
          }

          try {
               const favorite = await UserFavorite.findOne({
                    where: {
                         user_id: userId,
                         song_id: songId,
                    },
               });

               if (favorite) {
                    return res.status(200).json({
                         success: true,
                         message: 'Bài hát đã được thả tym',
                         isFavorite: true,
                    });
               } else {
                    return res.status(200).json({
                         success: true,
                         message: 'Bài hát chưa được thả tym',
                         isFavorite: false,
                    });
               }
          } catch (error) {
               console.error('Lỗi khi kiểm tra bài hát yêu thích:', error);
               return res.status(500).json({
                    success: false,
                    message: 'Lỗi khi kiểm tra bài hát yêu thích',
                    isFavorite: false,
               });
          }
     },
     handleAddFavouriteSongs: async (req, res) => {
          try {
               const { userId, songId } = req.body;

               if (!userId || !songId) {
                    return res.status(400).json({
                         status: 400,
                         success: false,
                         message: 'userId và songId là bắt buộc',
                    });
               }

               const user = await User.findByPk(userId);
               if (!user) {
                    return res.status(404).json({
                         status: 404,
                         success: false,
                         message: 'Người dùng không tồn tại',
                    });
               }

               const song = await Song.findByPk(songId);
               if (!song) {
                    return res.status(404).json({
                         status: 404,
                         success: false,
                         message: 'Bài hát không tồn tại',
                    });
               }

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
               const favorite = await UserFavorite.create({
                    id: uuidv4(),
                    user_id: userId, song_id: songId
               });
               await Song.update(
                    { favorites: song.favorites + 1 },
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
     handleUnHideSongs: async (req, res) => {
          try {
               const { userId, songIds } = req.body;
               if (!userId || !songIds) {
                    return res.status(400).json({
                         status: 400,
                         success: false,
                         message: 'userId và songIds là bắt buộc',
                    });
               }
               const user = await User.findByPk(userId);
               if (!user) {
                    return res.status(404).json({
                         status: 404,
                         success: false,
                         message: 'Người dùng không tồn tại',
                    });
               }

               for (var songId of songIds) {
                    // Kiểm tra xem bài hát có tồn tại không
                    const song = await Song.findByPk(songId);
                    if (!song) {
                         return res.status(404).json({
                              status: 404,
                              success: false,
                              message: 'Bài hát không tồn tại',
                         });
                    }

                    // Kiểm tra xem bài hát có nằm trong danh sách bị ẩn không
                    const hiddenSong = await UserHiddenSong.findOne({
                         where: { user_id: userId, song_id: songId }
                    });

                    if (!hiddenSong) {
                         return res.status(400).json({
                              status: 400,
                              success: false,
                              message: 'Bài hát không nằm trong danh sách bị ẩn của người dùng',
                         });
                    }

                    // Xóa bài hát khỏi danh sách bị ẩn
                    await UserHiddenSong.destroy({
                         where: { user_id: userId, song_id: songId }
                    });
               }

               return res.status(200).json({
                    status: 200,
                    success: true,
                    message: 'Bài hát đã được xóa khỏi danh sách bị ẩn'
               });
          } catch (error) {
               console.error('Lỗi khi xóa bài hát khỏi danh sách bị ẩn:', error);
               return res.status(500).json({
                    status: 500,
                    success: false,
                    message: 'Lỗi khi xóa bài hát khỏi danh sách bị ẩn',
               });
          }
     },
     handleRemoveFavouriteSongs: async (req, res) => {
          try {
               const { userId, songId } = req.body;

               if (!userId || !songId) {
                    return res.status(400).json({
                         status: 400,
                         success: false,
                         message: 'userId và songId là bắt buộc',
                    });
               }

               const user = await User.findByPk(userId);
               if (!user) {
                    return res.status(404).json({
                         status: 404,
                         success: false,
                         message: 'Người dùng không tồn tại',
                    });
               }

               const song = await Song.findByPk(songId);
               if (!song) {
                    return res.status(404).json({
                         status: 404,
                         success: false,
                         message: 'Bài hát không tồn tại',
                    });
               }

               const favorite = await UserFavorite.findOne({
                    where: { user_id: userId, song_id: songId }
               });

               if (!favorite) {
                    return res.status(400).json({
                         status: 400,
                         success: false,
                         message: 'Bài hát không có trong danh sách yêu thích của người dùng',
                    });
               }

               await UserFavorite.destroy({
                    where: { user_id: userId, song_id: songId }
               });

               await Song.update(
                    { favorites: song.favorites > 0 ? song.favorites - 1 : 0 },
                    { where: { id: songId } }
               );

               return res.status(200).json({
                    status: 200,
                    success: true,
                    message: 'Bài hát đã được xóa khỏi danh sách yêu thích và cập nhật số lượt yêu thích'
               });
          } catch (error) {
               console.error('Lỗi khi xóa bài hát khỏi danh sách yêu thích:', error);
               return res.status(500).json({
                    status: 500,
                    success: false,
                    message: 'Lỗi khi xóa bài hát khỏi danh sách yêu thích',
               });
          }
     },
     handleGetHiddenSongs: async (req, res) => {
          try {
               const { userId } = req.query;

               if (!userId) {
                    return res.status(400).json({
                         status: 400,
                         success: false,
                         message: 'userId là bắt buộc',
                    });
               }

               const user = await User.findByPk(userId);
               if (!user) {
                    return res.status(404).json({
                         status: 404,
                         success: false,
                         message: 'Người dùng không tồn tại',
                    });
               }
               const hiddenSongs = await UserHiddenSong.findAll({
                    where: { user_id: userId },
                    include: [{
                         model: Song,
                         include: [

                              {
                                   model: Album, include: [
                                        {
                                             model: Artist, include: [
                                                  { model: Album }
                                             ]
                                        }
                                   ]
                              },
                              { model: Genre },

                         ]
                    }]
               });
               if (!hiddenSongs || hiddenSongs.length === 0) {
                    return res.status(200).json({
                         status: 200,
                         success: true,
                         message: 'Người dùng chưa có bài hát bị ẩn',
                         data: []
                    });
               }

               res.status(200).json({
                    status: 200,
                    success: true,
                    message: 'Danh sách các bài hát bị ẩn',
                    data: hiddenSongs
               });
          } catch (error) {
               console.error('Lỗi khi lấy danh sách bài hát bị ẩn:', error);
               return res.status(500).json({
                    status: 500,
                    success: false,
                    message: 'Lỗi khi lấy danh sách bài hát bị ẩn',
               });
          }
     },
     handleAddHideSong: async (req, res) => {
          try {
               const { userId, songId } = req.body;
               if (!userId || !songId) {
                    return res.status(400).json({
                         status: 400,
                         success: false,
                         message: 'userId và songId là bắt buộc',
                    });
               }
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

               // Kiểm tra xem bài hát đã được ẩn chưa
               const existingHiddenSong = await UserHiddenSong.findOne({
                    where: { user_id: userId, song_id: songId }
               });

               if (existingHiddenSong) {
                    return res.status(400).json({
                         status: 400,
                         success: false,
                         message: 'Bài hát đã được ẩn bởi người dùng',
                    });
               }

               // Thêm bài hát vào danh sách bị ẩn
               const hiddenSong = await UserHiddenSong.create({
                    id: uuidv4(),
                    user_id: userId,
                    song_id: songId,
               });

               return res.status(201).json({
                    status: 201,
                    success: true,
                    message: 'Bài hát đã được thêm vào danh sách bị ẩn',
                    data: hiddenSong
               });
          } catch (error) {
               console.error('Lỗi khi thêm bài hát vào danh sách bị ẩn:', error);
               return res.status(500).json({
                    status: 500,
                    success: false,
                    message: 'Lỗi khi thêm bài hát vào danh sách bị ẩn',
               });
          }
     },
     handleUnHideSong: async (req, res) => {
          try {
               const { userId, songId } = req.body;
               if (!userId || !songId) {
                    return res.status(400).json({
                         status: 400,
                         success: false,
                         message: 'userId và songId là bắt buộc',
                    });
               }
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

               // Kiểm tra xem bài hát có nằm trong danh sách bị ẩn không
               const hiddenSong = await UserHiddenSong.findOne({
                    where: { user_id: userId, song_id: songId }
               });

               if (!hiddenSong) {
                    return res.status(400).json({
                         status: 400,
                         success: false,
                         message: 'Bài hát không nằm trong danh sách bị ẩn của người dùng',
                    });
               }

               // Xóa bài hát khỏi danh sách bị ẩn
               await UserHiddenSong.destroy({
                    where: { user_id: userId, song_id: songId }
               });

               return res.status(200).json({
                    status: 200,
                    success: true,
                    message: 'Bài hát đã được xóa khỏi danh sách bị ẩn'
               });
          } catch (error) {
               console.error('Lỗi khi xóa bài hát khỏi danh sách bị ẩn:', error);
               return res.status(500).json({
                    status: 500,
                    success: false,
                    message: 'Lỗi khi xóa bài hát khỏi danh sách bị ẩn',
               });
          }
     },
     handleGetRecentlySongs: async (req, res) => {
          const { userId } = req.query;

          if (!userId) {
               return res.status(400).json({
                    success: false,
                    message: 'userId là bắt buộc',
               });
          }

          try {
               const recentlyPlayedSongs = await Song.findAll({
                    include: [
                         {
                              model: UserHistory,
                              where: { user_id: userId },
                              include: [
                                   {
                                        model: User,
                                        include: [
                                             {
                                                  model: Artist
                                             }]
                                   }
                              ]
                         },
                         { model: Artist },
                         { model: Album },
                         { model: Genre }
                    ],
                    order: [[UserHistory, 'updated_at', 'DESC']],

               });

               if (!recentlyPlayedSongs || recentlyPlayedSongs.length === 0) {
                    return res.status(200).json({
                         success: true,
                         message: 'Người dùng chưa nghe bài hát nào gần đây',
                         data: []
                    });
               }

               return res.status(200).json({
                    success: true,
                    message: 'Danh sách các bài hát gần đây mà người dùng đã nghe',
                    data: recentlyPlayedSongs
               });
          } catch (error) {
               console.error('Lỗi khi lấy danh sách bài hát gần đây:', error);
               return res.status(500).json({
                    success: false,
                    message: 'Lỗi khi lấy danh sách bài hát gần đây',
               });
          }
     },
     handlePlaySongs: async (req, res) => {
          const { userId, songId } = req.body;

          // Kiểm tra nếu userId hoặc songId không được cung cấp
          if (!userId || !songId) {
               return res.status(400).json({
                    status: 400,
                    success: false,
                    message: 'userId và songId là bắt buộc',
               });
          }

          try {
               // Kiểm tra xem bài hát có tồn tại hay không
               const song = await Song.findByPk(songId);
               if (!song) {
                    return res.status(404).json({
                         status: 404,
                         success: false,
                         message: 'Bài hát không tồn tại',
                    });
               }

               // Kiểm tra xem bản ghi đã có trong bảng UserHistory chưa
               let history = await UserHistory.findOne({
                    where: { user_id: userId, song_id: songId },
               });

               if (history) {
                    // Nếu bản ghi đã tồn tại, cập nhật thời gian nghe gần nhất (updatedAt)
                    await history.update({ updated_at: new Date() });
               } else {
                    // Nếu bản ghi chưa tồn tại, thêm mới vào bảng UserHistory
                    history = await UserHistory.create({
                         id: uuidv4(),
                         user_id: userId,
                         song_id: songId,
                    });
               }
               // Tăng số lượt view của bài hát
               await song.update({ views: song.views + 1 });

               return res.status(200).json({
                    status: 200,
                    success: true,
                    message: 'Bài hát đã được thêm vào danh sách nghe gần đây',
                    data: history,
               });
          } catch (error) {
               console.error('Lỗi khi thêm bài hát vào danh sách nghe gần đây:', error);
               return res.status(500).json({
                    status: 500,
                    success: false,
                    message: 'Lỗi khi thêm bài hát vào danh sách nghe gần đây',
               });
          }
     },
     handleSongForYou: async (req, res) => {
          const { userId } = req.query;
          if (!userId) {
               return res.status(400).json({
                    success: false,
                    message: 'userId là bắt buộc',
               });
          }

          try {
               const userHistory = await UserHistory.findAll({
                    where: { user_id: userId },
                    include: {
                         model: Song,
                    }
               });

               if (!userHistory.length) {
                    return res.status(200).json({
                         success: true,
                         message: 'Người dùng chưa nghe bài hát nào',
                         data: [],
                    });
               }

               // Tính toán số lần nghe mỗi thể loại
               const genreCount = {};
               userHistory.forEach(history => {
                    const genreId = history.Song.genre_id;
                    if (genreId) {
                         genreCount[genreId] = (genreCount[genreId] || 0) + 1;
                    }
               });

               const mostListenedGenreId = Object.keys(genreCount).reduce((a, b) => genreCount[a] > genreCount[b] ? a : b);

               const mostListenedGenre = await Genre.findByPk(mostListenedGenreId);

               if (!mostListenedGenre) {
                    return res.status(404).json({
                         success: false,
                         message: 'Không tìm thấy thể loại yêu thích của người dùng',
                    });
               }

               const recommendedSongs = await Song.findAll({
                    where: { genre_id: mostListenedGenreId },
                    attributes: ['id', 'title', 'file_url', 'views', 'favorites'], // Lấy thêm views và favorites
                    include: [
                         {
                              model: Genre,
                         },

                    ],
                    order: [
                         ['views', 'DESC'],       // Sắp xếp theo lượt xem giảm dần
                         ['favorites', 'DESC'],   // Sắp xếp theo lượt yêu thích giảm dần
                    ]
               });

               return res.status(200).json({
                    success: true,
                    message: 'Danh sách bài hát dành cho bạn',
                    data: {
                         genre: mostListenedGenre.name,
                         songs: recommendedSongs,
                    },
               });

          } catch (error) {
               console.error('Lỗi khi lấy bài hát dành cho bạn:', error);
               return res.status(500).json({
                    success: false,
                    message: 'Lỗi khi lấy bài hát dành cho bạn',
               });
          }
     },
     handleExplore: async (req, res) => {
          try {
               const { userId } = req.query;
               if (!userId) {
                    return res.status(400).json({
                         success: false,
                         message: 'userId là bắt buộc',
                    });
               }
               let recommendedSongs = [];
               const genreCount = {};
               const userHistory = await UserHistory.findAll({
                    where: { user_id: userId },
                    include: {
                         model: Song,
                    }
               });

               if (!userHistory.length) {
                    recommendedSongs = await Song.findAll({
                         limit: 10,
                         include: [{
                              model: UserFavorite,
                              where: { user_id: userId },
                         }, {
                              model: Genre
                         }, {
                              model: Album,
                              include: [
                                   {
                                        model: Artist,
                                        include: [
                                             { model: User }
                                        ]
                                   }
                              ]
                         }],
                    });
               } else {

                    userHistory.forEach(history => {
                         const genreId = history.Song.genre_id;
                         if (genreId) {
                              genreCount[genreId] = (genreCount[genreId] || 0) + 1;
                         }
                    });
                    if (Object.keys(genreCount).length === 0) {
                         return res.status(404).json({
                              success: false,
                              message: 'Không tìm thấy thể loại yêu thích của người dùng',
                         });
                    }
                    const mostListenedGenreId = Object.keys(genreCount).reduce((a, b) => genreCount[a] > genreCount[b] ? a : b);

                    const mostListenedGenre = await Genre.findByPk(mostListenedGenreId);

                    if (!mostListenedGenre) {
                         return res.status(404).json({
                              success: false,
                              message: 'Không tìm thấy thể loại yêu thích của người dùng',
                         });
                    }
                    recommendedSongs = await Song.findAll({
                         where: { genre_id: mostListenedGenreId },
                         include: [{
                              model: Genre,
                         }, {
                              model: Album,
                              include: [
                                   {
                                        model: Artist,
                                        include: [
                                             { model: User }
                                        ]
                                   }
                              ]
                         }],
                         order: [
                              ['views', 'DESC'],
                              ['favorites', 'DESC'],
                         ]
                    });
               }
               const condition = userId ? { where: { user_id: userId } } : {};
               const playlists = await playlistServices.findPlayListAll({
                    ...condition,
                    order: [['updated_at', 'DESC']],
                    include: [
                         {
                              model: PlaylistSong,
                              include: [
                                   {
                                        model: Song,
                                        include: [

                                             {
                                                  model: Album, include: [
                                                       {
                                                            model: Artist,
                                                            include: [
                                                                 { model: User }
                                                            ]
                                                       }
                                                  ]
                                             },
                                             { model: Genre },
                                             {
                                                  model: SongPart
                                             }
                                        ],
                                   },
                              ],
                         },
                    ],
               });
               userHistory.forEach(history => {
                    const genreId = history.Song.genre_id;
                    genreCount[genreId] = (genreCount[genreId] || 0) + 1;
               });

               const sortedGenreIds = Object.keys(genreCount)
                    .sort((a, b) => genreCount[b] - genreCount[a])
                    .slice(0, 3);

               const wantToListen = await Genre.findAll({
                    where: {
                         id: sortedGenreIds,
                    },
                    attributes: ['id', 'name'],
               });
               const ablum = await Album.findAll({
                    include: [{
                         model: Song,
                    }]
               });
               const genres = await Genre.findAll({
                    include: [
                         {
                              model: Song,
                              include: [
                                   {
                                        model: Album,
                                   },
                              ],
                         },
                    ],
               });
               const genresWithAlbums = genres.map((genre) => {
                    const albumsGrouped = genre.Songs.reduce((acc, song) => {
                         const albumId = song.Album.id;
                         if (!acc[albumId]) {
                              acc[albumId] = {
                                   album: song.Album, // Thông tin album
                                   songs: [],
                              };
                         }

                         // Thêm bài hát vào album đã có
                         acc[albumId].songs.push(song);
                         return acc;
                    }, {});

                    // Chuyển đối tượng albumsGrouped thành mảng, gán vào từng thể loại
                    return {
                         ...genre.toJSON(),
                         albums: Object.values(albumsGrouped),
                    };
               });
               return res.status(200).json({
                    success: true,
                    message: "Khám phá dữ liệu đã được lấy thành công",
                    data: {
                         songForYou: recommendedSongs,
                         listenRecently: playlists,
                         category: genresWithAlbums,
                         wantToListen,
                         ablum
                    },
               });

          } catch (e) {
               console.error('Lỗi khi lấy dữ liệu explore:', e);
               return res.status(500).json({
                    success: false,
                    message: "Lỗi khi lấy dữ liệu explore",
               });
          }
     },
     getTrendingSongs: async (req, res) => {
          try {
               const trendingSongs = await Song.findAll({
                    attributes: [
                         'id',
                         'title',
                         'artist_id',
                         'views',
                         'favorites',
                         [Sequelize.literal('(0.7 * COALESCE(views, 0) + 0.3 * COALESCE(favorites, 0))'), 'calculatedTrendingScore'] // Tính điểm thịnh hành
                    ],
                    order: [
                         [Sequelize.literal('(0.7 * COALESCE(views, 0) + 0.3 * COALESCE(favorites, 0))'), 'DESC'] // Sắp xếp theo điểm thịnh hành từ cao xuống thấp
                    ],
                    include: [
                         {
                              model: Artist,
                         },
                         {
                              model: Album,
                         },
                         {
                              model: Genre,
                         }
                    ],
                    limit: 10,
               });
               return res.status(200).json({
                    success: true,
                    message: 'Danh sách các bài hát thịnh hành',
                    data: trendingSongs,
               });
          } catch (error) {
               console.error('Lỗi khi lấy danh sách bài hát thịnh hành:', error);
               return res.status(500).json({
                    success: false,
                    message: 'Lỗi khi lấy danh sách bài hát thịnh hành',
               });
          }
     },




};
