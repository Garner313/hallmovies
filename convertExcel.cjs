const fs = require("fs");
const XLSX = require("xlsx");

// Read Excel
const workbook = XLSX.readFile("EPG.xlsx");
const sheet = workbook.Sheets[workbook.SheetNames[0]];

// Convert
const rawData = XLSX.utils.sheet_to_json(sheet, { raw: false });

console.log("Rows found:", rawData.length);

// Clean keys (remove spaces)
const data = rawData.map((row) => {
  const cleanRow = {};
  Object.keys(row).forEach((key) => {
    cleanRow[key.trim()] = row[key];
  });
  return cleanRow;
});

console.log("Sample row:", data[0]);

const epg = data
  .map((row) => {
    try {
      const title = row["Program Name"];
      const date = row["Schedule Start Date"];
      const time = row["Schedule Start Time"];
      let duration = row["Schedule Duration"] || "01:30:00";

      if (!title || !date || !time) return null;

      const start = new Date(`${date} ${time}`);
      if (isNaN(start)) {
        console.log("❌ Bad row:", row);
        return null;
      }

      duration = duration.toString().trim();
      const [h = 0, m = 0, s = 0] = duration.split(":").map(Number);

      return {
        title,
        rating: title.split("-").pop(),
        start: start.toISOString(), // correct format
        durationSeconds: h * 3600 + m * 60 + s,
      };
    } catch {
      return null;
    }
  })
  .filter(Boolean);

// Save
fs.writeFileSync("public/epg.json", JSON.stringify(epg, null, 2));

console.log("✅ Converted:", epg.length, "programs");