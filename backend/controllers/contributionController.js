const Contribution = require('../models/Contribution');

/**
 * @desc    Submit a regional game variation or cultural reference
 * @route   POST /api/contributions
 * @access  Public (Optional Auth)
 */
const submitContribution = async (req, res) => {
  try {
    const {
      contributorName,
      contributorEmail,
      gameSlug,
      submissionType,
      title,
      region,
      content,
      references,
    } = req.body;

    if (!contributorName || !contributorEmail || !gameSlug || !title || !region || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please complete all required fields for the preservation archive.',
      });
    }

    const contribution = await Contribution.create({
      userId: req.user?._id || null,
      contributorName: contributorName.trim(),
      contributorEmail: contributorEmail.trim().toLowerCase(),
      gameSlug: gameSlug.trim().toLowerCase(),
      submissionType: submissionType || 'regional_variant',
      title: title.trim(),
      region: region.trim(),
      content: content.trim(),
      references: references ? references.trim() : '',
      moderationStatus: 'pending',
    });

    return res.status(201).json({
      success: true,
      message:
        'Thank you! Your contribution has been submitted to the FolkBoard archive for moderation.',
      data: contribution,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to record contribution.',
      error: error.message,
    });
  }
};

/**
 * @desc    Get contributions submitted by the current user
 * @route   GET /api/contributions/my
 * @access  Private
 */
const getMyContributions = async (req, res) => {
  try {
    const userId = req.user._id;
    const contributions = await Contribution.find({ userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: contributions.length,
      data: contributions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve contributions.',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all contributions (Admin)
 * @route   GET /api/contributions/all
 * @access  Private (Admin only)
 */
const getAllContributions = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.moderationStatus = status;

    const contributions = await Contribution.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: contributions.length,
      data: contributions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch contribution moderation list.',
      error: error.message,
    });
  }
};

/**
 * @desc    Moderate a submission (Admin)
 * @route   PATCH /api/contributions/:id/moderate
 * @access  Private (Admin only)
 */
const moderateContribution = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, moderatorNotes } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid moderation status.',
      });
    }

    const contribution = await Contribution.findByIdAndUpdate(
      id,
      {
        moderationStatus: status,
        moderatorNotes: moderatorNotes || '',
      },
      { new: true }
    );

    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: 'Contribution not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Contribution status updated to ${status}.`,
      data: contribution,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update moderation status.',
      error: error.message,
    });
  }
};

module.exports = {
  submitContribution,
  getMyContributions,
  getAllContributions,
  moderateContribution,
};

