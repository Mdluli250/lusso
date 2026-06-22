import fs from "fs";
import path from "path";

const token =
  "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..9j7oBniKCHoTinMW.g_44MNpbB-P-T4SWbj8y64JYy2J43ioMuoY-yal9EyCs2ft6uYAX6YIyobSBOMmw5ykzfr_AKFIa4Ov6zWZY9UCBvPYD7KeSCnRinVSbyDlZPr2rH141tXDIEkh5wwPcJO0CfnzBM7BRPwOHTaYkkOtpRUZMFsqPS9ptm7orgzVmoZndrDfAno6D6u2PdS5ZbRYxQ2K7s1OZZD8Ufm6Tukxa4RZrlLb_gnx_.JxaUnfdR3lMla7lDC_KV6A";

async function run() {
  const cookie = `next-auth.session-token=${token}`;
  const url = "http://localhost:3000";

  const resp1 = await fetch(`${url}/api/auth/session`, {
    headers: { cookie },
  });
  console.log("/api/auth/session", resp1.status);
  const sessionBody = await resp1.text();
  console.log(sessionBody);

  const setCookieHeader = resp1.headers.get("set-cookie");
  console.log("set-cookie header:", setCookieHeader);

  const sessionTokenMatch = setCookieHeader?.match(
    /next-auth\.session-token=([^;]+)/,
  );
  const sessionTokenCookie = sessionTokenMatch
    ? `next-auth.session-token=${sessionTokenMatch[1]}`
    : cookie;
  console.log("session token cookie:", sessionTokenCookie);

  const formData = new FormData();
  formData.append(
    "image",
    fs.createReadStream(
      path.join(process.cwd(), "public", "images", "about", "materials.png"),
    ),
  );

  const resp2 = await fetch(`${url}/api/admin/products/upload-image`, {
    method: "POST",
    headers: {
      cookie: sessionTokenCookie,
    },
    body: formData,
  });

  console.log("/api/admin/products/upload-image", resp2.status);
  console.log(await resp2.text());
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
