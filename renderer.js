
const refreshBtn = document.getElementById('refresh-btn');
const clipBtn = document.getElementById('clip-btn');
const clearBtn = document.getElementById('clear-btn');

// Read text from clipboard
refreshBtn.addEventListener('click', async () => {
  console.log('Read from clipboard')
  const text = await window.clipboardApi.readTextFromClipboard();
  document.getElementById('clip-text-content').innerHTML = text
});

// Write text to clipboard
clipBtn.addEventListener('click', async () => {
  console.log('Write to clipboard')
  const text = document.getElementById('clip-text-content').innerHTML
  await window.clipboardApi.writeTextToClipboard(text);
  console.log(`Text has been copied to clipboard`)
});

// Clear clipboard
clearBtn.addEventListener('click', async () => {
  console.log('Clear clipboard')
  // NOTE: intentionally overwrite whatever data is in the clipboard
  await window.clipboardApi.writeTextToClipboard('');
  document.getElementById('clip-text-content').innerHTML = ''
});