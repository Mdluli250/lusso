import "dotenv/config";
import { getToken } from "next-auth/jwt";

(async () => {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET missing");
  const token =
    "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..9j7oBniKCHoTinMW.g_44MNpbB-P-T4SWbj8y64JYy2J43ioMuoY-yal9EyCs2ft6uYAX6YIyobSBOMmw5ykzfr_AKFIa4Ov6zWZY9UCBvPYD7KeSCnRinVSbyDlZPr2rH141tXDIEkh5wwPcJO0CfnzBM7BRPwOHTaYkkOtpRUZMFsqPS9ptm7orgzVmoZndrDfAno6D6u2PdS5ZbRYxQ2K7s1OZZD8Ufm6Tukxa4RZrlLb_gnx_.JxaUnfdR3lMla7lDC_KV6A";
  const req = {
    cookies: new Map([["next-auth.session-token", token]]),
    headers: {},
  } as any;
  const result = await getToken({ req, secret, raw: false });
  console.log("getToken result", result);
})();
