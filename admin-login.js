(() => {
  const $ = selector => document.querySelector(selector);
  const form = $('#admin-login-form');
  const api = window.RecyLightAPI;
  if (!api) { $('#login-error').textContent = 'API client did not load. Refresh this page.'; return; }

  (async () => {
    if (!api.getToken()) return;
    try { await api.adminMe(); location.replace('admin.html'); }
    catch { api.setToken(null); }
  })();

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const button = $('#login-submit');
    $('#login-error').textContent = '';
    button.disabled = true;
    button.textContent = 'Signing in…';
    try {
      await api.adminLogin({ email: $('#admin-email').value.trim().toLowerCase(), password: $('#admin-password').value });
      await api.adminMe();
      sessionStorage.setItem('recy-admin-session', 'active');
      location.replace('admin.html');
    } catch (error) {
      api.setToken(null);
      $('#login-error').textContent = error.message || 'Admin sign-in failed. Check your credentials and API connection.';
    } finally {
      button.disabled = false;
      button.innerHTML = 'Sign in <span aria-hidden="true">→</span>';
    }
  });
  $('#admin-forgot-password')?.addEventListener('click', () => {
    const note = $('#admin-reset-note');
    note.textContent = 'Admin password reset is not configured. Contact the RecyLight backend administrator.';
    note.hidden = false;
  });
})();
