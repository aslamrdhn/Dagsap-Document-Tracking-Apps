export async function fetchApi(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  let res = await fetch(url, fetchOptions);
  
  if (res.status === 401 && url !== '/api/auth/refresh' && url !== '/api/auth/login') {
    try {
      const refreshRes = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: localStorage.getItem('refreshToken') }),
        credentials: 'include',
      });
      if (refreshRes.ok) {
        const { token: newToken, refreshToken: newRefreshToken } = await refreshRes.json();
        localStorage.setItem('token', newToken);
        if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
        headers.set('Authorization', `Bearer ${newToken}`);
        fetchOptions.headers = headers;
        res = await fetch(url, fetchOptions);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    } catch (e) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  return res;
}
