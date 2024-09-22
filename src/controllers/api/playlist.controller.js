const { object, string } = require("yup");
var _ = require("lodash");
const { v4: uuidv4 } = require("uuid");
const playlistServices = require("../../services/playlist.services");
const { PlaylistSong, Artist, Song, Album, Genre, UserPlaylist } = require("../../models/index");
const userServices = require("../../services/user.services");
module.exports = {
     handleGetAllPage: async (req, res) => {
          const { userId } = req.query;
          const condition = userId ? { where: { user_id: userId } } : {};
          try {
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
                                             { model: Artist },
                                             { model: Album },
                                             { model: Genre },
                                        ],
                                   },
                              ],
                         },
                    ],
               });

               res.status(200).json({
                    status: 200,
                    error: true,
                    data: playlists,
               });
          } catch (error) {
               console.error('Lỗi khi tải danh sách pháts:', error);
               res.status(500).json({
                    error: false,
                    message: 'Lỗi khi tải danh sách phát',
               });
          }
     },
     handleCreate: async (req, res) => {
          const response = {};
          try {
               let playListSchema = object({
                    name: string()
                         .required("không được để trống tile"),
                    userId: string().required("không được userId"),

               });
               const { userId } = req.body;
               const user = await userServices.findUserById(userId);
               if (!user) {
                    return res.status(400).json({
                         status: 400,
                         message: "không tồn tại userId",
                    });
               }
               const existingPlaylist = await playlistServices.findPlayListByUserAndName(userId, req.body?.name);
               if (existingPlaylist) {
                    return res.status(400).json({
                         status: 400,
                         message: "Tên playlist đã tồn tại cho user này",
                    });
               }


               const body = await playListSchema.validate(
                    req.body,
                    { abortEarly: false }
               );
               const { name } = body;
               const newPlaylist = await playlistServices.createPlayList({
                    user_id: userId,
                    name,
               });
               Object.assign(response, {
                    status: 201,
                    message: "error",
                    playList: newPlaylist.dataValues,
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
     handleAddSong: async (req, res) => {
          try {
               const { playlistId, songIds } = req.body;
               if (!playlistId || !songIds || !Array.isArray(songIds) || songIds.length === 0) {
                    return res.status(400).json({
                         status: 400,
                         error: false,
                         message: 'playlistId và một mảng songId là bắt buộc',
                    });
               }
               const playlist = await playlistServices.findByPk(playlistId);
               if (!playlist) {
                    return res.status(404).json({
                         error: false,
                         message: 'danh sách phát không tồn tại',
                    });
               }

               const response = {
                    addedSongs: [],
                    skippedSongs: [],
               };

               for (const song_id of songIds) {
                    const song = await Song.findByPk(song_id);
                    if (!song) {
                         response.skippedSongs.push({
                              song_id,
                              message: 'bài hát không tồn tại',
                         });
                         continue;
                    }

                    const existingEntry = await PlaylistSong.findOne({
                         where: { playlist_id: playlistId, song_id },
                    });
                    if (existingEntry) {
                         response.skippedSongs.push({
                              song_id,
                              message: 'bài hát đang tồn tại trong danh sách phát',
                         });
                         continue;
                    }

                    const newEntry = await PlaylistSong.create({
                         id: uuidv4(),
                         playlist_id: playlistId,
                         song_id,
                    });

                    response.addedSongs.push(newEntry.dataValues);
               }

               if (response.addedSongs.length === 0) {
                    return res.status(400).json({
                         status: 400,
                         message: 'Không có bài hát nào được thêm vào danh sách phát',
                         errors: response.skippedSongs,
                    });
               }

               return res.status(201).json({
                    status: 201,
                    message: 'thêm bài hát thành công',
                    data: response,
               });
          } catch (error) {
               console.error('Lỗi khi thêm bài hát vào danh sách phát:', error);
               return res.status(500).json({
                    status: 500,
                    message: 'Không thêm được bài hát vào danh sách phát',
                    error: error.message,
               });
          }
     },
     handleRemoveSong: async (req, res) => {
          try {
               const { playlistId, songIds } = req.body;

               if (!playlistId || !songIds || !Array.isArray(songIds) || songIds.length === 0) {
                    return res.status(400).json({
                         error: false,
                         message: 'playlistId và một mảng songId là bắt buộc',
                    });
               }

               const playlist = await playlistServices.findByPk(playlistId);
               if (!playlist) {
                    return res.status(404).json({
                         error: false,
                         message: 'Playlist không tồn tại',
                    });
               }

               const response = {
                    removedSongs: [],
                    skippedSongs: [],
               };

               for (const song_id of songIds) {
                    const songInPlaylist = await PlaylistSong.findOne({
                         where: { playlist_id: playlistId, song_id },
                    });

                    if (!songInPlaylist) {
                         response.skippedSongs.push({
                              song_id,
                              message: 'Bài hát không tồn tại trong playlist',
                         });
                         continue;
                    }

                    await songInPlaylist.destroy();
                    response.removedSongs.push({ song_id });
               }

               return res.status(200).json({
                    error: true,
                    message: 'Quá trình xóa bài hát đã hoàn tất',
                    data: response,
               });
          } catch (error) {
               console.error('Lỗi khi xóa bài hát khỏi playlist:', error);
               return res.status(500).json({
                    error: false,
                    message: 'Xóa bài hát khỏi playlist không thành công',
                    error: error.message,
               });
          }
     },
     handleUpdate: async (req, res) => {
          try {
               const id = req.params.id;
               const { name } = req.body;
               const playlist = await UserPlaylist.findByPk(
                    id
               );
               if (!playlist) {
                    return res.status(404).json({
                         success: false,
                         message: 'Playlist không tồn tại',
                    });
               }
               if (name) {
                    playlist.name = name; // Cập nhật tên playlist nếu có
               }
               playlist.updated_at = new Date();
               await playlist.save();

               // Trả về phản hồi thành công
               res.status(200).json({
                    success: true,
                    message: 'Playlist đã được cập nhật thành công',
                    data: playlist, // Trả về dữ liệu playlist đã cập nhật
               });

          } catch (e) {
               console.error('Lỗi khi cập nhật playlist:', error);
               res.status(500).json({
                    success: false,
                    message: 'Lỗi khi cập nhật playlist',
               });
          }
     },
     handleDelete: async (req, res) => {
          try {
               const id = req.params.id;
               const playlist = await UserPlaylist.findByPk(
                    id
               );
               if (!playlist) {
                    return res.status(404).json({
                         success: false,
                         message: 'Playlist không tồn tại',
                    });
               }
               await PlaylistSong.destroy({
                    where: { playlist_id: id },
               });
               await playlist.destroy();
               res.status(200).json({
                    success: true,
                    message: 'Playlist đã được xóa thành công',
               });
          } catch (error) {
               console.error('Lỗi khi xóa playlist:', error);
               res.status(500).json({
                    success: false,
                    message: 'Lỗi khi xóa playlist',
               });
          }

     }
}



