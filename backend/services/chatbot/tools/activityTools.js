const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const { ActivityLog, Pet } = require("../../../models");
const { Op } = require("sequelize");

/**
 * Tool: Get recent activity logs
 */
const getRecentActivities = tool(
  async ({ userId, petId, days = 7 }) => {
    try {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);
      
      const whereClause = {
        user_id: userId,
        timestamp: {
          [Op.gte]: dateFrom
        }
      };
      
      if (petId) {
        whereClause.pet_id = petId;
      }
      
      const activities = await ActivityLog.findAll({
        where: whereClause,
        include: [
          {
            model: Pet,
            as: 'pet',
            attributes: ['name', 'breed']
          }
        ],
        order: [['timestamp', 'DESC']],
        limit: 50
      });
      
      if (activities.length === 0) {
        return JSON.stringify({
          activities: [],
          count: 0,
          days,
          message: `No activity logs found in the last ${days} day(s).`
        });
      }
      
      const formattedActivities = activities.map(a => ({
        id: a.activity_id,
        type: a.activity_type,
        detail: a.detail,
        petName: a.pet?.name,
        petBreed: a.pet?.breed,
        timestamp: a.timestamp,
        hasPhoto: !!a.photo,
        photoUrl: a.photo
      }));
      
      return JSON.stringify({
        activities: formattedActivities,
        count: activities.length,
        days,
        message: `Found ${activities.length} activity log(s) in the last ${days} day(s).`
      });
    } catch (error) {
      return JSON.stringify({
        error: true,
        message: `Error fetching activities: ${error.message}`
      });
    }
  },
  {
    name: "get_recent_activities",
    description: "Get recent activity logs for user's pets. Use when user asks 'what happened recently', 'show activities', or 'what did my pets do'.",
    schema: z.object({
      userId: z.number().describe("The authenticated user's ID"),
      petId: z.number().optional().describe("Optional pet ID to filter activities for a specific pet"),
      days: z.number().optional().default(7).describe("Number of days to look back (default: 7)")
    })
  }
);

/**
 * Tool: Get activity by type
 */
const getActivitiesByType = tool(
  async ({ userId, activityType, limit = 10 }) => {
    try {
      const activities = await ActivityLog.findAll({
        where: {
          user_id: userId,
          activity_type: activityType
        },
        include: [
          {
            model: Pet,
            as: 'pet',
            attributes: ['name', 'breed']
          }
        ],
        order: [['timestamp', 'DESC']],
        limit: limit
      });
      
      if (activities.length === 0) {
        return JSON.stringify({
          activities: [],
          count: 0,
          activityType,
          message: `No ${activityType} activities found.`
        });
      }
      
      const formattedActivities = activities.map(a => ({
        id: a.activity_id,
        detail: a.detail,
        petName: a.pet?.name,
        timestamp: a.timestamp,
        hasPhoto: !!a.photo
      }));
      
      return JSON.stringify({
        activityType,
        activities: formattedActivities,
        count: activities.length,
        message: `Found ${activities.length} ${activityType} activity log(s).`
      });
    } catch (error) {
      return JSON.stringify({
        error: true,
        message: `Error fetching activities: ${error.message}`
      });
    }
  },
  {
    name: "get_activities_by_type",
    description: "Get activities filtered by type (feeding, walking, playing, grooming, medication, etc.). Use when user asks about specific activity types.",
    schema: z.object({
      userId: z.number().describe("The authenticated user's ID"),
      activityType: z.string().describe("Type of activity to filter"),
      limit: z.number().optional().default(10).describe("Maximum number of activities to return")
    })
  }
);

/**
 * Tool: Get activities with photos
 */
const getActivitiesWithPhotos = tool(
  async ({ userId, limit = 10 }) => {
    try {
      const activities = await ActivityLog.findAll({
        where: {
          user_id: userId,
          photo: {
            [Op.ne]: null
          }
        },
        include: [
          {
            model: Pet,
            as: 'pet',
            attributes: ['name', 'breed']
          }
        ],
        order: [['timestamp', 'DESC']],
        limit: limit
      });
      
      if (activities.length === 0) {
        return JSON.stringify({
          activities: [],
          count: 0,
          message: "No activity logs with photos found."
        });
      }
      
      const formattedActivities = activities.map(a => ({
        id: a.activity_id,
        type: a.activity_type,
        detail: a.detail,
        petName: a.pet?.name,
        timestamp: a.timestamp,
        photoUrl: a.photo
      }));
      
      return JSON.stringify({
        activities: formattedActivities,
        count: activities.length,
        message: `Found ${activities.length} activity log(s) with photos.`
      });
    } catch (error) {
      return JSON.stringify({
        error: true,
        message: `Error fetching activities with photos: ${error.message}`
      });
    }
  },
  {
    name: "get_activities_with_photos",
    description: "Get activity logs that include photos. Use when user asks 'show me photos', 'pictures of my pet', or 'activities with photos'.",
    schema: z.object({
      userId: z.number().describe("The authenticated user's ID"),
      limit: z.number().optional().default(10).describe("Maximum number of activities to return")
    })
  }
);

module.exports = {
  getRecentActivities,
  getActivitiesByType,
  getActivitiesWithPhotos
};
