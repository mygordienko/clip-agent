const express = require('express');
const { net } = require('electron');

class ClipboardClient {
  /**
   * @param {string} baseUrl - The target 'http://host:port'
   */
  constructor(baseUrl = 'localhost:56001') {
    const targetUrl = new URL(baseUrl)
    targetUrl.pathname = '/api/v1/clipboard'
    this.url = targetUrl;
    console.log(`Client target; ${this.url }`)
  }

  async fetchRemoteClipboard(url, timeoutMs = 1000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await net.fetch(this.url, {
        signal: controller.signal
      });

      if (response.ok || response.status === 204) {
        return await response.text()
      } else {
        throw new Error(`Error pulling remote, status ${response.status}`);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Timeout pulling remote')
      }

      throw error
    } finally {
      clearTimeout(id)
    }
  }
}

class ClipboardServer {
  /**
   * @param {number} port - The target network port
   * @param {Function} getDataCallback - A function that returns clipboard value
   * TODO: implement proper state machine (started, shuttingdown, stopped)
   */
  constructor(port = 56001, getDataCallback) {
    this.port = port;
    this.getDataCallback = getDataCallback;
    
    this.appExpress = express();
    this.serverInstance = null;
    this.isShuttingDown = false;

    this.appExpress.use(express.json());
    this.setupRoutes();
  }

  start() {
    this.isShuttingDown = false;

    this.serverInstance = this.appExpress.listen(this.port, () => {
      console.log(`[ClipboardServer] Running natively on port ${this.port}`);
    });

    this.serverInstance.on('error', (err) => {
      console.error('[ClipboardServer] System network error:', err.message);
    });
  }

  setupRoutes() {
    this.appExpress.get('/api/v1/clipboard', (req, res) => {
      if (this.isShuttingDown) {
        return res.status(503).json({ error: 'Server is shutting down' });
      }

      try {
        // Instantaneous, synchronous data retrieval within the Main Process
        const textValue = this.getDataCallback();

        if (textValue) {
          res.status(200).type('text').send(textValue)
        } else {
          res.status(204).type('text').send()
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.appExpress.use((req, res, next) => {
          res.status(404).json({
            status: 404,
            error: 'Not Found',
            message: 'The requested resource could not be found.'
        });
    });
  }

  close() {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    console.log('[ClipboardServer] Releasing system port bindings...');

    if (this.serverInstance) {
      this.serverInstance.close(() => {
        console.log('[ClipboardServer] Port completely closed and freed up.');
      });
    }
  }
}

module.exports = { ClipboardServer, ClipboardClient };