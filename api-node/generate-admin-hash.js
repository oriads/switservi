const bcrypt = require('bcrypt');

// Generar hash para Admin123!
const password = 'Admin123!';
const saltRounds = 10;

bcrypt.hash(password, saltRounds).then(hash => {
  console.log('=== USUARIO ADMIN PARA INSERTAR EN PostgreSQL ===');
  console.log('');
  console.log('Ejecuta este SQL en pgAdmin o psql:');
  console.log('');
  console.log(`INSERT INTO users (username, email, password_hash, full_name, role)`);
  console.log(`VALUES (`);
  console.log(`  'admin',`);
  console.log(`  'admin@helpdesk.com',`);
  console.log(`  '${hash}',`);
  console.log(`  'Administrador del Sistema',`);
  console.log(`  'admin'`);
  console.log(`) ON CONFLICT (username) DO UPDATE SET password_hash = '${hash}';`);
  console.log('');
  console.log('Credenciales:');
  console.log(`  Usuario: admin`);
  console.log(`  Password: ${password}`);
}).catch(err => console.error(err));
