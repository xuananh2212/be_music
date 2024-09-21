const { object, string } = require('yup');
const userServices = require('../../services/user.services');
var { regexPhone, regexUrl } = require('../../helpers/validate');
const { Op } = require('sequelize');
module.exports = {
     handleAllUser: async (req, res) => {
          let { page, limit, keyword } = req.query;
          page = parseInt(page) || 1;
          limit = parseInt(limit) || 10;
          const offset = (page - 1) * limit;
          const response = {};
          try {
               const whereCondition = {
                    role: 1
               };
               if (keyword) {
                    whereCondition.user_name = {
                         [Op.iLike]: `%${keyword}%`
                    };
               }
               const { count, rows: users } = await userServices.findUserAndCountAll({
                    where: whereCondition,
                    limit: limit,
                    offset: offset,
                    order: [['created_at', 'DESC']]
               });
               const totalPages = Math.ceil(count / limit);
               users.forEach(user => delete user.dataValues.password);
               const userDataValues = users.map(user => user.dataValues);
               Object.assign(response, {

                    status: 200,
                    message: null,
                    errors: null,
                    data: userDataValues,
                    meta: {
                         totalItems: count,
                         currentPage: page,
                         totalPages: totalPages,
                         pageSize: limit
                    }
               });
          } catch (err) {
               console.log("err", err)
               Object.assign(response, {
                    status: 400,
                    message: 'Yêu cầu không hợp lệ',

               })
          }
          return res.status(response.status).json(response);
     },
     handleProfile: async (req, res) => {
          const userId = req.user.id;
          console.log("userId", userId);
          let userFind = await userServices.findUserById(userId);
          if (!userFind) {
               Object.assign(response, {
                    status: 404,
                    message: 'Người dùng không tồn tại!'
               });
               return res.status(response.status).json(response);
          }
          return res.status(200).json({
               message: null,
               errors: null,
               data: userFind
          })
     },
     handleDetail: async (req, res) => {
          const { id } = req.params;
          const response = {};
          let userFind = await userServices.findUserById(id);
          if (!userFind) {
               Object.assign(response, {
                    status: 404,
                    message: 'Người dùng không tồn tại!'
               });
               return res.status(response.status).json(response);
          }
          return res.status(200).json({
               message: null,
               errors: null,
               data: userFind
          })
     },
     handleEditUser: async (req, res) => {
          const response = {};
          try {
               const { id } = req.params;
               console.log("id", req.query);
               let userFind = await userServices.findUserById(id);
               if (!userFind) {
                    Object.assign(response, {
                         status: 404,
                         message: 'id không tồn tại'
                    });
                    return res.status(response.status).json(response);
               }
               const userSchema = object({
                    urlImage: string().matches(regexUrl, "không đúng định dạng url").notRequired(),
                    phone: string()
                         .matches(regexPhone, 'không đúng dịnh dạng điện thoại')
                         .notRequired()

               })
               const body = await userSchema.validate(req.body, { abortEarly: false });
               userFind = await userServices.updateUser(id, {
                    status: body?.status,
                    url_image: body?.urlImage,
                    phone: body?.phone
               });
               Object.assign(response, {
                    status: 200,
                    message: 'cập nhật thành công',
                    user: userFind
               })
          } catch (e) {
               console.log(e);
               if (response?.status !== 404) {
                    const errors = Object?.fromEntries(e?.inner?.map((item) => [item.path, item.message]));
                    Object.assign(response, {
                         status: 400,
                         message: "Yêu cầu không hợp lệ",
                         errors
                    });

               } else {
                    Object.assign(response, {
                         message: e?.message
                    });
               }
          }
          return res.status(response.status).json(response);
     },
     handleDeleteUser: async (req, res) => {
          const response = {};
          const { id } = req.params;
          try {
               const user = await userServices.findUserById(id);
               if (!user) {
                    return res.status(404).json({ status: 404, message: 'user không tồn tại!' });
               }
               await user.destroy();
               Object.assign(response, {
                    status: 200,
                    message: 'Xóa Thành công',
                    userId: id
               })
          } catch (e) {
               Object.assign(response, {
                    status: 400,
                    message: e?.message
               })
          }
          return res.status(response.status).json(response);
     },
     handleDeleteManyUser: async (req, res) => {
          const response = {};
          const { userIds } = req.body;
          try {
               if (!Array.isArray(userIds)) {
                    throw new Error('Định dạng dữ liệu không hợp lệ!');
               }
               if (userIds.length === 0) {
                    throw new Error('danh sách id rỗng!');
               }
               await userServices.deleteManyUser(userIds);

               Object.assign(response, {
                    status: 200,
                    message: 'xóa Thành công',
                    userIds
               });

          } catch (e) {
               console.log(e);
               Object.assign(response, {
                    status: 400,
                    message: e.message
               });

          }
          return res.status(response.status).json(response);
     }

}