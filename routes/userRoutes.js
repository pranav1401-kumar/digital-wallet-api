const express = require('express');
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validator');
const { updateCurrencySchema } = require('../utils/validation');
const apiLimiter = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Not authenticated
 */
router.get('/profile', protect, userController.getProfile);

/**
 * @swagger
 * /users/update-me:
 *   patch:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               defaultCurrency:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 */
router.patch('/update-me', protect, apiLimiter, userController.updateMe);

/**
 * @swagger
 * /users/delete-me:
 *   delete:
 *     summary: Delete user account (deactivate)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Account deactivated
 *       401:
 *         description: Not authenticated
 */
router.delete('/delete-me', protect, apiLimiter, userController.deleteMe);

module.exports = router;