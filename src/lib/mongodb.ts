import { MongoClient } from 'mongodb';

const options = {
  maxPoolSize: 20,
  minPoolSize: 2,
  connectTimeoutMS: 20000,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 15000,
};


declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let client: MongoClient;
let actualClientPromise: Promise<MongoClient> | null = null;

function getActualClientPromise(): Promise<MongoClient> {
  if (actualClientPromise) return actualClientPromise;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Please add your MongoDB URI to your environment variables or .env.local as MONGODB_URI');
  }

  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
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
