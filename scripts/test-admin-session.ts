import "dotenv/config";

const token =
  "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..9j7oBniKCHoTinMW.g_44MNpbB-P-T4SWbj8y64JYy2J43ioMuoY-yal9EyCs2ft6uYAX6YIyobSBOMmw5ykzfr_AKFIa4Ov6zWZY9UCBvPYD7KeSCnRinVSbyDlZPr2rH141tXDIEkh5wwPcJO0CfnzBM7BRPwOHTaYkkOtpRUZMFsqPS9ptm7orgzVmoZndrDfAno6D6u2PdS5ZbRYxQ2K7s1OZZD8Ufm6Tukxa4RZrlLb_gnx_.JxaUnfdR3lMla7lDC_KV6A";
const BASE = "http://localhost:3000";

async function main() {
  const res = await fetch(`${BASE}/api/auth/session`, {
    headers: {
      cookie: `next-auth.session-token=${token}`,
    },
  });
  console.log("status", res.status);
  console.log("headers", Array.from(res.headers.entries()));
  const text = await res.text();
  console.log("body", text);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
