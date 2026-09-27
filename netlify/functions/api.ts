import serverless from 'serverless-http';
import { app } from '../../server';

// Serverless wrapper for Netlify Functions
const serverlessHandler = serverless(app);

export const handler = async (event: any, context: any) => {
  // Prevent serverless function from waiting for Node.js event loop to empty
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  // Normalize path if Netlify redirects with or without /api prefix
  if (event?.path) {
    let cleanPath = event.path;
    if (cleanPath.startsWith('/.netlify/functions/api')) {
      cleanPath = cleanPath.replace('/.netlify/functions/api', '') || '/';
    }
    if (!cleanPath.startsWith('/api')) {
      cleanPath = `/api${cleanPath}`;
    }
    event.path = cleanPath;
  }

  return serverlessHandler(event, context);
};
