const { ContactMessage, User } = require('../models');

const createContactMessage = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, location, subject, message } = req.body;

    if (!fullName || !email || !phoneNumber || !location || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, phone number, location, subject, and message are required.'
      });
    }

    const payload = {
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone_number: phoneNumber.trim(),
      location: location.trim(),
      subject: subject.trim(),
      message: message.trim(),
      status: 'unread'
    };

    if (req.user && req.user.id) {
      payload.user_id = req.user.id;
    }

    const contactMessage = await ContactMessage.create(payload);

    return res.status(201).json({
      success: true,
      message: 'Contact message received.',
      data: contactMessage
    });
  } catch (error) {
    console.error('Create contact message error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit contact message.',
      error: error.message
    });
  }
};

const getContactMessages = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await ContactMessage.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get contact messages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch contact messages.',
      error: error.message
    });
  }
};

const markAllContactMessagesRead = async (req, res) => {
  try {
    const [updatedCount] = await ContactMessage.update(
      { status: 'read' },
      { where: { status: 'unread' } }
    );

    return res.status(200).json({
      success: true,
      message: 'Contact messages marked as read.',
      data: { updated: updatedCount }
    });
  } catch (error) {
    console.error('Mark contact messages read error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update contact messages.',
      error: error.message
    });
  }
};

const markContactMessageRead = async (req, res) => {
  try {
    const { contactId } = req.params;
    const message = await ContactMessage.findByPk(contactId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found.'
      });
    }

    if (message.status !== 'read') {
      message.status = 'read';
      await message.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Contact message marked as read.',
      data: message
    });
  } catch (error) {
    console.error('Mark contact message read error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update contact message.',
      error: error.message
    });
  }
};

module.exports = {
  createContactMessage,
  getContactMessages,
  markAllContactMessagesRead,
  markContactMessageRead
};
