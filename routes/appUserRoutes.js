const express = require('express');
const router = express.Router();
const {
  getAppUsers,
  getAppUserById,
  createAppUser,
  updateAppUser,
  deleteAppUser,
} = require('../controllers/appUserController');

router.route('/').get(getAppUsers).post(createAppUser);
router.route('/:id').get(getAppUserById).put(updateAppUser).delete(deleteAppUser);

module.exports = router;
