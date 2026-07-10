const fs = require('node:fs');
const path = require('node:path');
const { app } = require('electron');

const DEFAULT_CONFIG_PATH = "config.json"
const DEFAULT_CONFIG = {
  version: 1,
  enableClipboardServer: true,
  clipboardServerPort: 56001
}

// Get the absolute path to userData directory
const userDataDir = app.getPath('userData');
let config = DEFAULT_CONFIG

class ConfigurationService {
  constructor() {
    this.configFilePath = path.join(userDataDir, DEFAULT_CONFIG_PATH)
    console.log(`Config location: ${this.configFilePath}`)
    if (fs.existsSync(this.configFilePath)) {
      try {
        // TODO: validation
        const rawData = fs.readFileSync(this.configFilePath, 'utf8');
        config = JSON.parse(rawData);
      } catch (error) {
        console.error("Error reading config", error);
        return DEFAULT_CONFIG;
      }
    } else {
      console.warn("Config not found")
      // Convert the JavaScript object to a JSON string
      // The null is a placeholder for the replacer function, and 2 specifies the indentation size (spaces) for pretty-printing.
      const jsonString = JSON.stringify(DEFAULT_CONFIG, null, 2);

      // Write the file synchronously
      try {
        const dir = path.dirname(this.configFilePath);
    
        // Create directories synchronously
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(this.configFilePath, jsonString, 'utf-8');
      } catch (error) {
        console.error("Error writing default config", error);
      }

      config = DEFAULT_CONFIG
    }
  }

  getConfig() {
    return config
  }
}

const configurationService = new ConfigurationService()

module.exports = configurationService;