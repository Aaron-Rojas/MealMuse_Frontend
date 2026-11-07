jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => 'test-token'),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
}));

jest.mock('../config/firebase', () => ({
  auth: { currentUser: null, signOut: jest.fn() },
}));

const favorite = {
  id: 'f-1',
  nombre: 'Sopa',
  receta: { nombre: 'Sopa' },
  fecha_guardado: '2026-11-06T12:00:00Z',
};

function response(status, payload) {
  return {
    status,
    ok: status >= 200 && status < 300,
    text: async () => payload === null ? '' : JSON.stringify(payload),
  };
}

function loadApi() {
  return require('./api.ts');
}

beforeEach(() => {
  jest.resetModules();
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.test';
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.useRealTimers();
});

test('[PC-F-01] La URL se obtiene de EXPO_PUBLIC_API_BASE_URL y envía el token Bearer', async () => {
  global.fetch.mockResolvedValue(response(200, { por_vencer: 1, vencidos: 0 }));
  const api = loadApi();

  await api.getPantrySummary();

  expect(global.fetch).toHaveBeenCalledWith(
    'https://api.test/api/v1/pantry/expiring-summary',
    expect.objectContaining({ headers: expect.objectContaining({}) })
  );
  const headers = global.fetch.mock.calls[0][1].headers;
  expect(headers.get('Authorization')).toBe('Bearer test-token');
});

test('[HU-12 CA-01] Guardar trata HTTP 201 como creación exitosa', async () => {
  global.fetch.mockResolvedValue(response(201, favorite));
  const api = loadApi();

  await expect(api.saveFavorite(favorite.receta)).resolves.toEqual(favorite);
  expect(global.fetch.mock.calls[0][1].method).toBe('POST');
});

test('[HU-12 CA-01] Guardar trata HTTP 200 sin cuerpo como duplicado y recupera el registro', async () => {
  global.fetch
    .mockResolvedValueOnce(response(200, null))
    .mockResolvedValueOnce(response(200, [favorite]));
  const api = loadApi();

  await expect(api.saveFavorite(favorite.receta)).resolves.toEqual(favorite);
  expect(global.fetch).toHaveBeenCalledTimes(2);
});

test('[HU-12 CA-05] DELETE 204 elimina la favorita de la caché', async () => {
  global.fetch
    .mockResolvedValueOnce(response(200, [favorite]))
    .mockResolvedValueOnce(response(204, null));
  const api = loadApi();
  await api.listFavorites({ refresh: true });

  await expect(api.deleteFavorite(favorite.id)).resolves.toBeUndefined();
  expect(global.fetch.mock.calls[1][1].method).toBe('DELETE');
  expect(api.getCachedFavorites()).toEqual([]);
});

test('[PC-F-08] Token de sesión se persiste con expo-secure-store', async () => {
  global.fetch.mockResolvedValue(response(200, { access_token: 'new-test-token' }));
  const api = loadApi();

  await api.syncWithBackend('firebase-test-token');

  expect(require('expo-secure-store').setItemAsync).toHaveBeenCalledWith('mealmuse_access_token', 'new-test-token');
});

test('[HU-12 CA-05] Cerrar sesión limpia la caché en memoria de favoritas', async () => {
  global.fetch
    .mockResolvedValueOnce(response(200, [favorite]))
    .mockResolvedValueOnce(response(204, null));
  const api = loadApi();
  await api.listFavorites({ refresh: true });

  await api.logoutFromBackend();

  expect(api.getCachedFavorites()).toBeNull();
  expect(require('expo-secure-store').deleteItemAsync).toHaveBeenCalled();
});

test.each([404, 422])('[PC-F-02] Error HTTP %s conserva status y detalle de backend', async (status) => {
  global.fetch.mockResolvedValue(response(status, { detail: 'error de prueba' }));
  const api = loadApi();

  await expect(api.getPantrySummary()).rejects.toMatchObject({ status, message: 'error de prueba' });
});

test('[PC-F-03] Respuesta 401 elimina token y caché de favoritas y dispara el manejador de Login', async () => {
  global.fetch
    .mockResolvedValueOnce(response(200, [favorite]))
    .mockResolvedValueOnce(response(401, { detail: 'sesión expirada' }));
  const api = loadApi();
  const onExpired = jest.fn();
  api.setAuthenticationExpiredHandler(onExpired);
  await api.listFavorites({ refresh: true });

  await expect(api.getPantrySummary()).rejects.toMatchObject({ status: 401 });
  expect(require('expo-secure-store').deleteItemAsync).toHaveBeenCalled();
  expect(api.getCachedFavorites()).toBeNull();
  expect(onExpired).toHaveBeenCalledTimes(1);
});

test('[PC-F-04] Error de red se propaga sin respuesta exitosa simulada', async () => {
  global.fetch.mockRejectedValue(new Error('network down'));
  const api = loadApi();

  await expect(api.getPantrySummary()).rejects.toThrow('network down');
});

test('[PC-F-05] Timeout aborta la solicitud y devuelve un error explícito', async () => {
  jest.useFakeTimers();
  global.fetch.mockImplementation((_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => {
      const error = new Error('aborted');
      error.name = 'AbortError';
      reject(error);
    });
  }));
  const api = loadApi();
  const request = api.getPantrySummary();
  const assertion = expect(request).rejects.toThrow('La solicitud tardó demasiado. Intenta de nuevo.');
  await jest.advanceTimersByTimeAsync(15000);

  await assertion;
});
