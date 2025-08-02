import Rate from '../models/rateModel.js';

export const getRates = async (req, res) => {
  try {
    let rate = await Rate.findOne();
    if (!rate) {
      rate = await Rate.create({ basic: '91.50', vip: '94.00' });
    }
    res.json(rate);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch rates' });
  }
};

export const updateRates = async (req, res) => {
  try {
    const { basic, vip } = req.body;
    let rate = await Rate.findOne();
    if (rate) {
      rate.basic = basic;
      rate.vip = vip;
      await rate.save();
    } else {
      await Rate.create({ basic, vip });
    }

    res.json({ success: true, message: 'Rates updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update rates' });
  }
};
