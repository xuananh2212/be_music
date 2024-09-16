var _ = require("lodash");
const { object, string } = require("yup");
const albumServices = require("../../services/album.services");
const artistServices = require("../../services/artist.services");
const { Artist, User } = require('../../models/index');
const { Op } = require("sequelize");

module.exports = {
     handleCreate: async (req, res) => {
          const response = {};
          try {
               let albumSchema = object({
                    title: string().required("không được để trống title"),
               });
               const body = await albumSchema.validate(
                    req.body,
                    { abortEarly: false }
               );
               const artist = await artistServices.findArtistById(
                    body?.artistId
               );
               if (!artist) {
                    Object.assign(response, {
                         status: 404,
                         message: "Nhà sản xuất không tồn tại!",
                    });
                    return res.status(response.status).json(response);

               }
               const album = await albumServices.createAlbum({
                    artist_id: body?.artistId,
                    title: body.title,
                    release_date: body.releaseDate && new Date(body.releaseDate),
                    image_url: body.urlImage,
               });
               Object.assign(response, {
                    status: 201,
                    message: "Success",
                    album: album.dataValues,
               });
          } catch (e) {
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
               const albumId = req.params.id;

               const album = await albumServices.findAlbumById(albumId, {
                    include: [{
                         model: Artist,
                         attributes: ['stage_name'],
                    }],
               });

               if (!album) {
                    Object.assign(response, {
                         status: 404,
                         message: "Album không tồn tại!",
                    });
                    return res.status(response.status).json(response);
               }


               Object.assign(response, {
                    status: 200,
                    message: "Thành công",
                    data: album.dataValues,
               });
          } catch (error) {
               Object.assign(response, {
                    status: 500,
                    message: "Có lỗi xảy ra khi lấy thông tin album",
                    error: error.message,
               });
          }
          return res.status(response.status).json(response);
     },
     handleGetAll: async (req, res) => {
          let { page, limit, keyword } = req.query;
          page = parseInt(page) || 1;
          limit = parseInt(limit) || 10;
          console.log("page, limit", page, limit);
          const offset = (page - 1) * limit;
          try {
               const whereCondition = {
               };
               if (keyword) {
                    whereCondition.title = {
                         [Op.iLike]: `%${keyword}%`
                    };
               }
               const { count, rows: albums } = await albumServices.findAlbumAndCountAll({
                    where: whereCondition,
                    limit: limit,
                    offset: offset,
                    order: [['created_at', 'DESC']],
                    include: [
                         {
                              model: Artist,
                              include: [
                                   {
                                        model: User,
                                        attributes: ['user_name'],
                                   },
                              ],
                         },
                    ],
               });
               const albumData = albums.map(album => ({
                    ...album.dataValues,
                    artist_name: album?.Artist?.stage_name,

               }));
               delete albumData.Artist;

               const totalPages = Math.ceil(count / limit);

               res.json({
                    data: albumData,
                    meta: {
                         totalItems: count,
                         currentPage: page,
                         totalPages: totalPages,
                         pageSize: limit
                    }
               });
          } catch (error) {
               console.log(error);
               res.status(500).json({ message: 'Error fetching album', error });
          }
     },
     handleUpdate: async (req, res) => {
          const response = {};
          try {
               let albumSchema = object({
                    title: string().required("không được để trống title"),
                    releaseDate: string().nullable(),
                    urlImage: string().nullable(),
                    artistId: string().nullable(),
               });
               const body = await albumSchema.validate(req.body, { abortEarly: false });

               const album = await albumServices.findAlbumById(req.params.id);

               if (!album) {
                    Object.assign(response, {
                         status: 404,
                         message: "Album không tồn tại!",
                    });
                    return res.status(response.status).json(response);
               }

               if (body.artistId) {
                    const artist = await artistServices.findOneByArtist({
                         id: body.artistId,
                    });

                    if (!artist) {
                         Object.assign(response, {
                              status: 404,
                              message: "Nghệ sĩ không tồn tại!",
                         });
                         return res.status(response.status).json(response);
                    }

                    album.artist_id = body.artistId;
               }
               album.title = body.title;
               album.release_date = body.releaseDate;
               album.image_url = body.urlImage;

               await album.save();

               Object.assign(response, {
                    status: 200,
                    message: "Cập nhật album thành công!",
                    album: album.dataValues,
               });
          } catch (e) {
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

     handleDelete: async (req, res) => {
          const response = {};
          try {
               const album = await albumServices.findAlbumById(req.params.id);

               if (!album) {
                    Object.assign(response, {
                         status: 404,
                         message: "Album không tồn tại!",
                    });
                    return res.status(response.status).json(response);
               }

               await albumServices.deleteAlbum({
                    where: { id: req?.params?.id },
               });

               Object.assign(response, {
                    status: 200,
                    message: "Xóa album thành công!",
               });
          } catch (error) {
               console.log("error", error)
               Object.assign(response, {
                    status: 500,
                    message: "Có lỗi xảy ra khi xóa album",
                    error: error.message,
               });
          }
          return res.status(response.status).json(response);
     },


};
