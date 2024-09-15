const { object, string } = require("yup");
const genreServices = require("../../services/genre.services");
var _ = require("lodash");
const { Op } = require("sequelize");
module.exports = {
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
               const { name, imageUrl, desc } = body;
               const genre = await genreServices.createGenre({
                    name,
                    description: desc,
                    image_url: imageUrl,
               });
               Object.assign(response, {
                    status: 201,
                    message: "Success",
                    genre: genre.dataValues,
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
     }


};
