import html2canvas from 'html2canvas';

/**
 * Renders a hidden DOM element to a PNG and triggers a download.
 * @param {HTMLElement} element — the off-screen card container
 * @param {string} filename — e.g. "pamilyalab-results.png"
 * @returns {Promise<void>}
 */
export async function downloadCardImage(element, filename = 'pamilyalab-results.png') {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#1c1917', // stone-900
    width: 1080,
    height: 1350,
  });

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
