import "dotenv/config";
import { encode, decode } from "next-auth/jwt";

async function main() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET missing");
  const token = {
    id: "cmqoyjgoi0000hsmwbovkec89",
    role: "ADMIN",
    email: "admin@example.com",
    name: "Admin",
  };
  const encoded = await encode({ token, secret });
  console.log("encoded:", encoded);
  const decoded = await decode({ token: encoded, secret });
  console.log("decoded:", decoded);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
