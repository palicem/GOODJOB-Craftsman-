import mongoose from 'mongoose';

const DB_HOST = process.env.MONGODB_HOST || '127.0.0.1';
const DB_PORT = process.env.MONGODB_PORT || '27017';
const DB_USER = process.env.MONGODB_USER;
const DB_PASSWORD = process.env.MONGODB_PASSWORD;
const USER_DB_NAME = process.env.USER_DB_NAME || 'user_db';
const SHOP_DB_PREFIX = process.env.SHOP_DB_PREFIX || 'shop';
const ORDERS_DB_NAME = process.env.ORDERS_DB_NAME || 'orders_db';

const connections = new Map();

const buildConnectionString = (dbName) => {
  let uri = 'mongodb://';
  if (DB_USER && DB_PASSWORD) {
    uri += `${DB_USER}:${DB_PASSWORD}@`;
  }
  uri += `${DB_HOST}:${DB_PORT}/${dbName}?authSource=admin&directConnection=true`;
  return uri;
};

const connect = async (dbName) => {
  if (connections.has(dbName)) {
    const conn = connections.get(dbName);
    if (conn.readyState === 1) { // 1 for connected, 2 for connecting
      return conn;
    }
    connections.delete(dbName);
  }

  const uri = buildConnectionString(dbName);
  try {
    const connection = await mongoose.createConnection(uri).asPromise();
    console.log(`Successfully connected to MongoDB database: ${dbName}`);
    connections.set(dbName, connection);

    connection.on('error', (err) => {
      console.error(`MongoDB connection error for ${dbName}:`, err);
      connections.delete(dbName);
    });
    connection.on('disconnected', () => {
      console.log(`MongoDB disconnected from ${dbName}.`);
      connections.delete(dbName);
    });
    connection.on('reconnected', () => {
      console.log(`MongoDB reconnected to ${dbName}.`);
    });

    return connection;
  } catch (error) {
    console.error(`Failed to connect to MongoDB database ${dbName}:`, error);
    throw error;
  }
};

export const connectMasterDB = async () => {
  return connect(USER_DB_NAME); // Master DB is the user_db
};

export const getUserDBConnection = async () => {
  return connect(USER_DB_NAME);
};

export const getShopDBConnection = async (shopId) => {
  if (!shopId) {
    throw new Error('Shop ID is required to connect to a shop database.');
  }
  const dbName = `${SHOP_DB_PREFIX}_${shopId}`;
  return connect(dbName);
};

export const getOrdersDBConnection = async () => {
  return connect(ORDERS_DB_NAME);
};

export const closeConnection = async (dbName) => {
  if (connections.has(dbName)) {
    const connection = connections.get(dbName);
    await connection.close();
    connections.delete(dbName);
    console.log(`Closed connection to ${dbName}`);
  }
};

export const closeAllConnections = async () => {
  for (const [dbName, connection] of connections) {
    try {
      await connection.close();
      console.log(`Closed connection to ${dbName}`);
    } catch (error) {
      console.error(`Error closing connection to ${dbName}:`, error);
    }
  }
  connections.clear();
  // If mongoose.connect() was ever used for a default connection (not in this setup):
  // if (mongoose.connection && mongoose.connection.readyState === 1) {
  //   await mongoose.disconnect();
  //   console.log('Default Mongoose connection closed.');
  // }
};

// Exporting connections map for potential direct use or testing (optional)
export { connections }; 