var express = require('express');
var router = express.Router();
const userController = require('../../controllers/api/user.controller');
router.get('/', userController.handleAllUser);
router.post('/delete/many-user', userController.handleDeleteManyUser);
router.post('/:id', userController.handleEditUser);
router.delete('/:id', userController.handleDeleteUser);
router.get('/profile', userController.handleProfile);
module.exports = router;