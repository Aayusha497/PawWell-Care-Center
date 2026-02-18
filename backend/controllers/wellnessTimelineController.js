const { WellnessTimeline, Pet } = require('../models');

const createTimelineEntry = async (req, res) => {
  try {
    const { pet_id, date, type, title, description, next_due_date } = req.body;
    const userId = req.user.id;

    // Verify pet ownership
    const pet = await Pet.findOne({
      where: {
        pet_id: parseInt(pet_id),
        user_id: userId
      }
    });

    if (!pet) {
      return res.status(403).json({ success: false, message: 'You do not have permission to add entries for this pet.' });
    }

    const entry = await WellnessTimeline.create({
      pet_id: parseInt(pet_id),
      date: new Date(date),
      type,
      title,
      description,
      next_due_date: next_due_date ? new Date(next_due_date) : null
    });

    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    console.error('Error creating timeline entry:', error);
    res.status(500).json({ success: false, message: 'Failed to create timeline entry' });
  }
};

const getTimelineEntries = async (req, res) => {
  try {
    const { pet_id } = req.query;
    const userId = req.user.id;

    if (!pet_id) {
      return res.status(400).json({ success: false, message: 'Pet ID is required' });
    }

    // Verify pet ownership
    const pet = await Pet.findOne({
      where: {
        pet_id: parseInt(pet_id),
        user_id: userId
      }
    });

    if (!pet) {
      return res.status(403).json({ success: false, message: 'You do not have permission to view entries for this pet.' });
    }

    const entries = await WellnessTimeline.findAll({
      where: {
        pet_id: parseInt(pet_id)
      },
      order: [['date', 'DESC']]
    });

    res.status(200).json({ success: true, data: entries });
  } catch (error) {
    console.error('Error fetching timeline entries:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch timeline entries' });
  }
};

const getTimelineEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const entry = await WellnessTimeline.findByPk(id, {
      include: {
        model: Pet,
        as: 'pet'
      }
    });

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    if (entry.pet.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }

    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    console.error('Error fetching timeline entry:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch entry' });
  }
};

const updateTimelineEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, type, title, description, next_due_date } = req.body;
    const userId = req.user.id;

    // Find entry and include Pet to verify ownership
    const entry = await WellnessTimeline.findByPk(id, {
      include: {
        model: Pet,
        as: 'pet'
      }
    });

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    // Verify ownership
    if (entry.pet.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }

    await entry.update({
      date: date ? new Date(date) : entry.date,
      type: type || entry.type,
      title: title || entry.title,
      description: description !== undefined ? description : entry.description,
      next_due_date: next_due_date ? new Date(next_due_date) : (next_due_date === null ? null : entry.next_due_date)
    });

    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    console.error('Error updating timeline entry:', error);
    res.status(500).json({ success: false, message: 'Failed to update entry' });
  }
};

const deleteTimelineEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const entry = await WellnessTimeline.findByPk(id, {
      include: {
        model: Pet,
        as: 'pet'
      }
    });

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    if (entry.pet.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }

    await entry.destroy();

    res.status(200).json({ success: true, message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting timeline entry:', error);
    res.status(500).json({ success: false, message: 'Failed to delete entry' });
  }
};

module.exports = {
  createTimelineEntry,
  getTimelineEntries,
  getTimelineEntry,
  updateTimelineEntry,
  deleteTimelineEntry
};
