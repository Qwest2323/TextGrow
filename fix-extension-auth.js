// Run this in the Chrome extension popup console to fix auth issues
// Open popup, then press F12 to open dev tools, go to Console tab, and paste this:

(async function() {
  console.log('🔧 TextGrow Extension Auth Fix');
  
  // Clear all stored data
  await chrome.storage.local.clear();
  console.log('✅ Cleared all stored data');
  
  // Check what was cleared
  const remaining = await chrome.storage.local.get();
  console.log('📋 Remaining storage:', remaining);
  
  console.log('🎯 Next steps:');
  console.log('1. Close this popup');
  console.log('2. Go to your dashboard at http://localhost:3000');
  console.log('3. Get a new token from the extension setup page');
  console.log('4. Open the extension popup again');
  console.log('5. Paste the new token');
  
  // Force reload the popup UI
  if (typeof window.textGrowPopup !== 'undefined') {
    window.textGrowPopup.loadData().then(() => {
      window.textGrowPopup.updateUI();
      console.log('🔄 Popup UI refreshed');
    });
  }
})();