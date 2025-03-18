// renderer.js - Renderer process for the Electron app

const { ipcRenderer } = require('electron');

// Project data structure
let project = {
  title: 'Untitled Project',
  scenes: [],
  currentSceneIndex: 0,
  saveSlots: []
};

// Element selectors
const projectTitleInput = document.getElementById('project-title');
const newProjectBtn = document.getElementById('new-project');
const saveProjectBtn = document.getElementById('save-project');
const loadProjectBtn = document.getElementById('load-project');
const addSceneBtn = document.getElementById('add-scene');
const deleteSceneBtn = document.getElementById('delete-scene');
const sceneListEl = document.getElementById('scene-list');
const addBackgroundBtn = document.getElementById('add-background');
const addTextBtn = document.getElementById('add-text');
const addChoiceBtn = document.getElementById('add-choice');
const testPlayBtn = document.getElementById('test-play');
const sceneEditor = document.getElementById('scene-editor');
const sceneBackground = document.querySelector('.scene-background');
const sceneElements = document.querySelector('.scene-elements');
const elementProperties = document.getElementById('element-properties');
const playMode = document.getElementById('play-mode');
const gameBackground = document.querySelector('.game-background');
const gameElements = document.querySelector('.game-elements');
const gameTextbox = document.querySelector('.game-textbox');
const characterName = document.querySelector('.character-name');
const dialogueText = document.querySelector('.dialogue-text');
const gameChoices = document.querySelector('.game-choices');
const gameMenu = document.querySelector('.game-menu');
const resumeGameBtn = document.getElementById('resume-game');
const saveGameBtn = document.getElementById('save-game');
const loadGameBtn = document.getElementById('load-game');
const exitPlayBtn = document.getElementById('exit-play');

// Initialize the app
function init() {
  projectTitleInput.value = project.title;
  setupEventListeners();
  createNewProject();
}

// Set up all event listeners
function setupEventListeners() {
  // Project management
  projectTitleInput.addEventListener('input', updateProjectTitle);
  newProjectBtn.addEventListener('click', createNewProject);
  saveProjectBtn.addEventListener('click', saveProject);
  loadProjectBtn.addEventListener('click', loadProject);
  
  // Scene management
  addSceneBtn.addEventListener('click', addScene);
  deleteSceneBtn.addEventListener('click', deleteScene);
  
  // Element tools
  addBackgroundBtn.addEventListener('click', addBackground);
  addTextBtn.addEventListener('click', addTextBox);
  addChoiceBtn.addEventListener('click', addChoice);
  
  // Play mode
  testPlayBtn.addEventListener('click', startTestPlay);
  document.addEventListener('keydown', handleKeyPress);
  resumeGameBtn.addEventListener('click', toggleGameMenu);
  saveGameBtn.addEventListener('click', saveGameState);
  loadGameBtn.addEventListener('click', loadGameState);
  exitPlayBtn.addEventListener('click', exitPlayMode);
}

// Project management functions
function updateProjectTitle() {
  project.title = projectTitleInput.value;
}

function createNewProject() {
  project = {
    title: 'Untitled Project',
    scenes: [],
    currentSceneIndex: 0,
    saveSlots: []
  };
  
  projectTitleInput.value = project.title;
  
  // Create a default scene
  addScene();
  updateSceneList();
}

async function saveProject() {
  const result = await ipcRenderer.invoke('save-project');
  if (result.success) {
    alert(`Project saved successfully!`);
  } else {
    alert(`Failed to save project: ${result.message}`);
  }
}

async function loadProject() {
  const result = await ipcRenderer.invoke('load-project');
  if (result.success) {
    project = result.data;
    projectTitleInput.value = project.title;
    updateSceneList();
    selectScene(project.currentSceneIndex);
  } else if (result.message !== 'Open cancelled') {
    alert(`Failed to load project: ${result.message}`);
  }
}

// Scene management functions
function addScene() {
  const newScene = {
    id: Date.now().toString(),
    name: `Scene ${project.scenes.length + 1}`,
    background: '',
    elements: []
  };
  
  project.scenes.push(newScene);
  project.currentSceneIndex = project.scenes.length - 1;
  
  updateSceneList();
  loadScene(project.currentSceneIndex);
}

function deleteScene() {
  if (project.scenes.length <= 1) {
    alert('Cannot delete the only scene. Create a new scene first.');
    return;
  }
  
  project.scenes.splice(project.currentSceneIndex, 1);
  
  if (project.currentSceneIndex >= project.scenes.length) {
    project.currentSceneIndex = project.scenes.length - 1;
  }
  
  updateSceneList();
  loadScene(project.currentSceneIndex);
}

