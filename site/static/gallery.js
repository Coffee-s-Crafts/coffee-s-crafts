(() => {
  const dialog = document.getElementById('imageModal');
  const image = document.getElementById('modalImg');
  const placeholder = image.src;
  const caption = document.getElementById('modalCaption');
  const links = [...document.querySelectorAll('.gallery-image')];
  let current = 0;
  let opener;
  let previousOverflow;

  function show(index) {
    current = (index + links.length) % links.length;
    const link = links[current];
    image.src = link.href;
    image.alt = link.querySelector('img').alt;
    caption.textContent = link.dataset.caption;
  }

  links.forEach((link, index) => link.addEventListener('click', event => {
    event.preventDefault();
    opener = link;
    show(index);
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    document.getElementById('modalClose').focus();
  }));
  document.getElementById('modalClose').addEventListener('click', () => dialog.close());
  document.getElementById('modalPrevious').addEventListener('click', () => show(current - 1));
  document.getElementById('modalNext').addEventListener('click', () => show(current + 1));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    image.src = placeholder;
    document.body.style.overflow = previousOverflow;
    opener?.focus();
  });
})();
