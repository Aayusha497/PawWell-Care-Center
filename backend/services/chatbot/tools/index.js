/**
 * Tool Registry - Central export for all chatbot tools
 * 
 * This file imports and exports all available tools that the LangGraph agent
 * can use to query the database and provide information to users.
 */

const bookingTools = require('./bookingTools');
const petTools = require('./petTools');
const serviceTools = require('./serviceTools');
const activityTools = require('./activityTools');
const userTools = require('./userTools');
const wellnessTools = require('./wellnessTools');

// Export all tools as a single array for the agent
const allTools = [
  // Booking Tools (3)
  bookingTools.checkAvailability,
  bookingTools.getUserBookings,
  bookingTools.getBookingDetails,
  
  // Pet Tools (3)
  petTools.getUserPets,
  petTools.getPetDetails,
  petTools.getPetActivities,
  
  // Service Tools (4)
  serviceTools.getServices,
  serviceTools.getServicePricing,
  serviceTools.getServiceReviews,
  serviceTools.getServiceRatings,
  
  // Activity Tools (3)
  activityTools.getRecentActivities,
  activityTools.getActivitiesByType,
  activityTools.getActivitiesWithPhotos,
  
  // User Tools (3)
  userTools.getUserProfile,
  userTools.getUserNotifications,
  userTools.getUserSummary,
  
  // Wellness Tools (3)
  wellnessTools.getWellnessTimeline,
  wellnessTools.getUpcomingVaccinations,
  wellnessTools.getWellnessByType
];

// Export by category for organized access
module.exports = {
  // All tools in one array (for LangGraph agent)
  allTools,
  
  // Tools by category
  bookingTools,
  petTools,
  serviceTools,
  activityTools,
  userTools,
  wellnessTools,
  
  // Total count
  toolCount: allTools.length
};
