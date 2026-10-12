import * as bcrypt from "bcryptjs";
const candidate = "Password123!";
const hashes = {
  "admin@mwt.gt": "$2b$10$muf.LQLl9purgtOCvPiNge5PIshUY1zN2AEkQ7h4R4lsKo/ZdWKfa",
  "admin@acmg.gt": "$2b$10$R9KigkLHDHK9SS7wwE.iR.pV3b.sUDyE5WFxLOx2aFLxymWu1.pBS",
};
(async () => {
  for (const [email, hash] of Object.entries(hashes)) {
    const ok = await bcrypt.compare(candidate, hash);
    console.log(`${email}: ${ok ? "MATCH ✓" : "no"}`);
  }
  await p_();
})();
function p_() { return Promise.resolve(); }
