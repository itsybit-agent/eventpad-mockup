// ===========================================
// SHEET HELPERS
// ===========================================

export function showSheet(idOrContent) {
  // If it looks like HTML content, use dynamic sheet
  if (idOrContent.includes('<')) {
    const overlay = document.getElementById('dynamicSheet');
    const content = document.getElementById('dynamicSheetContent');
    content.innerHTML = idOrContent;
    overlay.classList.add('active');
  } else {
    // Static sheet by ID
    document.getElementById(idOrContent).classList.add('active');
  }
}

export function hideSheet(id) {
  if (id) {
    document.getElementById(id).classList.remove('active');
  } else {
    // Hide dynamic sheet
    document.getElementById('dynamicSheet').classList.remove('active');
  }
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
