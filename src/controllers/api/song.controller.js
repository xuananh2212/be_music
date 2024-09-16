const { object, string } = require("yup");
var _ = require("lodash");

const songServices = require("../../services/song.services");
const albumServices = require("../../services/album.services");
module.exports = {
     handleCreate: async (req, res) => {
          const response = {};
          try {
               let songSchema = object({
                    title: string()
                         .required("không được để trống tile")
               });
               const { albumId } = req.body;
               const album = await albumServices.findAlbumById(albumId);
               if (!album) {
                    return res.status(400).json({
                         status: 400,
                         message: "không tồn tại albumId",
                    });
               }

               const body = await songSchema.validate(
                    req.body,
                    { abortEarly: false }
               );
               const { title, fileUrl, videoUrl, duration, releaseDate, views, favorites, lyrics } = body;
               const song = await songServices.createSong({
                    title,
                    file_url: fileUrl,
                    video_url: videoUrl,
                    duration,
                    release_date: releaseDate,
                    views,
                    favorites,
                    lyrics,
                    album_id: albumId,
                    approved: true,

               });
               console.log("song", song)
               Object.assign(response, {
                    status: 201,
                    message: "Success",
                    song: song.dataValues,
               });
               console.log(2);
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
     }


};
