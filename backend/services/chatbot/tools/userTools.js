const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const { User, Notification } = require("../../../models");
const { Pet, Booking, Review } = require("../../../models");
const { Op } = require("sequelize");

/**
 * Tool: Get user profile information
 */
const getUserProfile = tool(
  async ({ userId }) => {
    try {
      const user = await User.findByPk(userId, {
        attributes: [
          'id', 'email', 'first_name', 'last_name', 'phone_number',
          'user_type', 'address', 'city', 'emergency_contact_name',
          'emergency_contact_number', 'is_profile_complete', 'email_verified',
          'date_joined', 'last_login'
        ]
      });
      
      if (!user) {
        return JSON.stringify({
          found: false,
          message: "User profile not found."
        });
      }
      
      // Get counts
      const petCount = await Pet.count({ where: { user_id: userId, deleted_at: null } });
      const bookingCount = await Booking.count({ where: { user_id: userId } });
      const reviewCount = await Review.count({ where: { user_id: userId } });
      
      const profile = {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone_number,
        userType: user.user_type,
        address: user.address,
        city: user.city,
        emergencyContact: {
          name: user.emergency_contact_name,
          phone: user.emergency_contact_number
        },
        isProfileComplete: user.is_profile_complete,
        emailVerified: user.email_verified,
        dateJoined: user.date_joined,
        lastLogin: user.last_login,
        stats: {
          totalPets: petCount,
          totalBookings: bookingCount,
          totalReviews: reviewCount
        }
      };
      
      return JSON.stringify({
        found: true,
        profile,
        message: `Profile for ${user.first_name} ${user.last_name}.`
      });
    } catch (error) {
      return JSON.stringify({
        error: true,
        message: `Error fetching profile: ${error.message}`
      });
    }
  },
  {
    name: "get_user_profile",
    description: "Get user's profile information. Use when user asks 'show my profile', 'my account', or 'my contact info'.",
    schema: z.object({
      userId: z.number().describe("The authenticated user's ID")
    })
  }
);

/**
 * Tool: Get user notifications
 */
const getUserNotifications = tool(
  async ({ userId, unreadOnly = false, limit = 10 }) => {
    try {
      const whereClause = {
        user_id: userId
      };
      
      if (unreadOnly) {
        whereClause.is_read = false;
      }
      
      const notifications = await Notification.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
        limit: limit,
        attributes: [
          'notification_id', 'message', 'is_read', 'notification_type', 'created_at'
        ]
      });
      
      if (notifications.length === 0) {
        return JSON.stringify({
          notifications: [],
          count: 0,
          message: unreadOnly 
            ? "You have no unread notifications."
            : "You have no notifications."
        });
      }
      
      const formattedNotifications = notifications.map(n => ({
        id: n.notification_id,
        message: n.message,
        type: n.notification_type,
        isRead: n.is_read,
        createdAt: n.created_at
      }));
      
      const unreadCount = await Notification.count({
        where: { user_id: userId, is_read: false }
      });
      
      return JSON.stringify({
        notifications: formattedNotifications,
        count: notifications.length,
        unreadCount,
        message: unreadOnly
          ? `You have ${notifications.length} unread notification(s).`
          : `You have ${notifications.length} notification(s), ${unreadCount} unread.`
      });
    } catch (error) {
      return JSON.stringify({
        error: true,
        message: `Error fetching notifications: ${error.message}`
      });
    }
  },
  {
    name: "get_user_notifications",
    description: "Get user's notifications. Use when user asks 'show my notifications', 'any updates', or 'unread messages'.",
    schema: z.object({
      userId: z.number().describe("The authenticated user's ID"),
      unreadOnly: z.boolean().optional().default(false).describe("Only return unread notifications"),
      limit: z.number().optional().default(10).describe("Maximum number of notifications to return")
    })
  }
);

/**
 * Tool: Get user summary
 */
const getUserSummary = tool(
  async ({ userId }) => {
    try {
      const user = await User.findByPk(userId, {
        attributes: ['first_name', 'last_name', 'email', 'date_joined']
      });
      
      if (!user) {
        return JSON.stringify({
          found: false,
          message: "User not found."
        });
      }
      
      const pets = await Pet.count({ where: { user_id: userId, deleted_at: null } });
      const bookings = await Booking.count({ where: { user_id: userId } });
      const pendingBookings = await Booking.count({ where: { user_id: userId, status: 'pending' } });
      const confirmedBookings = await Booking.count({ where: { user_id: userId, status: 'confirmed' } });
      const unreadNotifications = await Notification.count({ where: { user_id: userId, is_read: false } });
      
      const summary = {
        userName: `${user.first_name} ${user.last_name}`,
        email: user.email,
        memberSince: user.date_joined,
        statistics: {
          totalPets: pets,
          totalBookings: bookings,
          pendingBookings,
          confirmedBookings,
          unreadNotifications
        }
      };
      
      return JSON.stringify({
        found: true,
        summary,
        message: `You have ${pets} pet(s), ${confirmedBookings} confirmed booking(s), and ${unreadNotifications} unread notification(s).`
      });
    } catch (error) {
      return JSON.stringify({
        error: true,
        message: `Error fetching summary: ${error.message}`
      });
    }
  },
  {
    name: "get_user_summary",
    description: "Get a summary of user's account and activity. Use when user asks 'give me a summary', 'overview of my account', or 'what's my status'.",
    schema: z.object({
      userId: z.number().describe("The authenticated user's ID")
    })
  }
);

module.exports = {
  getUserProfile,
  getUserNotifications,
  getUserSummary
};
