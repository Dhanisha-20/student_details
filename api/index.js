/**
 * Vercel Serverless Function Entrypoint
 * Forwards requests to Express application
 */
const app = require('../server');

module.exports = app;
