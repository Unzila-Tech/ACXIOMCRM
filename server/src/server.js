
import dns from 'node:dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';

const port = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(port, () =>
      console.log(`AcxiomCRM API running on ${port}`)
    );
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
