// Centralized local storage getters and setters for consistency and robustness.
export const setLocalStorageItem = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing to localStorage key “${key}”:`, err);
  }
};

export const getLocalStorageItem = <T,>(key: string, fallback: T): T => {
  let raw: string | null;
  try {
    raw = localStorage.getItem(key);
    if (!raw) return fallback;
    if (raw === "null" || raw === "undefined") return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    if (typeof fallback === 'string' && raw) {
      return raw as T;
    }
    console.error(`Error reading from localStorage key “${key}”:`, err);
    return fallback;
  }
};

// Centralized BP category logic.
export const getBPCategory = (systolic: number | null, diastolic: number | null): { text: string; color: string; isCrisis: boolean; } => {
    if (systolic === null || diastolic === null || !systolic || !diastolic || systolic === 0 || diastolic === 0) {
        return { text: 'N/A', color: 'text-textSecondary', isCrisis: false };
    }
    if (systolic >= 180 || diastolic >= 120) return { text: 'Crisis Level', color: 'text-danger', isCrisis: true };
    if (systolic >= 140 || diastolic >= 90) return { text: 'Very High', color: 'text-danger', isCrisis: false };
    if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) return { text: 'High', color: 'text-warning', isCrisis: false };
    if (systolic >= 120 && systolic <= 129 && diastolic < 80) return { text: 'Slightly High', color: 'text-warning', isCrisis: false };
    if (systolic < 120 && diastolic < 80) return { text: 'In Range', color: 'text-success', isCrisis: false };
    return { text: 'N/A', color: 'text-textSecondary', isCrisis: false };
};

export const markdownToHtml = (text: string): string => {
  let html = text
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Headers (simple version)
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>');

  const lines = html.split('\n');
  let inList = false;
  html = '';

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
      if (!inList) {
        html += '<ul class="list-disc list-inside space-y-1">';
        inList = true;
      }
      html += `<li>${trimmedLine.substring(2)}</li>`;
    } else {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      if (trimmedLine) {
         // Check if it's already a heading before wrapping in a paragraph
        if (!trimmedLine.startsWith('<h')) {
            html += `<p>${trimmedLine}</p>`;
        } else {
            html += trimmedLine;
        }
      }
    }
  }

  if (inList) {
    html += '</ul>';
  }

  return html;
};