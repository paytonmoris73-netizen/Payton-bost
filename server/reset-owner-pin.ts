// Recovery for a locked-out owner. Run on the server: npm run reset-owner-pin -- "Owner Name" 1234
import { db } from "./db.js";

const [name, pin] = process.argv.slice(2);
if (!name || !/^\d{4,8}$/.test(pin ?? "")) {
  console.error('Usage: npm run reset-owner-pin -- "Owner Name" <4-8 digit PIN>');
  process.exit(1);
}
const user = db.getUserByName(name);
if (!user || user.role !== "owner") {
  console.error(`No owner named "${name}".`);
  process.exit(1);
}
db.resetPin(user.id);
db.setPin(user.id, pin);
console.log(`PIN updated for ${user.name}. All their sessions were signed out.`);
