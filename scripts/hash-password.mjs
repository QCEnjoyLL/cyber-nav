import { pbkdf2Sync, randomBytes } from "node:crypto";

const password = process.argv[2];

if (!password) {
  console.error("Usage: npm run secret:hash -- <your-admin-password>");
  process.exit(1);
}

const iterations = 100_000;
const salt = randomBytes(16);
const hash = pbkdf2Sync(password, salt, iterations, 32, "sha256");
const sessionSecret = randomBytes(32).toString("base64url");

console.log(`ADMIN_PASSWORD_HASH=pbkdf2_sha256$${iterations}$${salt.toString("base64")}$${hash.toString("base64")}`);
console.log(`SESSION_SECRET=${sessionSecret}`);
