const fs = require('fs');
const path = require('path');

const repoPath = path.join(__dirname, '..', 'src', 'mocks', 'repository.ts');
let repoContent = fs.readFileSync(repoPath, 'utf8');

const oldTarget = `// Khởi tạo Database với danh mục và sản phẩm thật
function initDatabase() {
  if (typeof window === 'undefined') return;

  const currentVersion = localStorage.getItem(STORAGE_KEYS.SCHEMA);
  if (currentVersion !== SCHEMA_VERSION) {
    // Bảo tồn đơn hàng, giỏ hàng, người dùng nếu đã có
    const existingOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
    const existingUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    const existingCurrentUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    const existingCart = localStorage.getItem(STORAGE_KEYS.CART);

    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(FINAL_GENZ_CATALOGUE));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(GENZ_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.BRANDS, JSON.stringify(GENZ_BRANDS));
    localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(GENZ_COLLECTIONS));
    localStorage.setItem(STORAGE_KEYS.ORDERS, existingOrders || JSON.stringify(INITIAL_ORDERS));
    localStorage.setItem(STORAGE_KEYS.USERS, existingUsers || JSON.stringify(DEMO_USERS));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, existingCurrentUser || JSON.stringify(DEMO_USERS[0]));
    if (existingCart) {
      localStorage.setItem(STORAGE_KEYS.CART, existingCart);
    } else {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify({ items: [], subtotal: 0, shippingFee: 0, discount: 0, total: 0 }));
    }
    if (!localStorage.getItem(STORAGE_KEYS.STOCK_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.STOCK_LOGS, JSON.stringify([]));
    }
    localStorage.setItem(STORAGE_KEYS.SCHEMA, SCHEMA_VERSION);
  }
}

// Initial run
initDatabase();

// Helpers
function getStored<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    console.error(\`Error reading \${key}\`, e);
    return fallback;
  }
}

function setStored<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(\`Error saving \${key}\`, e);
  }
}`;

const newImplementation = `// In-memory fallback store for environments where localStorage is unavailable, restricted, or quota is exceeded (e.g. iOS Safari / Messenger WKWebView)
const memoryStore = new Map<string, string>();

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch {
      // localStorage may throw SecurityError or QuotaExceededError in restricted webviews
    }
    return memoryStore.get(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    // Luôn lưu vào memoryStore dự phòng
    memoryStore.set(key, value);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      // QuotaExceededError hoặc SecurityError trên Safari iOS / Messenger:
      // Không ném lỗi ra ngoài làm crash ứng dụng, dữ liệu vẫn được bảo tồn an toàn trong memoryStore
      console.warn(\`[SafeStorage] localStorage.setItem failed for key "\${key}", retained in memory:\`, (e as any)?.message || e);
    }
  },
  removeItem: (key: string): void => {
    memoryStore.delete(key);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
  }
};

// Khởi tạo Database với danh mục và sản phẩm thật (bảo vệ tuyệt đối chống crash iOS/WebKit)
function initDatabase() {
  if (typeof window === 'undefined') return;

  try {
    const currentVersion = safeStorage.getItem(STORAGE_KEYS.SCHEMA);
    if (currentVersion !== SCHEMA_VERSION) {
      // Bảo tồn đơn hàng, giỏ hàng, người dùng nếu đã có
      const existingOrders = safeStorage.getItem(STORAGE_KEYS.ORDERS);
      const existingUsers = safeStorage.getItem(STORAGE_KEYS.USERS);
      const existingCurrentUser = safeStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      const existingCart = safeStorage.getItem(STORAGE_KEYS.CART);

      // Lưu trữ với fallback an toàn
      safeStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(FINAL_GENZ_CATALOGUE));
      safeStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(GENZ_CATEGORIES));
      safeStorage.setItem(STORAGE_KEYS.BRANDS, JSON.stringify(GENZ_BRANDS));
      safeStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(GENZ_COLLECTIONS));
      safeStorage.setItem(STORAGE_KEYS.ORDERS, existingOrders || JSON.stringify(INITIAL_ORDERS));
      safeStorage.setItem(STORAGE_KEYS.USERS, existingUsers || JSON.stringify(DEMO_USERS));
      safeStorage.setItem(STORAGE_KEYS.CURRENT_USER, existingCurrentUser || JSON.stringify(DEMO_USERS[0]));
      if (existingCart) {
        safeStorage.setItem(STORAGE_KEYS.CART, existingCart);
      } else {
        safeStorage.setItem(STORAGE_KEYS.CART, JSON.stringify({ items: [], subtotal: 0, shippingFee: 0, discount: 0, total: 0 }));
      }
      if (!safeStorage.getItem(STORAGE_KEYS.STOCK_LOGS)) {
        safeStorage.setItem(STORAGE_KEYS.STOCK_LOGS, JSON.stringify([]));
      }
      safeStorage.setItem(STORAGE_KEYS.SCHEMA, SCHEMA_VERSION);
    }
  } catch (err) {
    console.warn('[SafeStorage] initDatabase error caught safely:', err);
  }
}

// Initial run
initDatabase();

// Helpers
function getStored<T>(key: string, fallback: T): T {
  try {
    const data = safeStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    console.error(\`Error reading \${key}\`, e);
    return fallback;
  }
}

function setStored<T>(key: string, data: T): void {
  try {
    safeStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(\`Error saving \${key}\`, e);
  }
}`;

// Normalize line endings for replacement
const normalize = (str) => str.replace(/\r\n/g, '\n');
const normalizedRepo = normalize(repoContent);
const normalizedOld = normalize(oldTarget);

if (normalizedRepo.includes(normalizedOld)) {
  const replaced = normalizedRepo.replace(normalizedOld, normalize(newImplementation));
  fs.writeFileSync(repoPath, replaced, 'utf8');
  console.log('✅ Đã cập nhật thành công SafeStorage cho repository.ts!');
} else {
  console.error('❌ Không tìm thấy đoạn code mục tiêu trong repository.ts');
  process.exit(1);
}

