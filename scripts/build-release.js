const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const customDomainFile = path.join(projectRoot, "CNAME");
const docsDir = path.join(projectRoot, "docs");
const docsAssetsDir = path.join(docsDir, "assets");
const docsLeafletDir = path.join(docsAssetsDir, "leaflet");
const leafletDistDir = path.join(projectRoot, "node_modules", "leaflet", "dist");

build();

function build() {
  ensureLeafletInstalled();
  resetDist();
  copyStaticFiles();
  copyLeafletAssets();
  writeReleaseHtml();
}

function ensureLeafletInstalled() {
  if (!fs.existsSync(leafletDistDir)) {
    throw new Error("Leaflet is not installed. Run `npm install` before building.");
  }
}

function resetDist() {
  fs.rmSync(docsDir, { recursive: true, force: true });
  fs.mkdirSync(docsLeafletDir, { recursive: true });
}

function copyStaticFiles() {
  fs.copyFileSync(path.join(projectRoot, "db.json"), path.join(docsDir, "db.json"));
  fs.cpSync(path.join(projectRoot, "assets"), docsAssetsDir, { recursive: true });

  if (fs.existsSync(customDomainFile)) {
    fs.copyFileSync(customDomainFile, path.join(docsDir, "CNAME"));
  }
}

function copyLeafletAssets() {
  const filesToCopy = ["leaflet.css", "leaflet.js"];

  filesToCopy.forEach((fileName) => {
    fs.copyFileSync(path.join(leafletDistDir, fileName), path.join(docsLeafletDir, fileName));
  });

  fs.cpSync(path.join(leafletDistDir, "images"), path.join(docsLeafletDir, "images"), { recursive: true });
}

function writeReleaseHtml() {
  const sourceHtml = fs.readFileSync(path.join(projectRoot, "index.html"), "utf8");
  const releaseHtml = sourceHtml
    .replace("./node_modules/leaflet/dist/leaflet.css", "./assets/leaflet/leaflet.css")
    .replace("./node_modules/leaflet/dist/leaflet.js", "./assets/leaflet/leaflet.js");

  fs.writeFileSync(path.join(docsDir, "index.html"), releaseHtml);
}
