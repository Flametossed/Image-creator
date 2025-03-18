// main.js - Main process file for Electron app

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let projectData = {
  title: 'Untitled Project',
  scenes: [],
  currentScene: 0,
  saveSlots: []
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

// IPC handlers for project management
ipcMain.handle('save-project', async (event, projectPath) => {
  try {
    if (!projectPath) {
      const { filePath } = await dialog.showSaveDialog({
        title: 'Save Visual Novel Project',
        defaultPath: projectData.title,
        filters: [{ name: 'Visual Novel Project', extensions: ['vnp'] }]
      });
      
      if (!filePath) return { success: false, message: 'Save cancelled' };
      projectPath = filePath;
    }
    
    fs.writeFileSync(projectPath, JSON.stringify(projectData, null, 2));
    return { success: true, path: projectPath };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('load-project', async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog({
      title: 'Open Visual Novel Project',
      filters: [{ name: 'Visual Novel Project', extensions: ['vnp'] }],
      properties: ['openFile']
    });
    
    if (!filePaths || filePaths.length === 0) {
      return { success: false, message: 'Open cancelled' };
    }
    
    const projectPath = filePaths[0];
    const data = fs.readFileSync(projectPath, 'utf8');
    projectData = JSON.parse(data);
    
    return { success: true, data: projectData };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('select-image', async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog({
      title: 'Select Background Image',
      filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif'] }],
      properties: ['openFile']
    });
    
    if (!filePaths || filePaths.length === 0) {
      return { success: false, message: 'Selection cancelled' };
    }
    
    // Copy the selected image to the project's assets folder
    const imagePath = filePaths[0];
    const fileName = path.basename(imagePath);
    const assetsPath = path.join(app.getPath('userData'), 'assets');
    
    if (!fs.existsSync(assetsPath)) {
      fs.mkdirSync(assetsPath, { recursive: true });
    }
    
    const destPath = path.join(assetsPath, fileName);
    fs.copyFileSync(imagePath, destPath);
    
    return { success: true, path: destPath, fileName };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('update-project-data', (event, data) => {
  projectData = data;
  return { success: true };
});