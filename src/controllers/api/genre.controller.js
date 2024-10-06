const { object, string } = require("yup");
const genreServices = require("../../services/genre.services");
var _ = require("lodash");
const { UserHiddenSong, SongPart, User, PlaylistSong, UserFavorite, Song, Artist, Album, Genre, UserHistory } = require("../../models/index");
const { Op, Sequelize } = require("sequelize");
module.exports = {
     getGenreStats: async (req, res) => {
          try {
               const genres = await Genre.findAll({
                    attributes: ['id', 'name'], // Chỉ lấy id và tên thể loại
                    include: [
                         {
                              model: Song, // Kết hợp với bảng Song
                              attributes: [], // Không cần lấy thêm thuộc tính từ Song
                              include: [
                                   {
                                        model: UserHistory, // Liên kết với UserHistory để đếm lượt nghe
                                        attributes: [], // Không lấy thuộc tính từ UserHistory
                                   },
                                   {
                                        model: UserFavorite, // Liên kết với UserFavorite để đếm lượt yêu thích
                                        attributes: [], // Không lấy thuộc tính từ UserFavorite
                                   },
                              ],
                         },
                    ],
                    group: ['Genre.id'], // Nhóm theo id thể loại
                    raw: true,
                    attributes: [
                         'id',
                         'name',
                         [Sequelize.fn('COUNT', Sequelize.col('Songs.id')), 'songCount'], // Đếm số bài hát theo thể loại
                         [Sequelize.fn('COUNT', Sequelize.col('Songs.UserHistories.song_id')), 'listenCount'], // Đếm số lượt nghe
                         [Sequelize.fn('COUNT', Sequelize.col('Songs.UserFavorites.song_id')), 'favoriteCount'], // Đếm số lượt yêu thích
                    ],
               });

               res.status(200).json({
                    status: 200,
                    success: true,
                    message: 'Thống kê thể loại thành công',
                    data: genres,
               });
          } catch (error) {
               console.error('Lỗi khi lấy thống kê thể loại:', error);
               res.status(500).json({
                    status: 500,
                    success: false,
                    message: 'Lỗi khi lấy thống kê thể loại',
               });
          }
     },
     handleCreate: async (req, res) => {
          const response = {};
          try {
               let genreSchema = object({
                    name: string()
                         .required("không được để trống name")
               });
               const body = await genreSchema.validate(
                    req.body,
                    { abortEarly: false }
               );
               const genreFind = await genreServices.findGenrebyOne({
                    where: {
                         name: body.name,
                    }
               })
               if (genreFind) {
                    Object.assign(response, {
                         status: 404,
                         message: 'Tên thể loại nhạc đã tồn tại!'
                    });
                    return res.status(response.status).json(response);
               }
               const { name, urlImage, desc } = body;
               const genre = await genreServices.createGenre({
                    name,
                    description: desc,
                    image_url: urlImage,
               });
               Object.assign(response, {
                    status: 201,
                    message: "Success",
                    data: genre.dataValues,
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

     handleUpdate: async (req, res) => {
          const response = {};
          try {
               let genreSchema = object({
                    name: string()
                         .required("không được để trống name"),
                    urlImage: string().url().nullable(),
                    desc: string().nullable(),
               });
               const body = await genreSchema.validate(
                    req.body,
                    { abortEarly: false }
               );

               const genre = await genreServices.findGenrebyOne({
                    where: {
                         id: req.params.id,
                    },
               });

               if (!genre) {
                    Object.assign(response, {
                         status: 404,
                         message: "Thể loại nhạc không tồn tại!",
                    });
                    return res.status(response.status).json(response);
               }

               // Check if another genre with the same name exists
               const genreWithSameName = await genreServices.findGenrebyOne({
                    where: {
                         name: body.name,
                         id: { [Op.ne]: genre.id }, // Exclude the current genre
                    },
               });

               if (genreWithSameName) {
                    Object.assign(response, {
                         status: 400,
                         message: 'Tên thể loại nhạc đã tồn tại!'
                    });
                    return res.status(response.status).json(response);
               }

               genre.name = body.name;
               genre.image_url = body.urlImage;
               genre.description = body.desc;
               await genre.save();

               Object.assign(response, {
                    status: 200,
                    message: "Cập nhật thể loại nhạc thành công!",
                    data: genre.dataValues,
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
               const genreId = req.params.id;
               const genre = await genreServices.findGenrebyOne({
                    where: { id: genreId }
               });

               if (!genre) {
                    Object.assign(response, {
                         status: 404,
                         message: "Thể loại nhạc không tồn tại!",
                    });
                    return res.status(response.status).json(response);
               }

               Object.assign(response, {
                    status: 200,
                    message: null,
                    data: genre.dataValues,
               });
          } catch (error) {
               Object.assign(response, {
                    status: 500,
                    message: "Có lỗi xảy ra khi lấy thông tin thể loại nhạc",
                    error: error.message
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
                    whereCondition.name = {
                         [Op.iLike]: `%${keyword}%`
                    };
               }
               const { count, rows: genres } = await genreServices.findGenreAndCountAll({
                    where: whereCondition,
                    limit: limit,
                    offset: offset,
                    order: [['created_at', 'DESC']]
               });

               const totalPages = Math.ceil(count / limit);

               res.json({
                    data: genres,
                    meta: {
                         totalItems: count,
                         currentPage: page,
                         totalPages: totalPages,
                         pageSize: limit
                    }
               });
          } catch (error) {
               console.log("error", error);
               res.status(500).json({ message: 'Error fetching genres', error });
          }
     },
     handleDelete: async (req, res) => {
          const response = {};
          try {
               const genreId = req.params.id;
               const genre = await genreServices.findGenrebyOne({
                    where: { id: genreId }
               });

               if (!genre) {
                    Object.assign(response, {
                         status: 404,
                         message: "Thể loại nhạc không tồn tại!",
                    });
                    return res.status(response.status).json(response);
               }

               await genreServices.deleteGenre({ where: { id: genreId } });

               Object.assign(response, {
                    status: 200,
                    message: "Xóa thể loại nhạc thành công!",
               });
          } catch (error) {
               console.log("error", error)
               Object.assign(response, {
                    status: 500,
                    message: "Có lỗi xảy ra khi xóa thể loại nhạc",
                    error: error.message
               });
          }
          return res.status(response.status).json(response);
     },


};
