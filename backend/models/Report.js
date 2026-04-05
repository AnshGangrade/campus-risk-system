const mongoose = require('mongoose')

const reportSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['infrastructure','electrical','water','overcrowding','safety','other'],
    required: true
  },
  severity:   { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  status:     { type: String, enum: ['pending','in-progress','resolved'], default: 'pending' },
  location:   { type: String, required: true },
  latitude:   { type: Number, default: 18.5204 },
  longitude:  { type: Number, default: 73.8567 },
  image:      { type: String, default: '' },
  upvotes:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  upvoteCount: { type: Number, default: 0 },
  reportedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedDepartment: { type: String, default: 'Unassigned' },
  eta:         { type: String, default: '' },
  etaSetAt:    { type: Date },
}, { timestamps: true })

module.exports = mongoose.model('Report', reportSchema)