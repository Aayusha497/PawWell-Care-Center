/**
 * Pet Validators
 * 
 * Validation rules for pet profile operations
 */

const { body, param } = require('express-validator');

/**
 * Validation rules for creating a pet
 */
const createPetValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Pet name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Pet name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Pet name can only contain letters and spaces'),

  body('breed')
    .trim()
    .notEmpty()
    .withMessage('Breed is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Breed must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Breed can only contain letters and spaces'),

  body('age')
    .notEmpty()
    .withMessage('Age is required')
    .isInt({ min: 0, max: 50 })
    .withMessage('Age must be a number between 0 and 50'),

  body('weight')
    .notEmpty()
    .withMessage('Weight is required')
    .isFloat({ min: 0.1, max: 999.99 })
    .withMessage('Weight must be a number between 0.1 and 999.99 kg'),

  body('height')
    .notEmpty()
    .withMessage('Height is required')
    .isFloat({ min: 0.1, max: 999.99 })
    .withMessage('Height must be a number between 0.1 and 999.99 cm'),

  body('sex')
    .trim()
    .notEmpty()
    .withMessage('Sex is required')
    .isIn(['Male', 'Female'])
    .withMessage('Sex must be either Male or Female'),

  body('allergies')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Allergies must not exceed 1000 characters')
    .matches(/^[a-zA-Z0-9\s,.\-()]+$/)
    .withMessage('Allergies can only contain letters, numbers, spaces, and basic punctuation (,.-())'),

  body('triggering_point')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Triggering point must not exceed 1000 characters'),

  body('medical_history')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Medical history must not exceed 5000 characters'),
];

/**
 * Validation rules for updating a pet
 */
const updatePetValidation = [
  param('petId')
    .isInt({ min: 1 })
    .withMessage('Invalid pet ID'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Pet name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Pet name can only contain letters and spaces'),

  body('breed')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Breed must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Breed can only contain letters and spaces'),

  body('age')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Age must be a number between 0 and 50'),

  body('weight')
    .optional()
    .isFloat({ min: 0.1, max: 999.99 })
    .withMessage('Weight must be a number between 0.1 and 999.99 kg'),

  body('height')
    .optional()
    .isFloat({ min: 0.1, max: 999.99 })
    .withMessage('Height must be a number between 0.1 and 999.99 cm'),

  body('sex')
    .optional()
    .trim()
    .isIn(['Male', 'Female'])
    .withMessage('Sex must be either Male or Female'),

  body('allergies')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Allergies must not exceed 1000 characters')
    .matches(/^[a-zA-Z0-9\s,.\-()]+$/)
    .withMessage('Allergies can only contain letters, numbers, spaces, and basic punctuation (,.-())'),

  body('triggering_point')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Triggering point must not exceed 1000 characters'),

  body('medical_history')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Medical history must not exceed 5000 characters'),
];

/**
 * Validation rules for pet ID parameter
 */
const petIdValidation = [
  param('petId')
    .isInt({ min: 1 })
    .withMessage('Invalid pet ID'),
];

module.exports = {
  createPetValidation,
  updatePetValidation,
  petIdValidation,
};