function updateSceneList() {
  sceneListEl.innerHTML = '';
  
  project.scenes.forEach((scene, index) => {
    const listItem = document.createElement('div');
    listItem.className = 'list-item';
    if (index === project.currentSceneIndex) {
      listItem.classList.add('selected');
    }
    listItem.textContent = scene.name;
    listItem.dataset.index = index;
    
    listItem.addEventListener('click', () => {
      selectScene(index);
    });
    
    sceneListEl.appendChild(listItem);
  });
}

function selectScene(index) {
  project.currentSceneIndex = index;
  updateSceneList();
  loadScene(index);
}

function loadScene(index) {
  if (!project.scenes[index]) return;
  
  const scene = project.scenes[index];
  
  // Set background
  if (scene.background) {
    sceneBackground.style.backgroundImage = `url('${scene.background}')`;
  } else {
    sceneBackground.style.backgroundImage = 'none';
  }
  
  // Load elements
  sceneElements.innerHTML = '';
  scene.elements.forEach(element => {
    createElementDOM(element);
  });
  
  // Clear properties panel
  elementProperties.innerHTML = '';
}

// Element management functions
async function addBackground() {
  const result = await ipcRenderer.invoke('select-image');
  
  if (result.success) {
    const currentScene = project.scenes[project.currentSceneIndex];
    currentScene.background = result.path;
    
    // Update the view
    sceneBackground.style.backgroundImage = `url('${result.path}')`;
    
    // Show background properties
    showBackgroundProperties();
  } else if (result.message !== 'Selection cancelled') {
    alert(`Failed to add background: ${result.message}`);
  }
}

function addTextBox() {
  const element = {
    id: Date.now().toString(),
    type: 'textbox',
    x: 50,
    y: 50,
    width: 500,
    height: 150,
    character: '',
    text: 'Enter dialogue here...',
    style: {
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      fontFamily: 'Arial',
      fontSize: '16px'
    }
  };
  
  addElementToScene(element);
}

function addChoice() {
  const element = {
    id: Date.now().toString(),
    type: 'choice',
    x: 50,
    y: 50,
    width: 400,
    options: [
      {
        text: 'Option 1',
        nextScene: -1  // -1 means no destination set
      },
      {
        text: 'Option 2',
        nextScene: -1
      }
    ],
    style: {
      backgroundColor: 'rgba(52, 152, 219, 0.8)',
      color: 'white',
      fontFamily: 'Arial',
      fontSize: '16px'
    }
  };
  
  addElementToScene(element);
}

function addElementToScene(element) {
  const currentScene = project.scenes[project.currentSceneIndex];
  currentScene.elements.push(element);
  
  createElementDOM(element);
}

function createElementDOM(element) {
  const el = document.createElement('div');
  el.className = `scene-element ${element.type}`;
  el.id = `element-${element.id}`;
  el.style.position = 'absolute';
  el.style.left = `${element.x}px`;
  el.style.top = `${element.y}px`;
  
  if (element.width) el.style.width = `${element.width}px`;
  if (element.height) el.style.height = `${element.height}px`;
  
  // Apply element styles
  if (element.style) {
    Object.keys(element.style).forEach(key => {
      el.style[key] = element.style[key];
    });
  }
  
  // Create content based on element type
  if (element.type === 'textbox') {
    const characterEl = document.createElement('div');
    characterEl.className = 'element-character';
    characterEl.textContent = element.character;
    characterEl.style.fontWeight = 'bold';
    characterEl.style.marginBottom = '5px';
    
    const textEl = document.createElement('div');
    textEl.className = 'element-text';
    textEl.textContent = element.text;
    
    el.appendChild(characterEl);
    el.appendChild(textEl);
  } else if (element.type === 'choice') {
    element.options.forEach(option => {
      const optionEl = document.createElement('div');
      optionEl.className = 'element-option';
      optionEl.textContent = option.text;
      optionEl.style.padding = '8px';
      optionEl.style.marginBottom = '5px';
      optionEl.style.backgroundColor = element.style.backgroundColor;
      optionEl.style.color = element.style.color;
      
      el.appendChild(optionEl);
    });
  }
  
  // Make element selectable
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    selectElement(element);
  });
  
  // Make element draggable
  makeDraggable(el, element);
  
  sceneElements.appendChild(el);
}

