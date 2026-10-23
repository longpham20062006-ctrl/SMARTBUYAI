import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface SmartBuyDB extends DBSchema {
  images: {
    key: string;
    value: {
      id: string;
      dataUrl: string;
      name: string;
      size: number;
      type: string;
      createdAt: string;
    };
  };
}

const DB_NAME = 'smartbuy_fashion_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SmartBuyDB>> | null = null;

function getDb(): Promise<IDBPDatabase<SmartBuyDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SmartBuyDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveLocalImage(file: File): Promise<string> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const id = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await db.put('images', {
        id,
        dataUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        createdAt: new Date().toISOString(),
      });
      resolve(dataUrl);
    };
    reader.onerror = () => reject(new Error('Không thể đọc file ảnh'));
    reader.readAsDataURL(file);
  });
}

export async function getImageById(id: string): Promise<string | null> {
  const db = await getDb();
  const record = await db.get('images', id);
  return record ? record.dataUrl : null;
}
