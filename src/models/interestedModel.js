import mongoose from 'mongoose';

const interestedSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  projectType: {
    type: String,
    enum: {
      values: ['academic', 'personal', 'institutional', 'educational', 'corporate', 'other'],
      message: 'Please select a valid project type'
    }
  },
  researchTopics: {
    type: String,
    trim: true,
    maxlength: [500, 'Research topics cannot exceed 500 characters']
  },
  timeline: {
    type: String,
    enum: ['asap', '1month', '3months', '6months', 'flexible']
  },
  budget: {
    type: String,
    enum: ['basic', 'standard', 'premium', 'enterprise', 'discuss']
  },
  requirements: {
    type: String,
    trim: true,
    maxlength: [2000, 'Requirements cannot exceed 2000 characters']
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'in-progress', 'completed', 'archived'],
    default: 'new'
  },
  source: {
    type: String,
    default: 'website-form'
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    referrer: String
  }
}, { 
  timestamps: true 
});

// Index for better query performance
interestedSchema.index({ email: 1, createdAt: -1 });
interestedSchema.index({ status: 1, createdAt: -1 });

const Interested = mongoose.models.Interested || mongoose.model('Interested', interestedSchema);

export default Interested;