function selectElement(element) {
  // Highlight the selected element
  const elements = document.querySelectorAll('.scene-element');
  elements.forEach(el => el.classList.remove('selected'));
  
  const selectedEl = document.getElementById(`element-${element.id}`);
  if (selectedEl) {
    selectedEl.classList.add('selected');
  }
  
  // Show properties for the selected element
  showElementProperties(element);
}

function makeDraggable(el, elementData) {
  let offsetX, offsetY, isDragging = false;
  
  el.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - el.getBoundingClientRect().left;
    offsetY = e.clientY - el.getBoundingClientRect().top;
    el.style.cursor = 'grabbing';
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const sceneRect = sceneEditor.getBoundingClientRect();
    const x = e.clientX - sceneRect.left - offsetX;
    const y = e.clientY - sceneRect.top - offsetY;
    
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    
    // Update element data
    elementData.x = x;
    elementData.y = y;
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      el.style.cursor = 'grab';
    }
  });
}

// Properties panel functions
function showBackgroundProperties() {
  const currentScene = project.scenes[project.currentSceneIndex];
  
  elementProperties.innerHTML = `
    <div class="property-group">
      <div class="property-label">Background Image</div>
      <div>${currentScene.background ? currentScene.background.split('/').pop() : 'None'}</div>
      <button id="change-background" class="property-button">Change Background</button>
    </div>
  `;
  
  document.getElementById('change-background').addEventListener('click', addBackground);
}

function showElementProperties(element) {
  if (element.type === 'textbox') {
    showTextboxProperties(element);
  } else if (element.type === 'choice') {
    showChoiceProperties(element);
  }
}

function showTextboxProperties(element) {
  elementProperties.innerHTML = `
    <div class="property-group">
      <div class="property-label">Position</div>
      <div class="property-row">
        <label>X: <input type="number" id="element-x" class="property-input" value="${element.x}"></label>
        <label>Y: <input type="number" id="element-y" class="property-input" value="${element.y}"></label>
      </div>
    </div>
    <div class="property-group">
      <div class="property-label">Size</div>
      <div class="property-row">
        <label>Width: <input type="number" id="element-width" class="property-input" value="${element.width}"></label>
        <label>Height: <input type="number" id="element-height" class="property-input" value="${element.height}"></label>
      </div>
    </div>
    <div class="property-group">
      <div class="property-label">Content</div>
      <div class="property-row">
        <label>Character Name: <input type="text" id="element-character" class="property-input" value="${element.character}"></label>
      </div>
      <div class="property-row">
        <label>Text: <textarea id="element-text" class="property-input" rows="4">${element.text}</textarea></label>
      </div>
    </div>
    <div class="property-group">
      <div class="property-label">Style</div>
      <div class="property-row">
        <label>Background Color: <input type="color" id="element-bg-color" class="property-input" value="#000000"></label>
        <label>Text Color: <input type="color" id="element-text-color" class="property-input" value="#ffffff"></label>
      </div>
      <div class="property-row">
        <label>Font Size: <input type="number" id="element-font-size" class="property-input" value="${parseInt(element.style.fontSize)}"></label>
      </div>
    </div>
    <div class="property-group">
      <button id="delete-element" class="property-button">Delete Element</button>
    </div>
  `;
  
  // Set up event listeners for property changes
  document.getElementById('element-x').addEventListener('change', (e) => updateElementProperty(element, 'x', parseInt(e.target.value)));
  document.getElementById('element-y').addEventListener('change', (e) => updateElementProperty(element, 'y', parseInt(e.target.value)));
  document.getElementById('element-width').addEventListener('change', (e) => updateElementProperty(element, 'width', parseInt(e.target.value)));
  document.getElementById('element-height').addEventListener('change', (e) => updateElementProperty(element, 'height', parseInt(e.target.value)));
  document.getElementById('element-character').addEventListener('input', (e) => updateElementProperty(element, 'character', e.target.value));
  document.getElementById('element-text').addEventListener('input', (e) => updateElementProperty(element, 'text', e.target.value));
  
  // Style properties
  document.getElementById('element-bg-color').addEventListener('change', (e) => {
    element.style.backgroundColor = hexToRgba(e.target.value, 0.7);
    updateElementStyles(element);
  });
  
  document.getElementById('element-text-color').addEventListener('change', (e) => {
    element.style.color = e.target.value;
    updateElementStyles(element);
  });
  
  document.getElementById('element-font-size').addEventListener('change', (e) => {
    element.style.fontSize = `${e.target.value}px`;
    updateElementStyles(element);
  });
  
  document.getElementById('delete-element').addEventListener('click', () => deleteElement(element));
}

