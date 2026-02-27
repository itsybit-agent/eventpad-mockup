// ===========================================
// SHEET HELPERS
// ===========================================

export function showSheet(id) {
  document.getElementById(id).classList.add('active');
}

export function hideSheet(id) {
  document.getElementById(id).classList.remove('active');
}

export function hideAllSheets() {
  document.querySelectorAll('.sheet-overlay').forEach(s => s.classList.remove('active'));
}

// Initialize sheet click-outside-to-close
export function initSheets() {
  document.querySelectorAll('.sheet-overlay').forEach(overlay => {
    overlay.onclick = (e) => { 
      if (e.target === overlay) hideAllSheets(); 
    };
  });
}
