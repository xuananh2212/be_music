const { object, string } = require('yup');
const userServices = require('../../services/user.services');
var { regexPhone } = require('../../helpers/validate');
module.exports = {
     handleAllUser: async (req, res) => {
          const response = {};
          try {
               const users = await userServices.findAllUser();
               users.forEach(user => delete user.dataValues.password);
               const userDataValues = users.map(user => user.dataValues);
               Object.assign(response, {
                    status: 200,
                    message: 'Thành công',
                    users: userDataValues
               });
          } catch (err) {
               Object.assign(response, {
                    status: 400,
                    message: 'Yêu cầu không hợp lệ',

               })
          }
          return res.status(response.status).json(response);
     },
     handleProfile: (req, res) => {
          res.status(200).json({
               message: 'Thành công',
               user: {
                    ...req.user.dataValues
               }
          })
     },
     handleEditUser: async (req, res) => {
          const response = {};
          try {
               const { id } = req.params;
               let userFind = await userServices.findUserById(id);
               if (!userFind) {
                    Object.assign(response, {
                         status: 404,
                         message: 'id không tồn tại'
                    });
                    return res.status(response.status).json(response);
               }
               const userSchema = object({
                    name: string()
                         .required('vui lòng nhập tên'),
                    urlImage: string().matches(regexUrl, "không đúng định dạng url").notRequired(),
                    phone: string()
                         .matches(regexPhone, 'không đúng dịnh dạng điện thoại')
                         .notRequired()

               })
               const body = await userSchema.validate(req.body, { abortEarly: false });
               userFind = await userServices.updateUser(id, body);
               Object.assign(response, {
                    status: 200,
                    message: 'cập nhật thành công',
                    user: userFind
               })
          } catch (e) {
               if (response?.status !== 404) {
                    const errors = Object.fromEntries(e?.inner?.map((item) => [item.path, item.message]));
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