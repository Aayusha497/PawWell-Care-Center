const emergencyService = require('../services/emergencyService');
const { sendEmail } = require('../utils/emailService');
const config = require('../config/config');
const { createNotification } = require('./notificationController');

const VALID_TYPES = ['Injury', 'Breathing Issue', 'Poisoning', 'Seizure', 'Vomiting/Diarrhea', 'Other'];
const VALID_STATUSES = ['pending', 'in_progress', 'resolved', 'cancelled'];

const createEmergencyRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { pet_id, emergency_type, description, phone_number, location } = req.body;

    if (!pet_id || !emergency_type || !description) {
      return res.status(400).json({
        success: false,
        message: 'Pet, emergency type, and description are required.'
      });
    }

    if (!VALID_TYPES.includes(emergency_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid emergency type.'
      });
    }

    if (description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Description must be at least 10 characters.'
      });
    }

    const pet = await emergencyService.getUserPet(userId, parseInt(pet_id, 10));
    if (!pet) {
      return res.status(403).json({
        success: false,
        message: 'You can only submit emergencies for your own pets.'
      });
    }

    const contactInfoParts = [];
    if (phone_number) contactInfoParts.push(`Phone: ${phone_number}`);
    if (location) contactInfoParts.push(`Location: ${location}`);
    const contactInfo = contactInfoParts.join(' | ') || 'Not provided';

    const emergency = await emergencyService.createEmergencyRequest({
      userId,
      petId: pet.pet_id,
      emergencyType: emergency_type,
      description: description.trim(),
      contactInfo
    });

    // Create notification for user
    await createNotification(
      userId,
      'emergency_created',
      'Emergency Request Submitted',
      `Your emergency request for ${pet.name} has been submitted. Our team will contact you soon.`,
      'emergency',
      emergency.emergency_id
    );

    const admins = await emergencyService.getAdmins();
    const adminIds = admins.map((admin) => admin.id);

    if (adminIds.length) {
      await emergencyService.createAdminNotifications(
        adminIds,
        `New emergency request for ${pet.name} (${emergency_type})`
      );
    }

    if (config.email?.auth?.user) {
      const ownerName = `${emergency.users?.first_name || ''} ${emergency.users?.last_name || ''}`.trim();
      const subject = 'New Emergency Request';
      const html = `
        <h2>New Emergency Request</h2>
        <p><strong>Pet:</strong> ${pet.name}</p>
        <p><strong>Owner:</strong> ${ownerName || 'Unknown'}</p>
        <p><strong>Type:</strong> ${emergency_type}</p>
        <p><strong>Contact:</strong> ${contactInfo}</p>
        <p><strong>Description:</strong> ${description}</p>
      `;
      const text = `New Emergency Request\nPet: ${pet.name}\nOwner: ${ownerName || 'Unknown'}\nType: ${emergency_type}\nContact: ${contactInfo}\nDescription: ${description}`;

      await sendEmail({
        to: config.email.auth.user,
        subject,
        html,
        text
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Emergency request submitted.',
      data: emergency
    });
  } catch (error) {
    console.error('Create emergency request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit emergency request.',
      error: error.message
    });
  }
};

const getMyEmergencyRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const requests = await emergencyService.getUserEmergencyRequests(userId);

    return res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get my emergency requests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch emergency requests.',
      error: error.message
    });
  }
};

const getAllEmergencyRequests = async (req, res) => {
  try {
    const requests = await emergencyService.getAllEmergencyRequests();
    return res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get emergency requests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch emergency requests.',
      error: error.message
    });
  }
};

const updateEmergencyStatus = async (req, res) => {
  try {
    const emergencyId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status.'
      });
    }

    const updated = await emergencyService.updateEmergencyStatus(emergencyId, status);
    
    // Create notification for user based on status change
    let notificationTitle = '';
    let notificationMessage = '';
    let notificationType = '';

    switch (status) {
      case 'in_progress':
        notificationType = 'emergency_updated';
        notificationTitle = 'Emergency Request In Progress';
        notificationMessage = `We are currently handling your emergency request for ${updated.pets?.name || 'your pet'}.`;
        break;
      case 'resolved':
        notificationType = 'emergency_resolved';
        notificationTitle = 'Emergency Request Resolved';
        notificationMessage = `Your emergency request for ${updated.pets?.name || 'your pet'} has been resolved.`;
        break;
      case 'cancelled':
        notificationType = 'emergency_updated';
        notificationTitle = 'Emergency Request Cancelled';
        notificationMessage = `Your emergency request for ${updated.pets?.name || 'your pet'} has been cancelled.`;
        break;
      default:
        notificationType = 'emergency_updated';
        notificationTitle = 'Emergency Request Updated';
        notificationMessage = `Your emergency request for ${updated.pets?.name || 'your pet'} has been updated.`;
    }

    await createNotification(
      updated.user_id,
      notificationType,
      notificationTitle,
      notificationMessage,
      'emergency',
      emergencyId
    );

    return res.status(200).json({
      success: true,
      message: 'Emergency request updated.',
      data: updated
    });
  } catch (error) {
    console.error('Update emergency status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update emergency request.',
      error: error.message
    });
  }
};

module.exports = {
  createEmergencyRequest,
  getMyEmergencyRequests,
  getAllEmergencyRequests,
  updateEmergencyStatus
};
