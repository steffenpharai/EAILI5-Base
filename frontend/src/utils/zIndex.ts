export const Z_INDEX = {
  // Base layers
  base: 0,
  content: 1,
  
  // Navigation
  topBar: 10,
  footer: 10,
  feedbackBar: 10,
  fab: 50,
  
  // Overlays
  drawer: 100,
  drawerBackdrop: 99,
  mobileMenu: 101,
  
  // Modals
  modalBackdrop: 1000,
  modal: 1001,
  toast: 1100,
} as const;
