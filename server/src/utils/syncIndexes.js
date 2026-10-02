const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const connectDB = require('../config/db');

const syncIndexes = async () => {
  try {
    await connectDB();
    const modelsPath = path.join(__dirname, '../models');
    
    fs.readdirSync(modelsPath).forEach(file => {
      if (file.endsWith('.js')) {
        require(path.join(modelsPath, file));
      }
    });

    for (const modelName of Object.keys(mongoose.models)) {
      const Model = mongoose.models[modelName];
      console.log(`Syncing indexes for ${modelName}...`);
      await Model.syncIndexes();
    }
    
    console.log('✅ All indexes synchronized successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing indexes:', error);
    process.exit(1);
  }
};

syncIndexes();
