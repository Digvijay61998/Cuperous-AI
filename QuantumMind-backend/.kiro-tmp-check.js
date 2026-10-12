// Temporary diagnostic: allowed widget domains for the Kone Assist bot.
require('dotenv').config();
const mongoose = require('mongoose');
(async () => {
  const c = await mongoose.createConnection(process.env.DATABASE_HOST || 'mongodb://127.0.0.1:27017/Cuprous').asPromise();
  const id = '6ac4d0068aa6259a19b9ec79';
  const s = await c.db.collection('botsettings').find({ $or: [{ botId: id }, { botId: new mongoose.Types.ObjectId(id) }] }, { projection: { domains: 1, botId: 1 } }).toArray();
  console.log(JSON.stringify(s));
  await c.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
