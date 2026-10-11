(() => {
  const form = document.getElementById('commissionBrief');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const body = [...form.elements].filter(field => field.name).map(field => {
      const label = document.querySelector(`label[for="${field.id}"]`).textContent;
      return `${label}: ${field.value}`;
    }).join('\n\n');
    const preview = document.getElementById('briefPreview');
    preview.value = body;
    document.getElementById('briefEmail').href = `mailto:${encodeURIComponent(form.dataset.email)}?subject=${encodeURIComponent(form.dataset.subject)}&body=${encodeURIComponent(body)}`;
    document.getElementById('briefResult').hidden = false;
    preview.focus();
  });
})();
