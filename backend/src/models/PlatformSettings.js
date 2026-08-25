const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema(
  {
    leaderboardResetAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
