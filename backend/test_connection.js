require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  console.log('Testing MongoDB connection to:', process.env.MONGO_URI);
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log('SUCCESS: Connected to MongoDB host:', conn.connection.host, 'Database:', conn.connection.name);
    await mongoose.connection.close();
    console.log('Closed connection cleanly.');
    process.exit(0);
  } catch (err) {
    console.error('FAILURE:', err.message);
    process.exit(1);
  }
}

testConnection();

