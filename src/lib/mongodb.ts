import { MongoClient, ServerApiVersion } from 'mongodb';

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};


declare global {
  // eslint-disable-next-line no-var
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

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    actualClientPromise = global._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    actualClientPromise = client.connect();
  }
  return actualClientPromise;
}

// Thenable object to satisfy standard Promise structure lazily
const clientPromise = {
  then(onfulfilled?: (value: MongoClient) => any, onrejected?: (reason: any) => any) {
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
