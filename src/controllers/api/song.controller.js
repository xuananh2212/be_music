const { object, string } = require("yup");
var _ = require("lodash");
const { v4: uuidv4 } = require("uuid");
const songServices = require("../../services/song.services");
const albumServices = require("../../services/album.services");
const genreServices = require("../../services/genre.services");
const { UserHiddenSong, SongPart, User, PlaylistSong, UserFavorite, Song, Artist, Album, Genre, UserHistory } = require("../../models/index");
const { Op } = require("sequelize");
const playlistServices = require("../../services/playlist.services");
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

// Hàm tính toán tổng thời gian (duration) của file video hoặc âm thanh
// Hàm tính tổng thời gian của file âm thanh hoặc video
async function getFileDuration(filePath) {
     return new Promise((resolve, reject) => {
          ffmpeg.ffprobe(filePath, (err, metadata) => {
               if (err) {
                    return reject(err);
               }
               const duration = metadata.format.duration;
               resolve(duration); // Trả về tổng thời gian của file
          });
     });
}

// Hàm trích xuất âm thanh từ video
async function extractAudioFromVideo(inputVideoPath, outputAudioPath) {
     return new Promise((resolve, reject) => {
          ffmpeg(inputVideoPath)
               .output(outputAudioPath)
               .audioCodec('libmp3lame') // Chuyển đổi sang mp3
               .on('end', () => {
                    resolve(outputAudioPath); // Trả về đường dẫn file âm thanh
               })
               .on('error', (err) => {
                    console.error('Lỗi khi trích xuất âm thanh từ video:', err.message);
                    reject(err);
               })
               .run();
     });
}

// Hàm xử lý tách file thành các phần nhỏ
async function splitAudioIntoParts(audioPath, segmentDuration) {
     const outputDir = "src/uploads/parts";
     if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
     }
     const uniqueId = uuidv4();
     const parts = [];

     // Lấy tổng thời gian (duration) của file âm thanh
     const totalDuration = await getFileDuration(audioPath);

     // Tách file âm thanh thành các phần nhỏ với thời lượng xác định
     return new Promise((resolve, reject) => {
          ffmpeg(audioPath)
               .output(`${outputDir}/${uniqueId}_output%03d.mp3`) // Tạo các file output
               .format('mp3')
               .outputOptions([
                    '-f', 'segment',
                    '-segment_time', segmentDuration, // Thời lượng của mỗi đoạn
                    '-reset_timestamps', '1'
               ])
               .on('end', () => {
                    // Đọc thư mục để lấy danh sách file
                    fs.readdir(outputDir, (err, files) => {
                         if (err) {
                              reject(err);
                         } else {
                              const filteredFiles = files.filter(file => file.startsWith(uniqueId));
                              filteredFiles.forEach((file, index) => {
                                   const startTime = index * segmentDuration;
                                   const endTime = Math.min((index + 1) * segmentDuration, totalDuration);
                                   parts.push({
                                        file_path: `/uploads/parts/${file}`,
                                        start_time: startTime,
                                        end_time: endTime
                                   });
                              });
                              resolve(parts);
                         }
                    });
               })
               .on('error', (err) => {
                    console.error('Lỗi khi tách âm thanh thành các phần:', err.message);
                    reject(err);
               })
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


               if (song) {
                    const segmentDuration = 30;
                    let audioPath = fileUrl;

                    // Kiểm tra định dạng file
                    const fileExtension = path?.extname(fileUrl)?.toLowerCase();
                    if (fileExtension === '.mp4' || fileExtension === '.mkv') {
                         const audioFilePath = `src/uploads/audio/${uuidv4()}.mp3`;
                         audioPath = await extractAudioFromVideo(fileUrl, audioFilePath);
                    }
                    const totalDuration = await getFileDuration(audioPath);
                    song.duration = totalDuration;
                    await song.save();
                    // Tách file nhạc thành các phần nhỏ
                    const parts = await splitAudioIntoParts(audioPath, segmentDuration);
                    console.log("parts", parts)
                    console.log("haha", parts?.map(part => ({ id: uuidv4(), ...part })))
                    // Lưu các phần vào bảng SongPart
                    // await SongPart.bulkCreate(parts.map(part => ({
                    //      id: uuidv4(),
                    //      file_path: part.file_path,
                    //      start_time: part.start_time,
                    //      end_time: part.end_time,
                    //      song_id: song.id,
                    // })));
                    for (const part of parts) {
                         await SongPart.create({
                              id: uuidv4(), // Tạo UUID cho mỗi phần
                              file_path: part.file_path,
                              start_time: part.start_time,
                              end_time: part.end_time,
                              song_id: song.id, // Đảm bảo bạn có trường `song_id`
                         });
                    }

                    Object.assign(response, {
                         status: 201,
                         message: "Bài nhạc đã được tạo và chia thành các phần thành công.",
                         song: song.dataValues,
                         parts: parts
                    });
               } else {
                    Object.assign(response, {
                         status: 400,
                         message: "Không thể tạo bài nhạc.",
                    });
               }
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
          let { page, limit } = req.query;
          page = parseInt(page) || 1;
          limit = parseInt(limit) || 10;
          const offset = (page - 1) * limit;
          try {
               const { count, rows: songs } = await songServices.findSongAndCountAll({
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
                         {
                              model: SongPart,
                         }
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
                                   {
                                        model: SongPart,
                                   }
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
                              {
                                   model: SongPart,
                              }
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
                         {
                              model: SongPart
                         }// Bao gồm thông tin thể loại
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
                              ['views', 'DESC'],       // Sắp xếp theo lượt xem giảm dần
                              ['favorites', 'DESC'],   // Sắp xếp theo lượt yêu thích giảm dần
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
               console.log("playlists", playlists);
               const category = await Genre.findAll();
               // Tính số lần nghe mỗi thể loại và sắp xếp thể loại yêu thích
               userHistory.forEach(history => {
                    const genreId = history.Song.genre_id;
                    genreCount[genreId] = (genreCount[genreId] || 0) + 1;
               });

               const sortedGenreIds = Object.keys(genreCount)
                    .sort((a, b) => genreCount[b] - genreCount[a])
                    .slice(0, 3); // Lấy 3 thể loại người dùng nghe nhiều nhất

               const wantToListen = await Genre.findAll({
                    where: {
                         id: sortedGenreIds,
                    },
                    attributes: ['id', 'name'],
               });
               return res.status(200).json({
                    success: true,
                    message: "Khám phá dữ liệu đã được lấy thành công",
                    data: {
                         songForYou: recommendedSongs,       // Danh sách bài hát dành cho bạn
                         listenRecently: playlists,   // Danh sách các playlist đã nghe gần đây
                         category,         // Tất cả các thể loại
                         wantToListen,     // Các thể loại người dùng muốn nghe
                    },
               });

          } catch (e) {
               console.error('Lỗi khi lấy dữ liệu explore:', e);
               return res.status(500).json({
                    success: false,
                    message: "Lỗi khi lấy dữ liệu explore",
               });
          }
     }



};
