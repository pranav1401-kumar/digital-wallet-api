const express = require('express');
const walletController = require('../controllers/walletController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validator');
const { addFundsSchema, transferFundsSchema, withdrawFundsSchema } = require('../utils/validation');
const apiLimiter = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Wallet management
 */

/**
 * @swagger
 * /wallets/balance:
 *   get:
 *     summary: Get wallet balance
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance
 *       401:
 *         description: Not authenticated
 */
router.get('/balance', protect, walletController.getWalletBalance);

/**
 * @swagger
 * /wallets/details:
 *   get:
 *     summary: Get wallet details and statistics
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet details
 *       401:
 *         description: Not authenticated
 */
router.get('/details', protect, walletController.getWalletDetails);

/**
 * @swagger
 * /wallets/add-funds:
 *   post:
 *     summary: Add funds to wallet
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: 'USD'
 *     responses:
 *       200:
 *         description: Funds added successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 */
router.post('/add-funds', protect, apiLimiter, validate(addFundsSchema), walletController.addFunds);

/**
 * @swagger
 * /wallets/transfer:
 *   post:
 *     summary: Transfer funds to another user
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *               - amount
 *             properties:
 *               recipientId:
 *                 type: string
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: 'USD'
 *     responses:
 *       200:
 *         description: Funds transferred successfully
 *       400:
 *         description: Invalid input or insufficient funds
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Recipient not found
 */
router.post('/transfer', protect, apiLimiter, validate(transferFundsSchema), walletController.transferFunds);

/**
 * @swagger
 * /wallets/withdraw:
 *   post:
 *     summary: Withdraw funds from wallet
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: 'USD'
 *     responses:
 *       200:
 *         description: Funds withdrawn successfully
 *       400:
 *         description: Invalid input or insufficient funds
 *       401:
 *         description: Not authenticated
 */
router.post('/withdraw', protect, apiLimiter, validate(withdrawFundsSchema), walletController.withdrawFunds);

/**
 * @swagger
 * /wallets/change-currency:
 *   patch:
 *     summary: Change wallet currency
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currency
 *             properties:
 *               currency:
 *                 type: string
 *     responses:
 *       200:
 *         description: Currency changed successfully
 *       400:
 *         description: Invalid currency
 *       401:
 *         description: Not authenticated
 */
router.patch('/change-currency', protect, apiLimiter, walletController.changeWalletCurrency);

module.exports = router;