const crypto = require('crypto');

/**
 * Servicio de cifrado AES-256 para credenciales IBM i
 * 
 * Usa AES-256-GCM (autenticado) para cifrar contraseñas
 * La clave de cifrado debe configurarse vía variable de entorno
 */

// Clave de cifrado (32 bytes para AES-256)
// En producción: generar con crypto.randomBytes(32).toString('hex')
// y guardar en variable de entorno ENCRYPTION_KEY
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-dev-key-change-in-production-32bytes!!';

// Asegurar que la clave tenga exactamente 32 bytes
function getKey() {
  const key = ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32);
  return Buffer.from(key, 'utf8');
}

const ALGORITHM = 'aes-256-gcm';

/**
 * Cifra un texto usando AES-256-GCM
 * @param {string} text - Texto plano a cifrar
 * @returns {string} - Texto cifrado en formato base64 (iv:authTag:encrypted)
 */
function encrypt(text) {
  if (!text) return null;
  
  try {
    const iv = crypto.randomBytes(16); // Vector de inicialización
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag(); // Etiqueta de autenticación GCM
    
    // Formato: iv:authTag:encrypted (todo en base64)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  } catch (error) {
    console.error('Error cifrando:', error.message);
    throw new Error('Error al cifrar datos sensibles');
  }
}

/**
 * Descifra un texto cifrado con AES-256-GCM
 * @param {string} encryptedText - Texto cifrado en formato iv:authTag:encrypted
 * @returns {string} - Texto descifrado
 */
function decrypt(encryptedText) {
  if (!encryptedText) return null;
  
  try {
    const [ivB64, authTagB64, encrypted] = encryptedText.split(':');
    
    if (!ivB64 || !authTagB64 || !encrypted) {
      throw new Error('Formato de datos cifrados inválido');
    }
    
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Error descifrando:', error.message);
    throw new Error('Error al descifrar datos sensibles');
  }
}

/**
 * Genera una nueva clave de cifrado aleatoria
 * Llamar una vez en producción y guardar en .env
 */
function generateKey() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  encrypt,
  decrypt,
  generateKey,
};
