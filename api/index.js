// Vercel runs every file in api/ as a serverless function. This one hands all
// /api/* requests to our Express app (vercel.json routes them here).
// Locally, server/src/index.js runs the same app as a normal server instead.
import { app } from '../server/src/app.js';

export default app;
