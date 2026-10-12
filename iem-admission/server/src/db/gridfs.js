import mongoose from 'mongoose';
import config from '../config.js';

let bucket = null;
let isConnecting = false;

/**
 * Connect to MongoDB and initialize GridFS bucket.
 */
export async function connectGridFS(customUri = null) {
  const uri = customUri || config.mongodb.uri;

  if (!uri) {
    throw new Error('MongoDB URI not configured');
  }

  if (bucket && mongoose.connection.readyState === 1) {
    return bucket;
  }

  if (!isConnecting && mongoose.connection.readyState === 0) {
    isConnecting = true;
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
    } finally {
      isConnecting = false;
    }
  }

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB connection established but database object is undefined');
  }

  bucket = new mongoose.mongo.GridFSBucket(db, {
    bucketName: 'fs',
  });

  return bucket;
}

/**
 * Get active GridFS bucket instance.
 */
export function getBucket() {
  if (!bucket || mongoose.connection.readyState !== 1) {
    throw new Error('GridFS bucket not initialized or MongoDB disconnected');
  }
  return bucket;
}

/**
 * Health probe for MongoDB and GridFS.
 * Resolves with status object without throwing.
 */
export async function probeGridFS() {
  const uri = config.mongodb.uri;

  if (!uri) {
    return {
      configured: false,
      ok: false,
      message: 'MongoDB URI not configured (MONGODB_URI missing)',
    };
  }

  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      return {
        configured: true,
        ok: true,
        message: 'MongoDB GridFS connection healthy',
      };
    }

    // Attempt connecting if not connected
    await connectGridFS(uri);
    await mongoose.connection.db.admin().ping();
    return {
      configured: true,
      ok: true,
      message: 'MongoDB GridFS connection healthy',
    };
  } catch (err) {
    return {
      configured: true,
      ok: false,
      message: err.message || 'MongoDB GridFS connection error',
    };
  }
}

/**
 * Upload a readable stream to GridFS with metadata.
 * Returns a promise resolving with the GridFS file document.
 */
export async function uploadStream(filename, readableStream, metadata = {}) {
  const activeBucket = getBucket();

  return new Promise((resolve, reject) => {
    const uploadStreamInstance = activeBucket.openUploadStream(filename, {
      metadata: {
        ...metadata,
        uploadedAt: new Date(),
      },
    });

    readableStream
      .pipe(uploadStreamInstance)
      .on('error', (err) => reject(err))
      .on('finish', () => resolve(uploadStreamInstance));
  });
}

/**
 * Open a download stream for a file by its GridFS ObjectId or hex string.
 */
export function openDownloadStream(fileId) {
  const activeBucket = getBucket();
  const id = typeof fileId === 'string' ? new mongoose.Types.ObjectId(fileId) : fileId;
  return activeBucket.openDownloadStream(id);
}

/**
 * Delete a file from GridFS by its ObjectId or hex string.
 */
export async function deleteFile(fileId) {
  const activeBucket = getBucket();
  const id = typeof fileId === 'string' ? new mongoose.Types.ObjectId(fileId) : fileId;
  return activeBucket.delete(id);
}

/**
 * Find file metadata by its ObjectId or hex string.
 */
export async function findFileById(fileId) {
  const activeBucket = getBucket();
  const id = typeof fileId === 'string' ? new mongoose.Types.ObjectId(fileId) : fileId;
  const cursor = activeBucket.find({ _id: id });
  const files = await cursor.toArray();
  return files.length > 0 ? files[0] : null;
}

/**
 * Gracefully disconnect MongoDB connection.
 */
export async function closeGridFS() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  bucket = null;
}

export default {
  connectGridFS,
  getBucket,
  probeGridFS,
  uploadStream,
  openDownloadStream,
  deleteFile,
  findFileById,
  closeGridFS,
};
