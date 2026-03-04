const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const { WellnessTimeline, Pet } = require("../../../models");
const { Op } = require("sequelize");

/**
 * Tool: Get wellness timeline for a pet
 */
const getWellnessTimeline = tool(
  async ({ userId, petId, limit = 10 }) => {
    try {
      // Verify pet belongs to user
      const pet = await Pet.findOne({
        where: {
          pet_id: petId,
          user_id: userId,
          deleted_at: null
        },
        attributes: ['name', 'breed']
      });
      
      if (!pet) {
        return JSON.stringify({
          found: false,
          message: "Pet not found or you don't have access to it."
        });
      }
      
      const timeline = await WellnessTimeline.findAll({
        where: {
          pet_id: petId
        },
        order: [['date', 'DESC']],
        limit: limit,
        attributes: [
          'timeline_id', 'date', 'type', 'title', 'description', 'next_due_date', 'created_at'
        ]
      });
      
      if (timeline.length === 0) {
        return JSON.stringify({
          petName: pet.name,
          timeline: [],
          count: 0,
          message: `No wellness records found for ${pet.name}.`
        });
      }
      
      const formattedTimeline = timeline.map(t => ({
        id: t.timeline_id,
        date: t.date,
        type: t.type,
        title: t.title,
        description: t.description,
        nextDueDate: t.next_due_date,
        createdAt: t.created_at
      }));
      
      return JSON.stringify({
        petName: pet.name,
        petBreed: pet.breed,
        timeline: formattedTimeline,
        count: timeline.length,
        message: `Found ${timeline.length} wellness record(s) for ${pet.name}.`
      });
    } catch (error) {
      return JSON.stringify({
        error: true,
        message: `Error fetching wellness timeline: ${error.message}`
      });
    }
  },
  {
    name: "get_wellness_timeline",
    description: "Get wellness and health timeline for a pet. Use when user asks about medical history, vaccinations, vet visits, or health records.",
    schema: z.object({
      userId: z.number().describe("The authenticated user's ID"),
      petId: z.number().describe("The pet ID to get wellness timeline for"),
      limit: z.number().optional().default(10).describe("Maximum number of records to return")
    })
  }
);

/**
 * Tool: Get upcoming vaccinations
 */
const getUpcomingVaccinations = tool(
  async ({ userId, petId }) => {
    try {
      // Verify pet belongs to user
      const pet = await Pet.findOne({
        where: {
          pet_id: petId,
          user_id: userId,
          deleted_at: null
        },
        attributes: ['name', 'breed']
      });
      
      if (!pet) {
        return JSON.stringify({
          found: false,
          message: "Pet not found or you don't have access to it."
        });
      }
      
      const today = new Date();
      const vaccinations = await WellnessTimeline.findAll({
        where: {
          pet_id: petId,
          type: 'vaccination',
          next_due_date: {
            [Op.gte]: today
          }
        },
        order: [['next_due_date', 'ASC']],
        attributes: ['timeline_id', 'title', 'description', 'date', 'next_due_date']
      });
      
      if (vaccinations.length === 0) {
        return JSON.stringify({
          petName: pet.name,
          vaccinations: [],
          count: 0,
          message: `No upcoming vaccinations scheduled for ${pet.name}.`
        });
      }
      
      const formattedVaccinations = vaccinations.map(v => {
        const daysUntilDue = Math.ceil((new Date(v.next_due_date) - today) / (1000 * 60 * 60 * 24));
        return {
          id: v.timeline_id,
          title: v.title,
          description: v.description,
          lastGiven: v.date,
          nextDue: v.next_due_date,
          daysUntilDue,
          isOverdue: daysUntilDue < 0,
          isDueSoon: daysUntilDue <= 30 && daysUntilDue >= 0
        };
      });
      
      return JSON.stringify({
        petName: pet.name,
        petBreed: pet.breed,
        vaccinations: formattedVaccinations,
        count: vaccinations.length,
        message: `${pet.name} has ${vaccinations.length} upcoming vaccination(s).`
      });
    } catch (error) {
      return JSON.stringify({
        error: true,
        message: `Error fetching vaccinations: ${error.message}`
      });
    }
  },
  {
    name: "get_upcoming_vaccinations",
    description: "Get upcoming vaccinations for a pet. Use when user asks 'when is vaccination due', 'upcoming vaccines', or 'shots needed'.",
    schema: z.object({
      userId: z.number().describe("The authenticated user's ID"),
      petId: z.number().describe("The pet ID to get vaccinations for")
    })
  }
);

/**
 * Tool: Get wellness by type
 */
const getWellnessByType = tool(
  async ({ userId, petId, wellnessType, limit = 5 }) => {
    try {
      // Verify pet belongs to user
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
      
      const records = await WellnessTimeline.findAll({
        where: {
          pet_id: petId,
          type: wellnessType
        },
        order: [['date', 'DESC']],
        limit: limit,
        attributes: ['timeline_id', 'date', 'title', 'description', 'next_due_date']
      });
      
      if (records.length === 0) {
        return JSON.stringify({
          petName: pet.name,
          wellnessType,
          records: [],
          count: 0,
          message: `No ${wellnessType} records found for ${pet.name}.`
        });
      }
      
      const formattedRecords = records.map(r => ({
        id: r.timeline_id,
        date: r.date,
        title: r.title,
        description: r.description,
        nextDue: r.next_due_date
      }));
      
      return JSON.stringify({
        petName: pet.name,
        wellnessType,
        records: formattedRecords,
        count: records.length,
        message: `Found ${records.length} ${wellnessType} record(s) for ${pet.name}.`
      });
    } catch (error) {
      return JSON.stringify({
        error: true,
        message: `Error fetching wellness records: ${error.message}`
      });
    }
  },
  {
    name: "get_wellness_by_type",
    description: "Get wellness records filtered by type (vaccination, checkup, medication, surgery, etc.). Use when user asks about specific health record types.",
    schema: z.object({
      userId: z.number().describe("The authenticated user's ID"),
      petId: z.number().describe("The pet ID to get records for"),
      wellnessType: z.string().describe("Type of wellness record (vaccination, checkup, medication, surgery, etc.)"),
      limit: z.number().optional().default(5).describe("Maximum number of records to return")
    })
  }
);

module.exports = {
  getWellnessTimeline,
  getUpcomingVaccinations,
  getWellnessByType
};
