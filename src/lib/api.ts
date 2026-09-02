export async function fetchApi(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  let res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 401 && url !== '/api/auth/refresh' && url !== '/api/auth/login') {
    try {
      const refreshRes = await fetch('/api/auth/refresh', {
        method: 'POST',
      });
      if (refreshRes.ok) {
        const { token: newToken } = await refreshRes.json();
        localStorage.setItem('token', newToken);
        headers.set('Authorization', `Bearer ${newToken}`);
        res = await fetch(url, { ...options, headers });
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } catch (e) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }

  return res;
}
