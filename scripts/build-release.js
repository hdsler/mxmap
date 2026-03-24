const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const distAssetsDir = path.join(distDir, "assets");
const distLeafletDir = path.join(distAssetsDir, "leaflet");
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
  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distLeafletDir, { recursive: true });
}

function copyStaticFiles() {
  fs.copyFileSync(path.join(projectRoot, "db.json"), path.join(distDir, "db.json"));
  fs.cpSync(path.join(projectRoot, "assets"), distAssetsDir, { recursive: true });
}

function copyLeafletAssets() {
  const filesToCopy = ["leaflet.css", "leaflet.js"];

  filesToCopy.forEach((fileName) => {
    fs.copyFileSync(path.join(leafletDistDir, fileName), path.join(distLeafletDir, fileName));
  });

  fs.cpSync(path.join(leafletDistDir, "images"), path.join(distLeafletDir, "images"), { recursive: true });
}

function writeReleaseHtml() {
  const sourceHtml = fs.readFileSync(path.join(projectRoot, "index.html"), "utf8");
  const releaseHtml = sourceHtml
    .replace("./node_modules/leaflet/dist/leaflet.css", "./assets/leaflet/leaflet.css")
    .replace("./node_modules/leaflet/dist/leaflet.js", "./assets/leaflet/leaflet.js");

  fs.writeFileSync(path.join(distDir, "index.html"), releaseHtml);
}
