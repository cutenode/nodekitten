const { writeFileSync } = require("fs");

const bent = require("bent");
const getJSON = bent("json");

run();

async function run() {
  const nodeVersions = await getJSON("https://nodejs.org/dist/index.json"); // read the remote JSON from an official source
  writeFileSync(
    "cache/index.json",
    JSON.stringify(nodeVersions, null, 2) + "\n"
  );
  console.log("cache/index.json written");
}
