const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const { Service, Review } = require("../../../models");
const { Op, fn, col } = require("sequelize");

/**
 * Tool: Get all available services
 */
const getServices = tool(
  async () => {
    try {
      const services = await Service.findAll({
        attributes: ['service_id', 'name', 'description', 'base_price'],
        order: [['name', 'ASC']]
      });
      
      if (services.length === 0) {
        return JSON.stringify({
          services: [],
          count: 0,
          message: "No services available at this time."
        });
      }
      
      const formattedServices = services.map(s => ({
        id: s.service_id,
        name: s.name,
        description: s.description,
        basePrice: parseFloat(s.base_price),
        priceDisplay: `$${parseFloat(s.base_price).toFixed(2)}`
      }));
      
      return JSON.stringify({
        services: formattedServices,
        count: services.length,
        message: `We offer ${services.length} service(s).`
      });
    } catch (error) {
      return JSON.stringify({
        error: true,
        message: `Error fetching services: ${error.message}`
      });
    }
  },
  {
    name: "get_services",
    description: "Get all available services with pricing. Use this when user asks 'what services do you offer', 'show me prices', or 'what can I book'.",
    schema: z.object({})
  }
);

/**
 * Tool: Get service pricing
 */
const getServicePricing = tool(
  async ({ serviceName }) => {
    try {
      const service = await Service.findOne({
        where: {
          name: {
            [Op.iLike]: `%${serviceName}%`
          }
        },
        attributes: ['service_id', 'name', 'description', 'base_price']
      });
      
      if (!service) {
        return JSON.stringify({
          found: false,
          message: `Service "${serviceName}" not found. Please use get_services tool to see available options.`
        });
      }
      
      return JSON.stringify({
        found: true,
        service: {
          id: service.service_id,
          name: service.name,
          description: service.description,
          basePrice: parseFloat(service.base_price),
          priceDisplay: `$${parseFloat(service.base_price).toFixed(2)}`,
          message: `${service.name} costs $${parseFloat(service.base_price).toFixed(2)}.`
        }
      });
    } catch (error) {
      return JSON.stringify({
        error: true,
        message: `Error fetching service pricing: ${error.message}`
      });
    }
  },
  {
    name: "get_service_pricing",
    description: "Get pricing for a specific service by name. Use when user asks 'how much does [service] cost' or 'price of [service]'.",
    schema: z.object({
      serviceName: z.string().describe("Name or partial name of the service")
    })
  }
);

/**
 * Tool: Get service reviews
 */
const getServiceReviews = tool(
  async ({ serviceType, limit = 5 }) => {
    try {
      const reviews = await Review.findAll({
        where: {
          service_type: serviceType
        },
        attributes: ['review_id', 'overall_rating', 'review_text', 'created_at'],
        order: [['created_at', 'DESC']],
        limit: limit
      });
      
      if (reviews.length === 0) {
        return JSON.stringify({
          reviews: [],
          count: 0,
          averageRating: 0,
          message: `No reviews found for ${serviceType} service.`
        });
      }
      
      const avgRating = reviews.reduce((sum, r) => sum + parseFloat(r.overall_rating), 0) / reviews.length;
      
      const formattedReviews = reviews.map(r => ({
        id: r.review_id,
        rating: parseFloat(r.overall_rating),
        text: r.review_text,
        date: r.created_at
      }));
      
      return JSON.stringify({
        serviceType,
        reviews: formattedReviews,
        count: reviews.length,
        averageRating: avgRating.toFixed(1),
        message: `${serviceType} has an average rating of ${avgRating.toFixed(1)}/5 based on ${reviews.length} review(s).`
      });
    } catch (error) {
      return JSON.stringify({
        error: true,
        message: `Error fetching reviews: ${error.message}`
      });
    }
  },
  {
    name: "get_service_reviews",
    description: "Get customer reviews for a specific service type. Use when user asks about ratings, reviews, or feedback.",
    schema: z.object({
      serviceType: z.string().describe("Service type to get reviews for"),
      limit: z.number().optional().default(5).describe("Maximum number of reviews to return")
    })
  }
);

/**
 * Tool: Get service ratings
 */
const getServiceRatings = tool(
  async ({ serviceType }) => {
    try {
      const reviews = await Review.findAll({
        where: {
          service_type: serviceType
        },
        attributes: ['overall_rating']
      });
      
      if (reviews.length === 0) {
        return JSON.stringify({
          found: false,
          serviceType,
          message: `No ratings found for ${serviceType} service yet.`
        });
      }
      
      const ratings = reviews.map(r => parseFloat(r.overall_rating));
      const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      const maxRating = Math.max(...ratings);
      const minRating = Math.min(...ratings);
      
      const ratingDistribution = {
        5: ratings.filter(r => r === 5).length,
        4: ratings.filter(r => r >= 4 && r < 5).length,
        3: ratings.filter(r => r >= 3 && r < 4).length,
        2: ratings.filter(r => r >= 2 && r < 3).length,
        1: ratings.filter(r => r < 2).length
      };
      
      return JSON.stringify({
        found: true,
        serviceType,
        totalReviews: reviews.length,
        averageRating: avgRating.toFixed(2),
        highestRating: maxRating,
        lowestRating: minRating,
        distribution: ratingDistribution,
        message: `${serviceType} has an average rating of ${avgRating.toFixed(1)}/5 from ${reviews.length} review(s).`
      });
    } catch (error) {
      return JSON.stringify({
        error: true,
        message: `Error fetching ratings: ${error.message}`
      });
    }
  },
  {
    name: "get_service_ratings",
    description: "Get rating statistics for a service. Use when user asks 'what's the rating for [service]' or 'how is [service] rated'.",
    schema: z.object({
      serviceType: z.string().describe("Service type to get ratings for")
    })
  }
);

module.exports = {
  getServices,
  getServicePricing,
  getServiceReviews,
  getServiceRatings
};
