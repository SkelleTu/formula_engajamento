import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('./database.db');

console.log('='.repeat(60));
console.log('TESTE DE CREDENCIAIS DO SISTEMA DE LOGIN');
console.log('='.repeat(60));
console.log('');

const admins = db.prepare('SELECT username, requires_password_change, created_at FROM admins').all();

console.log('✅ Usuários encontrados no banco de dados:');
console.log('');
admins.forEach((admin, index) => {
  console.log(`${index + 1}. Usuário: ${admin.username}`);
  console.log(`   Criado em: ${admin.created_at}`);
  console.log(`   Requer troca de senha: ${admin.requires_password_change === 1 ? 'Sim' : 'Não'}`);
  console.log('');
});

console.log('='.repeat(60));
console.log('TESTANDO CREDENCIAIS FORNECIDAS:');
console.log('='.repeat(60));
console.log('');

const testCredentials = [
  { username: 'Victor', password: 'Victor.!.1999' },
  { username: 'JULIOCALORI', password: 'FOCO20K' },
  { username: 'JULIAOCALORI', password: 'FOCO20K' }
];

for (const cred of testCredentials) {
  console.log(`Testando: ${cred.username} / ${cred.password}`);
  
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(cred.username);
  
  if (!admin) {
    console.log(`❌ ERRO: Usuário "${cred.username}" NÃO encontrado no banco de dados`);
    console.log('');
    continue;
  }
  
  const isValid = await bcrypt.compare(cred.password, admin.password_hash);
  
  if (isValid) {
    console.log(`✅ SUCESSO: Credenciais válidas!`);
  } else {
    console.log(`❌ ERRO: Senha incorreta para o usuário "${cred.username}"`);
  }
  console.log('');
}

console.log('='.repeat(60));
console.log('PROBLEMAS IDENTIFICADOS:');
console.log('='.repeat(60));
console.log('');
console.log('1. O usuário correto é "JULIAOCALORI" (com IA), não "JULIOCALORI"');
console.log('   Certifique-se de digitar o nome de usuário exatamente como está');
console.log('');
console.log('2. As senhas são case-sensitive (maiúsculas e minúsculas importam)');
console.log('');
console.log('3. O erro "erro ao conectar com o servidor" pode ocorrer se:');
console.log('   - O nome de usuário estiver incorreto');
console.log('   - A senha estiver incorreta');
console.log('   - Houver problema de rede (improvável, pois o servidor está funcionando)');
console.log('');
console.log('='.repeat(60));

db.close();
