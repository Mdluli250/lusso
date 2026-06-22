require("dotenv").config();
const { encode } = require("next-auth/jwt");

(async () => {
  const token = {
    id: "cmqoyjgoi0000hsmwbovkec89",
    role: "ADMIN",
    email: "admin@example.com",
    name: "Admin",
  };

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET not defined");
  }

  const encoded = await encode({ token, secret });
  console.log(encoded);
})();
