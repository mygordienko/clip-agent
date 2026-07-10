const express = require('express');

class ClipboardServer {
  /**
   * @param {number} port - The target network port
   * @param {Function} getDataCallback - A function that returns clipboard value
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
          res.status(200).json({ value: textValue });
        } else {
          res.status(204).json({});
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

module.exports = ClipboardServer;