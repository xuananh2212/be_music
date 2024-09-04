const { object, string } = require("yup");
var _ = require("lodash");

const songServices = require("../../services/song.services");
const albumServices = require("../../services/album.services");
const artistServices = require("../../services/artist.services");
module.exports = {
     handleCreate: async (req, res) => {
          const response = {};
          const userId = req.user.id;
          try {
               let songSchema = object({
                    title: string()
                         .required("không được để trống tile")
               });
               const { albumId } = req.body;
               console.log(req.body);
               const album = await albumServices.findAlbumById(albumId);
               const artist = await artistServices.findOneByArtist({
                    user_id: userId
               });

               if (!artist) {
                    return res.status(403).json({
                         status: 403,
                         message: "không có quyền",
                    });
               }
               if (!album) {
                    return res.status(400).json({
                         status: 400,
                         message: "không tồn tại albumId",
                    });
               }
               console.log(2222222222);

               const body = await songSchema.validate(
                    req.body,
                    { abortEarly: false }
               );
               const { title, fileUrl, videoUrl, duration, releaseDate, views, favorites, lyrics } = body;
               console.log(2);
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
                    artist_id: artist.id,
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
