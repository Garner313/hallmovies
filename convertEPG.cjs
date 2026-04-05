const fs = require("fs");
const csv = require("csv-parser");

const results = [];

fs.createReadStream("epg.csv")
  .pipe(csv())
  .on("data", (row) => {
    const keys = Object.keys(row);

    const programName = row[keys[0]];
    const startDate = row[keys[1]];
    const startTime = row[keys[2]];
    const duration = row[keys[3]];

    if (!programName || !startDate || !startTime || !duration) return;

    const titleParts = programName.split("-");
    const rating = titleParts.pop();
    const title = titleParts.join("-").trim();

    const [day, month, year] = startDate.split("/");
    const isoDate = `20${year}-${month}-${day}`;

    const startDateTime = new Date(`${isoDate} ${startTime}`);

    const durationParts = duration.trim().split(":");
    const durationSeconds =
      parseInt(durationParts[0]) * 3600 +
      parseInt(durationParts[1]) * 60 +
      parseInt(durationParts[2]);

    results.push({
      title,
      rating,
      start: startDateTime.toISOString(),
      durationSeconds,
    });
  })
  .on("end", () => {
    if (!fs.existsSync("public")) {
      fs.mkdirSync("public");
    }

    fs.writeFileSync(
      "./public/epg.json",
      JSON.stringify(results, null, 2)
    );

    console.log("EPG converted successfully.");
  });