function showChoiceProperties(element) {
  let optionsHTML = '';
  
  element.options.forEach((option, index) => {
    const sceneOptions = project.scenes.map((scene, i) => {
      const selected = option.nextScene === i ? 'selected' : '';
      return `<option value="${i}" ${selected}>${scene.name}</option>`;
    }).join('');
    
    optionsHTML += `
      <div class="property-group">
        <div class="property-label">Option ${index + 1}</div>
        <div class="property-row">
          <label>Text: <input type="text" id="option-text-${index}" class="property-input" value="${option.text}"></label>
        </div>
        <div class="property-row">
          <label>Next Scene: 
            <select id="option-next-${index}" class="property-input">
              <option value="-1">No destination</option>
              ${sceneOptions}
            </select>
          </label>
        </div>
      </div>
    `;
  });
  
  elementProperties.innerHTML = `
    <div class="property-group">
      <div class="property-label">Position</div>
      <div class="property-row">
        <label>X: <input type="number" id="element-x" class="property-input" value="${element.x}"></label>
        <label>Y: <input type="number" id="element-y" class="property-input" value="${element.y}"></label>
      </div>
    </div>
    <div class="property-group">
      <div class="property-label">Size</div>
      <div class="property-row">
        <label>Width: <input type="number" id="element-width" class="property-input" value="${element.width}"></label>
      </div>
    </div>
    <div class="property-group">
      <div class="property-label">Style</div>
      <div class="property-row">
        <label>Background Color: <input type="color" id="element-bg-color" class="property-input" value="#3498db"></label>
        <label>Text Color: <input type="color" id="element-text-color" class="property-input" value="#ffffff"></label>
      </div>
    </div>
    ${optionsHTML}
    <div class="property-group">
      <button id="add-option" class="property-button">Add Option</button>
      <button id="delete-element" class="property-button">Delete Element</button>
    </div>
  `;
  
  // Set up event listeners
  document.getElementById('element-x').addEventListener('change', (e) => updateElementProperty(element, 'x', parseInt(e.target.value)));
  document.getElementById('element-y').addEventListener('change', (e) => updateElementProperty(element, 'y', parseInt(e.target.value)));
  document.getElementById('element-width').addEventListener('change', (e) => updateElementProperty(element, 'width', parseInt(e.target.value)));
  
  // Style properties
  document.getElementById('element-bg-color').addEventListener('change', (e) => {
    element.style.backgroundColor = hexToRgba(e.target.value, 0.8);
    updateElementStyles(element);
  });
  
  document.getElementById('element-text-color').addEventListener('change', (e) => {
    element.style.color = e.target.value;
    updateElementStyles(element);
  });
  
  // Option properties
  element.options.forEach((option, index) => {
    document.getElementById(`option-text-${index}`).addEventListener('input', (e) => {
      option.text = e.target.value;
      updateElementDOM(element);
    });
    
    document.getElementById(`option-next-${index}`).addEventListener('change', (e) => {
      option.nextScene = parseInt(e.target.value);
    });
  });
  
  document.getElementById('add-option').addEventListener('click', () => {
    element.options.push({
      text: `Option ${element.options.length + 1}`,
      nextScene: -1
    });
    
    showChoiceProperties(element);
    updateElementDOM(element);
  });
  
  document.getElementById('delete-element').addEventListener('click', () => deleteElement(element));
}

function updateElementProperty(element, property, value) {
  element[property] = value;
  updateElementDOM(element);
}

function updateElementStyles(element) {
  const el = document.getElementById(`element-${element.id}`);
  
  if (!el) return;
  
  Object.keys(element.style).forEach(key => {
    el.style[key] = element.style[key];
  });
  
  // Update child elements too
  if (element.type === 'choice') {
    const options = el.querySelectorAll('.element-option');
    options.forEach(option => {
      option.style.backgroundColor = element.style.backgroundColor;
      option.style.color = element.style.color;
    });
  }
}

