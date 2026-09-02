const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const WWW = path.join(ROOT, "www");

const EXCLUDED_ITEMS = new Set([
    ".git",
    ".github",
    ".vscode",
    "node_modules",
    "android",
    "ios",
    "www",
    "tools",

    "package.json",
    "package-lock.json",

    "capacitor.config.json",
    "capacitor.config.ts"
]);

function removeFolder(folder) {
    if (fs.existsSync(folder)) {
        fs.rmSync(folder, {
            recursive: true,
            force: true
        });
    }
}

function createFolder(folder) {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, {
            recursive: true
        });
    }
}

function copyWebsite(source, destination) {
    createFolder(destination);

    const entries = fs.readdirSync(source, {
        withFileTypes: true
    });

    for (const entry of entries) {
        if (EXCLUDED_ITEMS.has(entry.name)) {
            continue;
        }

        const sourcePath = path.join(
            source,
            entry.name
        );

        const destinationPath = path.join(
            destination,
            entry.name
        );

        if (entry.isDirectory()) {
            copyWebsite(
                sourcePath,
                destinationPath
            );
        } else {
            fs.copyFileSync(
                sourcePath,
                destinationPath
            );

            console.log(
                "Copied:",
                path.relative(ROOT, sourcePath)
            );
        }
    }
}

console.log("");
console.log("==========================================");
console.log(" Platform Technologies");
console.log(" Preparing Offline Android Application");
console.log("==========================================");
console.log("");

removeFolder(WWW);

createFolder(WWW);

copyWebsite(
    ROOT,
    WWW
);

const indexFile = path.join(
    WWW,
    "index.html"
);

if (!fs.existsSync(indexFile)) {
    console.error("");
    console.error(
        "ERROR: index.html was not found."
    );

    console.error(
        "Make sure index.html is in the root project folder."
    );

    process.exit(1);
}

console.log("");
console.log("==========================================");
console.log(" SUCCESS");
console.log(" Website copied to www/");
console.log("==========================================");
console.log("");