require('dotenv').config();
var _ = require('lodash');
const authServices = require('../../services/auth.services');
const { object, string } = require('yup');
const bcrypt = require('bcrypt');
const UserTransformer = require('../../transformers/user.transformers');
const userServices = require('../../services/user.services');
var { regexPassword, regexPhone } = require('../../helpers/validate')
module.exports = {
     handleLogin: async (req, res) => {
          const response = {};
          try {
               let userSchema = object({
                    userName: string()
                         .required("Vui lòng nhập tên tài khoản"),
                    password: string()
                         .required("Vui lòng nhập password")
                         .matches(regexPassword, "Mật khẩu ít nhất 8 kí tự ,có kí tự viết hoa, ký tự đặc biệt và số")
               });
               const body = await userSchema.validate(req.body, { abortEarly: false });
               const user = await userServices.findByUserName(body?.userName);
               const result = await bcrypt.compare(body.password, user.password);
               if (result && user) {
                    const access_token = authServices.generateAccessToken(user?.id);
                    const refresh_token = authServices.generateRefreshToken(user?.id);
                    const data = new UserTransformer(user);
                    Object.assign(response, {
                         status: 200,
                         message: 'success',
                         user: data,
                         access_token,
                         refresh_token
                    });
               } else {
                    Object.assign(response, {
                         status: 400,
                         message: "Tài khoản và mật khẩu không chính xác",
                    });
                    return res.status(response.status).json(response)
               }

          } catch (e) {
               let errors = {};
               if (e?.inner) {
                    errors = Object.fromEntries(e.inner.map((item) => [item.path, item.message]));
               }
               Object.assign(response, {
                    status: 400,
                    message: "Yêu cầu không hợp lệ",
                    errors: _.isEmpty(errors) ? e?.message : errors
               });
          }
          return res.status(response.status).json(response)

     },
     handleRegister: async (req, res) => {
          const response = {};
          try {
               let userSchema = object({
                    userName: string()
                         .required("vui lòng nhập tên"),
                    email: string()
                         .required("vui lòng nhập email")
                         .email("email không đúng định dạng!"),
                    password: string()
                         .required("vui lòng nhập password")
                         .matches(regexPassword, "mật khẩu ít nhất 8 kí tự, có kí tự viết hoa, ký tự đặc biệt và số")
                         .test('matchPassword', "mật khẩu không hợp nhau", (password) => {
                              const { passwordRe } = req.body
                              return password === passwordRe
                         }),
                    phone: string()
                         .matches(regexPhone, 'không đúng dịnh dạng điện thoại')
               });
               const body = await userSchema.validate(req.body, { abortEarly: false });
               const { userName, email, password, passwordRe, phone } = body;
               const userFind = await userServices?.findByUserName(userName);
               const emailFind = await userServices?.findUserByEmail(email);
               if (userFind) {
                    return res.status(400).json({ status: 400, message: 'Tên đăng nhập đã tồn tại!' });
               }
               if (emailFind) {
                    return res.status(400).json({ status: 400, message: 'Email đã tồn tại!' });
               }
               const salt = await bcrypt.genSalt(10);
               const hashed = await bcrypt.hash(password, salt);
               const user = await userServices.createUser({
                    user_name: userName,
                    email,
                    password: hashed,
                    phone
               })
               delete user.dataValues.password;
               Object.assign(response, {
                    status: 201,
                    message: "Success",
                    user: user.dataValues

               });

          } catch (e) {
               let errors = {};
               if (e?.inner) {
                    errors = Object.fromEntries(e.inner.map((item) => [item.path, item.message]));
               }
               Object.assign(response, {
                    status: 400,
                    message: "Yêu cầu không hợp lệ",
                    errors: _.isEmpty(errors) ? e?.message : errors
               });

          }
          return res.status(response.status).json(response);

     },
     handleRegisterArtists: async (req, res) => {
          const response = {};
          try {
               let userSchema = object({
                    userName: string()
                         .required("vui lòng nhập tên"),
                    email: string()
                         .required("vui lòng nhập email")
                         .email("email không đúng định dạng!"),
                    password: string()
                         .required("vui lòng nhập password")
                         .matches(regexPassword, "mật khẩu ít nhất 8 kí tự, có kí tự viết hoa, ký tự đặc biệt và số")
                         .test('matchPassword', "mật khẩu không hợp nhau", (password) => {
                              const { passwordRe } = req.body
                              return password === passwordRe
                         }),
                    phone: string()
                         .matches(regexPhone, 'không đúng dịnh dạng điện thoại')
               });
               const body = await userSchema.validate(req.body, { abortEarly: false });
               const { userName, email, password, passwordRe, phone } = body;
               const userFind = await userServices?.findByUserName(userName);
               const emailFind = await userServices?.findUserByEmail(email);
               if (userFind) {
                    return res.status(400).json({ status: 400, message: 'Tên đăng nhập đã tồn tại!' });
               }
               if (emailFind) {
                    return res.status(400).json({ status: 400, message: 'Email đã tồn tại!' });
               }
               const salt = await bcrypt.genSalt(10);
               const hashed = await bcrypt.hash(password, salt);
               const user = await userServices.createUser({
                    user_name: userName,
                    email,
                    password: hashed,
                    phone
               })
               delete user.dataValues.password;
               Object.assign(response, {
                    status: 201,
                    message: "Success",
                    user: user.dataValues

               });

          } catch (e) {
               let errors = {};
               if (e?.inner) {
                    errors = Object.fromEntries(e.inner.map((item) => [item.path, item.message]));
               }
               Object.assign(response, {
                    status: 400,
                    message: "Yêu cầu không hợp lệ",
                    errors: _.isEmpty(errors) ? e?.message : errors
               });

          }
          return res.status(response.status).json(response);

     },

     handleLogout: async (req, res) => {
          const { access_token } = req.user;
          await authServices.findBlacklist(access_token);
          res.json({
               status: 200,
               message: "Success",
          });
     },
     handleRefreshToken: (req, res) => {
          const response = {};
          const { refreshToken } = req.body;
          if (refreshToken) {
               try {
                    const result = authServices.verifyToken(refreshToken);
                    const { id } = result;
                    const accessTokenNew = authServices.generateAccessToken(id);
                    const refreshTokenNew = authServices.generateRefreshToken(id);
                    Object.assign(response,
                         {
                              status: 200,
                              message: 'success',
                              access_token: accessTokenNew,
                              refresh_token: refreshTokenNew
                         })

               } catch (e) {
                    Object.assign(response,
                         {
                              status: 401,
                              message: 'Unauthorized'
                         })
               }
          } else {
               Object.assign(response,
                    {
                         status: 401,
                         message: 'Unauthorized'
                    })
          }
          return res.status(response.status).json(response);
     },
     handleCheckToken: (req, res) => {
          const user = new UserTransformer(req.user);
          return res.status(200).json({
               status: 200,
               user
          })
     }
}