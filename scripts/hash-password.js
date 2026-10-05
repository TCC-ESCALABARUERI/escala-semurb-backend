// Gera o hash bcrypt para MASTER_PASSWORD_HASH: npm run hash -- "minhaSenha"
import bcrypt from 'bcrypt'

const plain = process.argv[2]
if (!plain) {
  console.error('Uso: npm run hash -- "senha"')
  process.exit(1)
}
console.log(await bcrypt.hash(plain, 10))
