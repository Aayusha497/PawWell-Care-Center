/**
 * Pet Routes
 * 
 * Defines all routes for pet profile management
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const { handleValidationErrors } = require('../middleware/validator');
const {
  createPetValidation,
  updatePetValidation,
  petIdValidation,
} = require('../validators/petValidators');
const {
  createPet,
  getUserPets,
  getPetById,
  updatePet,
  deletePet,
} = require('../controllers/petController');

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/pets
 * @desc    Create a new pet profile
 * @access  Private (pet_owner)
 */
router.post(
  '/',
  requireRole('pet_owner'),
  upload.single('photo'),
  createPetValidation,
  handleValidationErrors,
  createPet
);

/**
 * @route   GET /api/pets
 * @desc    Get all pets for the logged-in user (or all pets for admin/staff)
 * @access  Private (authenticated)
 */
router.get('/', getUserPets);

/**
 * @route   GET /api/pets/:petId
 * @desc    Get a specific pet by ID
 * @access  Private (authenticated)
 */
router.get(
  '/:petId',
  petIdValidation,
  handleValidationErrors,
  getPetById
);

/**
 * @route   PUT /api/pets/:petId
 * @desc    Update a pet profile
 * @access  Private (pet_owner)
 */
router.put(
  '/:petId',
  requireRole('pet_owner'),
  upload.single('photo'),
  updatePetValidation,
  handleValidationErrors,
  updatePet
);

/**
 * @route   DELETE /api/pets/:petId
 * @desc    Delete a pet profile
 * @access  Private (pet_owner)
 */
router.delete(
  '/:petId',
  requireRole('pet_owner'),
  petIdValidation,
  handleValidationErrors,
  deletePet
);

module.exports = router;
