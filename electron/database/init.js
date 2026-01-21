/**
 * Inicialización de la base de datos SQLite local
 * Este archivo se encarga de crear y configurar la base de datos local
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Logger seguro que no falla con EPIPE
const safeLog = (...args) => {
  try {
    console.log(...args);
  } catch (err) {
    if (err.code !== 'EPIPE') {
      process.stderr.write(`Logger error: ${err.message}\n`);
    }
  }
};

const safeError = (...args) => {
  try {
    console.error(...args);
  } catch (err) {
    if (err.code !== 'EPIPE') {
      process.stderr.write(`Logger error: ${err.message}\n`);
    }
  }
};

let db = null;

/**
 * Obtiene la ruta donde se guardará la base de datos
 * En desarrollo: carpeta del proyecto
 * En producción: carpeta de datos de la aplicación
 */
function getDatabasePath() {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    // En desarrollo: guardar en la carpeta del proyecto
    return path.join(__dirname, '..', '..', 'sabrosita.db');
  } else {
    // En producción: guardar en userData (AppData en Windows)
    // Lazy load app to avoid circular dependency at module load time
    const { app } = require('electron');
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'sabrosita.db');
  }
}

/**
 * Inicializa la base de datos SQLite
 * Crea el archivo si no existe y aplica el esquema inicial
 */
function initDatabase() {
  if (db) {
    safeLog('📦 Base de datos ya inicializada');
    return db;
  }

  try {
    const dbPath = getDatabasePath();
    safeLog(`📦 Inicializando base de datos en: ${dbPath}`);

    // Crear carpeta si no existe
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Abrir/crear base de datos
    db = new Database(dbPath, {
      verbose: safeLog, // Log de queries en desarrollo
    });

    // Configuración para mejor performance
    db.pragma('journal_mode = WAL'); // Write-Ahead Logging (más rápido)
    db.pragma('synchronous = NORMAL'); // Balance entre speed y seguridad
    db.pragma('foreign_keys = ON'); // Activar foreign keys

    safeLog('✅ Base de datos SQLite inicializada correctamente');

    // Aplicar esquema inicial si la DB es nueva
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      applySchema(schemaPath);
    }

    return db;
  } catch (error) {
    safeError('❌ Error al inicializar base de datos:', error);
    throw error;
  }
}

/**
 * Aplica el esquema SQL desde un archivo
 */
function applySchema(schemaPath) {
  try {
    // Verificar si la tabla products ya existe (DB no es nueva)
    const tableExists = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='products'")
      .get();

    if (tableExists) {
      safeLog('⏭️  Esquema ya existe, saltando inicialización');
      return;
    }

    safeLog('📝 Aplicando esquema inicial...');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Ejecutar el esquema completo
    db.exec(schema);

    safeLog('✅ Esquema aplicado correctamente');
  } catch (error) {
    safeError('❌ Error al aplicar esquema:', error);
    throw error;
  }
}

/**
 * Obtiene la instancia de la base de datos
 * Inicializa si no existe
 */
function getDatabase() {
  if (!db) {
    return initDatabase();
  }
  return db;
}

/**
 * Cierra la base de datos
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    safeLog('📦 Base de datos cerrada');
  }
}

/**
 * Ejecuta una query SELECT
 */
function query(sql, params = []) {
  const db = getDatabase();
  try {
    return db.prepare(sql).all(params);
  } catch (error) {
    safeError('Error en query:', sql, error);
    throw error;
  }
}

/**
 * Ejecuta una query INSERT/UPDATE/DELETE
 */
function run(sql, params = []) {
  const db = getDatabase();
  try {
    return db.prepare(sql).run(params);
  } catch (error) {
    safeError('Error en run:', sql, error);
    throw error;
  }
}

/**
 * Ejecuta una transacción
 */
function transaction(callback) {
  const db = getDatabase();
  const fn = db.transaction(callback);
  return fn();
}

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase,
  getDatabasePath,
  query,
  run,
  transaction,
};
