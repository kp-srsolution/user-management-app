const path = require("path");
const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");

let backendProcess;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "../build/index.html"));
}

app.whenReady().then(() => {
  // Path to backend exe
  const exePath = app.isPackaged
    ? path.join(process.resourcesPath, "backend", "MyFirstApi.exe")
    : path.join(__dirname, "../build/backend/MyFirstApi.exe");

  console.log("👉 Expected backend exe path:", exePath);

  backendProcess = spawn(exePath, [], {
    cwd: path.dirname(exePath),
  });

  backendProcess.on("error", (err) => {
    console.error("❌ Failed to start backend:", err);
  });

  backendProcess.stdout.on("data", (data) => {
    console.log(`📢 Backend: ${data}`);
  });

  backendProcess.stderr.on("data", (data) => {
    console.error(`⚠️ Backend error: ${data}`);
  });

  createWindow();
});

app.on("will-quit", () => {
  if (backendProcess) backendProcess.kill();
});
