import mongoose from 'mongoose';

const rateSchema = new mongoose.Schema({
  basic: {
    type: String,
    required: true,
  },
  vip: {
    type: String,
    required: true,
  },
}, { timestamps: true });

const Rate = mongoose.model('Rate', rateSchema);

export default Rate;
