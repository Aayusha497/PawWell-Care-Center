const { ContactMessage, User, Notification } = require('../models');

const createContactMessage = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, location, subject, message } = req.body;
    console.log('📨 [Create Contact Message] User info:', {
      user_id: req.user?.id || 'Not authenticated',
      email: req.user?.email || email
    });

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
      console.log('✅ [Create Contact Message] user_id will be saved:', req.user.id);
    }

    const contactMessage = await ContactMessage.create(payload);
    console.log('✅ [Create Contact Message] Contact message created with:', {
      contact_id: contactMessage.contact_id,
      user_id: contactMessage.user_id
    });

    // Send notification to user if authenticated
    if (req.user && req.user.id) {
      try {
        const notification = await Notification.create({
          user_id: req.user.id,
          type: 'contact_message_received',
          title: 'Message Received',
          message: 'Your contact message has been received. We will review it and get back to you soon.',
          is_read: false
        });
        console.log('✅ [Create Contact Message] Notification created for user:', req.user.id);
      } catch (notificationError) {
        console.error('❌ [Create Contact Message] Error creating notification:', notificationError);
        // Don't fail the request if notification creation fails
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Contact message received.',
      data: contactMessage
    });
  } catch (error) {
    console.error('❌ [Create Contact Message] Error:', error);
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
    console.log('🔍 [Mark Contact Message Read] contactId:', contactId);
    
    const message = await ContactMessage.findByPk(contactId);
    console.log('📨 [Mark Contact Message Read] Message found:', {
      contact_id: message?.contact_id,
      user_id: message?.user_id,
      status: message?.status
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found.'
      });
    }

    if (message.status !== 'read') {
      message.status = 'read';
      await message.save();
      console.log('✅ [Mark Contact Message Read] Message marked as read');

      // Send notification to user if they submitted the message while authenticated
      if (message.user_id) {
        console.log('📢 [Mark Contact Message Read] Creating notification for user:', message.user_id);
        try {
          const notification = await Notification.create({
            user_id: message.user_id,
            type: 'contact_message_read',
            title: 'Message Read',
            message: 'Your message has been read. We will get back to you soon. Check your email for updates.',
            is_read: false
          });
          console.log('✅ [Mark Contact Message Read] Notification created:', notification.notification_id);
        } catch (notificationError) {
          console.error('❌ [Mark Contact Message Read] Error creating notification:', notificationError);
          // Don't fail the request if notification creation fails
        }
      } else {
        console.log('⚠️ [Mark Contact Message Read] No user_id found for contact message');
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Contact message marked as read.',
      data: message
    });
  } catch (error) {
    console.error('❌ [Mark Contact Message Read] Error:', error);
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
