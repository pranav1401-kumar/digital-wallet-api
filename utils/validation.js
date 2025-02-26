const Joi = require('joi');


const userRegisterSchema = Joi.object({
  name: Joi.string().required().min(3).max(50),
  email: Joi.string().email().required(),
  password: Joi.string().required().min(6),
  defaultCurrency: Joi.string().default('USD').length(3)
});

const userLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});


const addFundsSchema = Joi.object({
  amount: Joi.number().positive().required(),
  currency: Joi.string().length(3).default('USD')
});

const transferFundsSchema = Joi.object({
  recipientId: Joi.string().required(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().length(3).default('USD')
});

const withdrawFundsSchema = Joi.object({
  amount: Joi.number().positive().required(),
  currency: Joi.string().length(3).default('USD')
});


const updateCurrencySchema = Joi.object({
  defaultCurrency: Joi.string().length(3).required()
});

module.exports = {
  userRegisterSchema,
  userLoginSchema,
  addFundsSchema,
  transferFundsSchema,
  withdrawFundsSchema,
  updateCurrencySchema
};
