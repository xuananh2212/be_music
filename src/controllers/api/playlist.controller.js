const { object, string } = require("yup");
var _ = require("lodash");
const playlistServices = require("../../services/playlist.services");
const { PlaylistSong, Artist, Song, Album, Genre } = require("../../models/index");
const userServices = require("../../services/user.services");
module.exports = {
     handleGetAllPage: async (req, res) => {
          try {
               const playlists = await playlistServices.findPlayListAll({
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
                    success: true,
                    data: playlists,
               });
          } catch (error) {
               console.error('Lỗi khi tải danh sách pháts:', error);
               res.status(500).json({
                    success: false,
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
                    message: "Success",
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


};
