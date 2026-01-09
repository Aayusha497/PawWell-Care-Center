/**
 * Pet Controller
 * 
 * Handles all pet profile CRUD operations
 */

const { Pet } = require('../models');
const { deleteImage } = require('../config/cloudinary');

/**
 * Create a new pet profile
 * POST /api/pets
 */
const createPet = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, breed, age, weight, height, sex, allergies, triggering_point, medical_history } = req.body;

    // Check if photo was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Pet photo is required',
      });
    }

    // Get Cloudinary URL from uploaded file
    const photoUrl = req.file.path;

    // Create pet in database
    const pet = await Pet.create({
      user_id: userId,
      name: name.trim(),
      breed: breed.trim(),
      age: parseInt(age),
      weight: parseFloat(weight),
      height: parseFloat(height),
      sex: sex.trim(),
      allergies: allergies?.trim() || null,
      triggering_point: triggering_point?.trim() || null,
      medical_history: medical_history?.trim() || null,
      photo: photoUrl,
    });

    res.status(201).json({
      success: true,
      message: 'Pet profile created successfully',
      data: pet,
    });
  } catch (error) {
    console.error('Error creating pet:', error);
    
    // Delete uploaded image if pet creation fails
    if (req.file) {
      try {
        await deleteImage(req.file.path);
      } catch (deleteError) {
        console.error('Error deleting uploaded image:', deleteError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create pet profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get all pets for the logged-in user
 * GET /api/pets
 */
const getUserPets = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch only non-deleted pets (paranoid: true automatically excludes soft-deleted)
    const pets = await Pet.findAll({
      where: {
        user_id: userId,
      },
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({
      success: true,
      count: pets.length,
      data: pets,
    });
  } catch (error) {
    console.error('Error fetching pets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pets',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get a specific pet by ID
 * GET /api/pets/:petId
 */
const getPetById = async (req, res) => {
  try {
    const userId = req.user.id;
    const petId = parseInt(req.params.petId);

    // findByPk with paranoid mode automatically excludes soft-deleted pets
    const pet = await Pet.findByPk(petId);

    // Check if pet exists (or if it's soft-deleted)
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
      });
    }

    // Check if pet belongs to the logged-in user
    if (pet.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this pet',
      });
    }

    res.status(200).json({
      success: true,
      data: pet,
    });
  } catch (error) {
    console.error('Error fetching pet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pet',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Update a pet profile
 * PUT /api/pets/:petId
 */
const updatePet = async (req, res) => {
  try {
    const userId = req.user.id;
    const petId = parseInt(req.params.petId);
    const { name, breed, age, weight, height, sex, allergies, triggering_point, medical_history } = req.body;

    // Check if pet exists and belongs to user
    const existingPet = await Pet.findByPk(petId);

    if (!existingPet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
      });
    }

    if (existingPet.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this pet',
      });
    }

    // Prepare update data
    const updateData = {};

    if (name) updateData.name = name.trim();
    if (breed) updateData.breed = breed.trim();
    if (age !== undefined) updateData.age = parseInt(age);
    if (weight !== undefined) updateData.weight = parseFloat(weight);
    if (height !== undefined) updateData.height = parseFloat(height);
    if (sex) updateData.sex = sex.trim();
    if (allergies !== undefined) updateData.allergies = allergies?.trim() || null;
    if (triggering_point !== undefined) updateData.triggering_point = triggering_point?.trim() || null;
    if (medical_history !== undefined) updateData.medical_history = medical_history?.trim() || null;

    // Handle photo update if new photo is uploaded
    if (req.file) {
      // Delete old photo from Cloudinary
      try {
        await deleteImage(existingPet.photo);
      } catch (deleteError) {
        console.error('Error deleting old photo:', deleteError);
        // Continue even if deletion fails
      }
      
      updateData.photo = req.file.path;
    }

    // Update pet in database
    await existingPet.update(updateData);

    res.status(200).json({
      success: true,
      message: 'Pet profile updated successfully',
      data: existingPet,
    });
  } catch (error) {
    console.error('Error updating pet:', error);
    
    // Delete newly uploaded image if update fails
    if (req.file) {
      try {
        await deleteImage(req.file.path);
      } catch (deleteError) {
        console.error('Error deleting uploaded image:', deleteError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update pet profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Delete a pet profile (SOFT DELETE)
 * DELETE /api/pets/:petId
 */
const deletePet = async (req, res) => {
  try {
    const userId = req.user.id;
    const petId = parseInt(req.params.petId);

    // Check if pet exists and belongs to user
    const existingPet = await Pet.findByPk(petId);

    if (!existingPet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
      });
    }

    if (existingPet.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this pet',
      });
    }

    // SOFT DELETE: Set deleted_at timestamp (paranoid mode does this automatically)
    // Data remains in database but is hidden from queries
    await existingPet.destroy();

    // Note: We keep the photo in Cloudinary for audit/recovery purposes
    // If needed, photos can be cleaned up later with a separate maintenance job

    res.status(200).json({
      success: true,
      message: 'Pet profile deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting pet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete pet profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  createPet,
  getUserPets,
  getPetById,
  updatePet,
  deletePet,
};