function updateElementDOM(element) {
  const el = document.getElementById(`element-${element.id}`);
  
  if (!el) return;
  
  // Update position and size
  el.style.left = `${element.x}px`;
  el.style.top = `${element.y}px`;
  
  if (element.width) el.style.width = `${element.width}px`;
  if (element.height) el.style.height = `${element.height}px`;
  
  // Update content based on element type
  if (element.type === 'textbox') {
    const characterEl = el.querySelector('.element-character');
    const textEl = el.querySelector('.element-text');
    
    if (characterEl) characterEl.textContent = element.character;
    if (textEl) textEl.textContent = element.text;
  } else if (element.type === 'choice') {
    el.innerHTML = '';
    
    element.options.forEach(option => {
      const optionEl = document.createElement('div');
      optionEl.className = 'element-option';
      optionEl.textContent = option.text;
      optionEl.style.padding = '8px';
      optionEl.style.marginBottom = '5px';
      optionEl.style.backgroundColor = element.style.backgroundColor;
      optionEl.style.color = element.style.color;
      
      el.appendChild(optionEl);
    });
  }
}

function deleteElement(element) {
  const currentScene = project.scenes[project.currentSceneIndex];
  const index = currentScene.elements.findIndex(el => el.id === element.id);
  
  if (index !== -1) {
    currentScene.elements.splice(index, 1);
    
    const el = document.getElementById(`element-${element.id}`);
    if (el) el.remove();
    
    elementProperties.innerHTML = '';
  }
}

// Play mode functions
function startTestPlay() {
  if (project.scenes.length === 0) {
    alert('Cannot start playback: No scenes available.');
    return;
  }
  
  // Save current state
  ipcRenderer.invoke('update-project-data', project);
  
  // Show play mode
  playMode.classList.remove('hidden');
  
  // Start from the first scene
  playScene(0);
  
  // Add escape key handler
  document.addEventListener('keydown', handleKeyPress);
}

function exitPlayMode() {
  playMode.classList.add('hidden');
  gameMenu.classList.add('hidden');
  
  // Remove escape key handler
  document.removeEventListener('keydown', handleKeyPress);
}

function handleKeyPress(e) {
  if (e.key === 'Escape') {
    toggleGameMenu();
  }
}

function toggleGameMenu() {
  gameMenu.classList.toggle('hidden');
}

function playScene(sceneIndex) {
  const scene = project.scenes[sceneIndex];
  
  if (!scene) return;
  
  // Set background
  if (scene.background) {
    gameBackground.style.backgroundImage = `url('${scene.background}')`;
  } else {
    gameBackground.style.backgroundImage = 'none';
  }
  
  // Reset game elements
  gameElements.innerHTML = '';
  gameChoices.innerHTML = '';
  
  // Find the first textbox element
  const textElement = scene.elements.find(el => el.type === 'textbox');
  
  if (textElement) {
    characterName.textContent = textElement.character;
    dialogueText.textContent = textElement.text;
    gameTextbox.classList.remove('hidden');
  } else {
    gameTextbox.classList.add('hidden');
  }
  
  // Find any choice elements
  const choiceElement = scene.elements.find(el => el.type === 'choice');
  
  if (choiceElement) {
    choiceElement.options.forEach((option) => {
      const button = document.createElement('button');
      button.className = 'choice-button';
      button.textContent = option.text;
      
      button.addEventListener('click', () => {
        if (option.nextScene >= 0 && option.nextScene < project.scenes.length) {
          playScene(option.nextScene);
        }
      });
      
      gameChoices.appendChild(button);
    });
  }
}

function saveGameState() {
  const slot = prompt('Enter a name for this save:', `Save ${project.saveSlots.length + 1}`);
  
  if (!slot) return;
  
  project.saveSlots.push({
    name: slot,
    date: new Date().toLocaleString(),
    sceneIndex: project.currentSceneIndex
  });
  
  ipcRenderer.invoke('update-project-data', project);
  alert('Game state saved!');
}

function loadGameState() {
  if (project.saveSlots.length === 0) {
    alert('No saved games available.');
    return;
  }
  
  const saveOptions = project.saveSlots.map((save, index) => {
    return `${index + 1}) ${save.name} - ${save.date}`;
  }).join('\n');
  
  const selectedIndex = prompt(`Select a save to load:\n${saveOptions}`);
  
  if (!selectedIndex) return;
  
  const index = parseInt(selectedIndex) - 1;
  
  if (isNaN(index) || index < 0 || index >= project.saveSlots.length) {
    alert('Invalid selection.');
    return;
  }
  
  const save = project.saveSlots[index];
  playScene(save.sceneIndex);
  
  // Hide menu after loading
  gameMenu.classList.add('hidden');
}

// Utility functions
function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Initialize the app
init();