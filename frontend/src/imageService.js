// imageService.js
// Handles uploading a picture (event photo, etc.) to the backend's generic
// image-upload endpoint (ImagesController) and turning the relative URL it
// returns into something an <img> tag can actually load.
// Relative — goes through Vite's dev-server proxy to the backend, matching
// api.js / eventService.js. resolveImageUrl below already treats an empty
// origin as "just use the relative /uploads/... URL as-is".
export const API_ORIGIN = '';

const getAuthHeaders = () => {
  const userJson = localStorage.getItem('user');
  if (userJson) {
    try {
      const userData = JSON.parse(userJson);
      const token = userData.token || userData.accessToken || userData.jwt || userData.authToken;
      if (token) return { Authorization: `Bearer ${token}` };
    } catch (err) {
      console.error('Error parsing user from localStorage', err);
    }
  }
  return {};
};

export const imageService = {
  // Uploads a picture file and returns the relative URL the backend wants
  // saved on the event/organiser record (e.g. "/uploads/abc123.jpg").
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_ORIGIN}/api/Images/upload`, {
      method: 'POST',
      headers: getAuthHeaders(), // don't set Content-Type — the browser sets the multipart boundary
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to upload image.');
    }

    return response.json(); // controller returns the relative URL as a JSON string
  },

  // Turns a relative "/uploads/xxx.jpg" URL from the backend into an absolute
  // one the browser can actually fetch. Leaves already-absolute URLs alone.
  resolveImageUrl(url) {
    if (!url) return null;
    return url.startsWith('http') ? url : `${API_ORIGIN}${url}`;
  },
};
