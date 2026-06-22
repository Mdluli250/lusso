const token =
  "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..9j7oBniKCHoTinMW.g_44MNpbB-P-T4SWbj8y64JYy2J43ioMuoY-yal9EyCs2ft6uYAX6YIyobSBOMmw5ykzfr_AKFIa4Ov6zWZY9UCBvPYD7KeSCnRinVSbyDlZPr2rH141tXDIEkh5wwPcJO0CfnzBM7BRPwOHTaYkkOtpRUZMFsqPS9ptm7orgzVmoZndrDfAno6D6u2PdS5ZbRYxQ2K7s1OZZD8Ufm6Tukxa4RZrlLb_gnx_.JxaUnfdR3lMla7lDC_KV6A";
const url = "http://localhost:3000/api/auth/session";

(async () => {
  const res = await fetch(url, {
    headers: { cookie: `next-auth.session-token=${token}` },
  });
  const cookies = res.headers.get("set-cookie") ?? "";
  const match = cookies.match(/next-auth\.session-token=([^;]+)/);
  if (!match) {
    console.error("No session token cookie found");
    process.exit(1);
  }
  console.log(match[1]);
})();
