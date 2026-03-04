const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const { Pet, WellnessTimeline, Booking, ActivityLog } = require("../../../models");
const { Op } = require("sequelize");

/**
 * Tool: Get all user's pets
 */
const getUserPets = tool(
  async ({ userId }) => {
    try {
      const pets = await Pet.findAll({
        where: {
          user_id: userId,
          deleted_at: null
        },
        attributes: [
          'pet_id', 'name', 'breed', 'age', 'weight', 'height', 
          'sex', 'medical_history', 'allergies', 'triggering_point', 
          'photo', 'created_at'
        ],
        order: [['created_at', 'DESC']]
      });
      
      if (pets.length === 0) {
        return JSON.stringify({
          pets: [],
          count: 0,
          message: "You haven't registered any pets yet. Would you like to add one?"
        });
      }
      
      const formattedPets = pets.map(pet => ({
        id: pet.pet_id,
        name: pet.name,
        breed: pet.breed,
        age: pet.age,
        weight: pet.weight ? parseFloat(pet.weight) : null,
        height: pet.height ? parseFloat(pet.height) : null,
        sex: pet.sex,
        medicalHistory: pet.medical_history,
        allergies: pet.allergies,
        triggeringPoints: pet.triggering_point,
        hasPhoto: !!pet.photo,
        registeredDate: pet.created_at
      }));
      
      return JSON.stringify({
        pets: formattedPets,
        count: pets.length,
        message: `You have ${pets.length} registered pet(s).`
      });
    } catch (error) {
      return JSON.stringify({
        error: true,
        message: `Error fetching pets: ${error.message}`
      });
    }
  },
  {
    name: "get_user_pets",
    description: "Get all pets registered by the user. Use this when user asks 'what are my pets', 'show my pets', or mentions their pet names without context.",
    schema: z.object({
      userId: z.number().describe("The authenticated user's ID")
    })
  }
);

/**
 * Tool: Get detailed pet information
 */
const getPetDetails = tool(
  async ({ userId, petId }) => {
    try {
      const pet = await Pet.findOne({
        where: {
          pet_id: petId,
          user_id: userId, // Ensure user can only access their own pets
          deleted_at: null
        },
        include: [
          {
            model: WellnessTimeline,
            as: 'wellnessTimeline',
            order: [['date', 'DESC']],
            limit: 5
          },
          {
            model: Booking,
            as: 'bookings',
            where: {
              status: { [Op.in]: ['confirmed', 'pending'] }
            },
            required: false,
            order: [['start_date', 'DESC']],
            limit: 3
          }
        ]
      });
      
      if (!pet) {
        return JSON.stringify({
          found: false,
          message: "Pet not found or you don't have access to it."
        });
      }
      
      const details = {
        id: pet.pet_id,
        name: pet.name,
        breed: pet.breed,
        age: pet.age,
        weight: pet.weight ? parseFloat(pet.weight) : null,
        height: pet.height ? parseFloat(pet.height) : null,
        sex: pet.sex,
        medicalHistory: pet.medical_history,
        allergies: pet.allergies,
        triggeringPoints: pet.triggering_point,
        photo: pet.photo,
        recentWellnessEvents: pet.wellnessTimeline ? pet.wellnessTimeline.map(w => ({
          type: w.type,
          title: w.title,
          description: w.description,
          date: w.date,
          nextDue: w.next_due_date
        })) : [],
        upcomingBookings: pet.bookings ? pet.bookings.map(b => ({
          id: b.booking_id,
          serviceType: b.service_type,
          startDate: b.start_date,
          endDate: b.end_date,
          status: b.status
        })) : [],
        registeredAt: pet.created_at,
        updatedAt: pet.updated_at
      };
      
      return JSON.stringify({
        found: true,
        pet: details
      });
    } catch (error) {
      return JSON.stringify({
        error: true,
        message: `Error fetching pet details: ${error.message}`
      });
    }
  },
  {
    name: "get_pet_details",
    description: "Get detailed information about a specific pet including wellness history and upcoming bookings. Use this when user asks about a specific pet by name or ID.",
    schema: z.object({
      userId: z.number().describe("The authenticated user's ID"),
      petId: z.number().describe("The pet ID to get details for")
    })
  }
);

/**
 * Tool: Get pet's recent activities
 */
const getPetActivities = tool(
  async ({ userId, petId, limit = 10 }) => {
    try {
      // First verify the pet belongs to the user
      const pet = await Pet.findOne({
        where: {
          pet_id: petId,
          user_id: userId,
          deleted_at: null
        },
        attributes: ['name']
      });
      
      if (!pet) {
        return JSON.stringify({
          found: false,
          message: "Pet not found or you don't have access to it."
        });
      }
      
      const activities = await ActivityLog.findAll({
        where: {
          pet_id: petId,
          user_id: userId
        },
        order: [['timestamp', 'DESC']],
        limit: limit,
        attributes: [
          'activity_id', 'activity_type', 'detail', 'timestamp',
          'photo', 'notify_owner'
        ]
      });
      
      if (activities.length === 0) {
        return JSON.stringify({
          petName: pet.name,
          activities: [],
          count: 0,
          message: `No activity logs found for ${pet.name}.`
        });
      }
      
      const formattedActivities = activities.map(a => ({
        id: a.activity_id,
        type: a.activity_type,
        detail: a.detail,
        timestamp: a.timestamp,
        hasPhoto: !!a.photo,
        photoUrl: a.photo,
        notifiedOwner: a.notify_owner
      }));
      
      return JSON.stringify({
        petName: pet.name,
        activities: formattedActivities,
        count: activities.length,
        message: `Found ${activities.length} recent activity log(s) for ${pet.name}.`
      });
    } catch (error) {
      return JSON.stringify({
        error: true,
        message: `Error fetching pet activities: ${error.message}`
      });
    }
  },
  {
    name: "get_pet_activities",
    description: "Get recent activity logs for a specific pet. Use this when user asks 'what did my pet do today', 'show activities', or 'what has [pet name] been doing'.",
    schema: z.object({
      userId: z.number().describe("The authenticated user's ID"),
      petId: z.number().describe("The pet ID to get activities for"),
      limit: z.number().optional().default(10).describe("Maximum number of activities to return")
    })
  }
);

module.exports = {
  getUserPets,
  getPetDetails,
  getPetActivities
};
