const express = require('express');
const transactionController = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');
const apiLimiter = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Transaction management
 */

/**
 * @swagger
 * /transactions/history:
 *   get:
 *     summary: Get transaction history
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [DEPOSIT, WITHDRAWAL, TRANSFER]
 *         description: Filter by transaction type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED, FLAGGED]
 *         description: Filter by transaction status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *     responses:
 *       200:
 *         description: Transaction history
 *       401:
 *         description: Not authenticated
 */
router.get('/history', protect, apiLimiter, transactionController.getTransactionHistory);

/**
 * @swagger
 * /transactions/summary:
 *   get:
 *     summary: Get transaction summary for a period
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *         description: Period for summary
 *     responses:
 *       200:
 *         description: Transaction summary
 *       401:
 *         description: Not authenticated
 */
router.get('/summary', protect, apiLimiter, transactionController.getTransactionSummary);

/**
 * @swagger
 * /transactions/report:
 *   get:
 *     summary: Get transaction report
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for report
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for report
 *     responses:
 *       200:
 *         description: Transaction report
 *       400:
 *         description: Invalid date range
 *       401:
 *         description: Not authenticated
 */
router.get('/report', protect, apiLimiter, transactionController.getTransactionReport);

/**
 * @swagger
 * /transactions/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction details
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Transaction not found
 */
router.get('/:id', protect, apiLimiter, transactionController.getTransaction);

module.exports = router;