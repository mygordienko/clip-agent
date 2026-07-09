
const refreshBtn = document.getElementById('refresh-btn');
const clipBtn = document.getElementById('clip-btn');
const clearBtn = document.getElementById('clear-btn');

const EMPTY_MARKER = 'Empty'

// Read text from clipboard
refreshBtn.addEventListener('click', async () => {
  console.log('Read from clipboard')
  const text = await window.clipboardApi.readTextFromClipboard();
  document.getElementById('clip-text-content').innerHTML = text ? text : ''
  if (!text) {
    document.getElementById('info-text').innerHTML = EMPTY_MARKER
  } else {
    document.getElementById('info-text').innerHTML = ''
  }
});

// Write text to clipboard
clipBtn.addEventListener('click', async () => {
  console.log('Write to clipboard')
  const text = document.getElementById('clip-text-content').innerHTML
  await window.clipboardApi.writeTextToClipboard(text);
  console.log('Text has been copied to clipboard')
});

// Clear clipboard
clearBtn.addEventListener('click', async () => {
  console.log('Clear clipboard')
  // NOTE: intentionally overwrite whatever data is in the clipboard
  await window.clipboardApi.writeTextToClipboard('');
  document.getElementById('clip-text-content').innerHTML = ''
  document.getElementById('info-text').innerHTML = EMPTY_MARKER
});