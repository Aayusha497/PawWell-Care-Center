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

// All routes require authentication and pet_owner role
router.use(authenticate);
router.use(requireRole('pet_owner'));

/**
 * @route   POST /api/pets
 * @desc    Create a new pet profile
 * @access  Private (pet_owner)
 */
router.post(
  '/',
  upload.single('photo'),
  createPetValidation,
  handleValidationErrors,
  createPet
);

/**
 * @route   GET /api/pets
 * @desc    Get all pets for the logged-in user
 * @access  Private (pet_owner)
 */
router.get('/', getUserPets);

/**
 * @route   GET /api/pets/:petId
 * @desc    Get a specific pet by ID
 * @access  Private (pet_owner)
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
  petIdValidation,
  handleValidationErrors,
  deletePet
);

module.exports = router;
