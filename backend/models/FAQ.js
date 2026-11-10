const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
    },
    answer: {
      type: String,
      required: [true, 'Answer is required'],
    },
    category: {
      type: String,
      required: true,
      enum: [
        'General',
        'Aadu Puli Aatam',
        'Pallanguzhi',
        'Game Rules',
        'Strategy',
        'Technical & Caching',
        'Account & Profile',
      ],
      index: true,
    },
    gameSlug: {
      type: String,
      default: null,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'All'],
      default: 'All',
    },
    order: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['published', 'draft'],
      default: 'published',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

faqSchema.index({ question: 'text', answer: 'text' });

module.exports = mongoose.model('FAQ', faqSchema);

