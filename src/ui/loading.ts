/** Fades out the loading screen in index.html, once, and then removes it. */
export function finishLoading() {
  const screen = document.getElementById('loading')
  if (!screen || screen.classList.contains('done')) return
  screen.classList.add('done')
  window.setTimeout(() => screen.remove(), 900)
}
