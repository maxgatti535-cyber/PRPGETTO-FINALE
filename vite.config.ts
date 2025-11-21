const enabledActions = (Object.keys(quickActionMap) as QuickActionKey[])
    .filter(key => coachSettings[key])
    .map(key => quickActionMap[key]);
  
  setActiveQuickActions(enabledActions);
};

updateQuickActions(); // Initial load
window.addEventListener('settings-changed', updateQuickActions);

return () => {
  window.removeEventListener('settings-changed', updateQuickActions);
};
