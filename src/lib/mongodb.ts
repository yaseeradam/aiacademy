import { MongoClient, MongoClientOptions } from 'mongodb';

const options: MongoClientOptions = {
  maxPoolSize: 25,
  minPoolSize: 2,
  maxIdleTimeMS: 30000, // Recycle sockets idle for >30s before Atlas drops them
  connectTimeoutMS: 15000,
  socketTimeoutMS: 20000,
  serverSelectionTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true,
};

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  var _rawMongoClient: MongoClient | undefined;
}

let client: MongoClient;
let actualClientPromise: Promise<MongoClient> | null = null;

export function resetMongoClient(): void {
  try {
    if (global._rawMongoClient) {
      global._rawMongoClient.close(true).catch(() => {});
    }
  } catch {
    // ignore
  }
  global._mongoClientPromise = undefined;
  global._rawMongoClient = undefined;
  actualClientPromise = null;
}

function getActualClientPromise(): Promise<MongoClient> {
  if (actualClientPromise) return actualClientPromise;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Please add your MongoDB URI to your environment variables or .env.local as MONGODB_URI');
  }

  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._rawMongoClient = client;
    global._mongoClientPromise = client.connect().catch((err) => {
      // If initial connect fails, clear cached promise so next attempt retries fresh
      global._mongoClientPromise = undefined;
      global._rawMongoClient = undefined;
      actualClientPromise = null;
      throw err;
    });
  }
  actualClientPromise = global._mongoClientPromise;
  return actualClientPromise;
}

// Thenable object to satisfy standard Promise structure lazily
const clientPromise = {
  then<TResult1 = MongoClient, TResult2 = never>(
    onfulfilled?: ((value: MongoClient) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    try {
      return getActualClientPromise().then(onfulfilled, onrejected);
    } catch (err) {
      if (onrejected) {
        return Promise.reject(err).catch(onrejected);
      }
      return Promise.reject(err);
    }
  }
} as unknown as Promise<MongoClient>;

export default clientPromise;
