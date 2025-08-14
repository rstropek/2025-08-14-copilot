import { initializeDatabase } from '@/lib/dbInit';

export async function register() {
  // This function runs when the Next.js app starts
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      await initializeDatabase();
    } catch (error) {
      console.error('Failed to initialize database on startup:', error);
      // Don't throw the error to avoid preventing the app from starting
      // The database initialization will be logged but won't crash the app
    }
  }
}