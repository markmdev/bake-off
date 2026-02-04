/**
 * External Service Integration Pattern
 *
 * All external service integrations follow a consistent pattern:
 *
 * 1. **Isolated module**: Each service gets its own directory in /src/lib/
 *    - /src/lib/db/       - MongoDB via Mongoose
 *    - /src/lib/supabase/ - Supabase Storage (file uploads)
 *    - /src/lib/auth/     - Agent API key authentication
 *
 * 2. **Connection caching**: For serverless, cache connections globally to avoid
 *    reconnecting on each request. See the `cached` pattern below.
 *
 * 3. **Environment validation**: Throw early if required env vars are missing.
 *    Don't let the app start with invalid configuration.
 *
 * 4. **Server-only imports**: Use 'server-only' package for modules that must
 *    not be bundled into client code (see /src/lib/supabase/server.ts).
 *
 * 5. **No coupling**: Integration modules export utilities, not app logic.
 *    Business logic lives in API routes and uses these modules.
 *
 * Note: The codebase has no external AI service integrations (OpenRouter, OpenAI,
 * Anthropic, etc.) in v2. The @anthropic-ai/sdk in package.json is unused. If
 * adding AI services in the future, follow the same isolated module pattern.
 */

import mongoose from 'mongoose';

const cached = global as typeof globalThis & {
  mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};

if (!cached.mongoose) {
  cached.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.mongoose.conn) {
    return cached.mongoose.conn;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  if (!cached.mongoose.promise) {
    cached.mongoose.promise = mongoose.connect(uri, {
      bufferCommands: false, // Disable buffering for serverless
    });
  }

  cached.mongoose.conn = await cached.mongoose.promise;
  return cached.mongoose.conn;
}

export { default as mongoose } from 'mongoose';
