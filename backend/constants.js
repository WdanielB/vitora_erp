const INITIAL_DATE = new Date('2023-10-27T10:00:00Z').toISOString();

const DEFAULT_FLOWER_ITEMS = [
  { id: 'f1', name: 'Rosas', price: 5, visible: true, imageUrl: 'https://storage.googleapis.com/gemini-prod-us-west1-assets/images/6113b5e0-4591-4560-848e-2e4e60155761.jpeg', costoPaquete: 40, cantidadPorPaquete: 24, merma: 2, costHistory: [{ date: INITIAL_DATE, costoPaquete: 40 }] },
  { id: 'f2', name: 'Tulipanes', price: 18, visible: true, imageUrl: 'https://storage.googleapis.com/gemini-prod-us-west1-assets/images/154c5c76-d621-499c-9c03-add61b585317.jpeg', costoPaquete: 90, cantidadPorPaquete: 10, merma: 1, costHistory: [{ date: INITIAL_DATE, costoPaquete: 90 }] },
  { id: 'f3', name: 'Hortensia', price: 9, visible: true, imageUrl: 'https://storage.googleapis.com/gemini-prod-us-west1-assets/images/943c2c10-746a-4d22-b941-86082e053a47.jpeg', costoPaquete: 5, cantidadPorPaquete: 1, merma: 0, costHistory: [{ date: INITIAL_DATE, costoPaquete: 5 }] },
  { id: 'f4', name: 'Girasoles', price: 5, visible: true, imageUrl: 'https://storage.googleapis.com/gemini-prod-us-west1-assets/images/056bed80-87a7-4767-88d4-f4812328059c.jpeg', costoPaquete: 30, cantidadPorPaquete: 10, merma: 1, costHistory: [{ date: INITIAL_DATE, costoPaquete: 30 }] },
  { id: 'f5', name: 'Lirio', price: 15, visible: true, imageUrl: 'https://storage.googleapis.com/gemini-prod-us-west1-assets/images/6d3e37f6-65e9-467f-94a1-77b3111f1807.jpeg', costoPaquete: 10, cantidadPorPaquete: 1, merma: 0, costHistory: [{ date: INITIAL_DATE, costoPaquete: 10 }] },
  { id: 'f6', name: 'Hortensia Azul', price: 10, visible: true, imageUrl: 'https://storage.googleapis.com/gemini-prod-us-west1-assets/images/60f722e0-53b7-4c07-ae49-a23d9b044d71.jpeg', costoPaquete: 6, cantidadPorPaquete: 1, merma: 0, costHistory: [{ date: INITIAL_DATE, costoPaquete: 6 }] },
  { id: 'f7', name: 'Follaje Pequeño', price: 4, visible: true, imageUrl: 'https://storage.googleapis.com/gemini-prod-us-west1-assets/images/13c7c7f3-4e42-42e1-807e-9769911e8093.jpeg', costoPaquete: 15, cantidadPorPaquete: 10, merma: 2, costHistory: [{ date: INITIAL_DATE, costoPaquete: 15 }] },
  { id: 'f8', name: 'Follaje Mediano', price: 9, visible: true, imageUrl: 'https://storage.googleapis.com/gemini-prod-us-west1-assets/images/5f02275b-0a75-4752-9721-364210e7c53d.jpeg', costoPaquete: 30, cantidadPorPaquete: 10, merma: 2, costHistory: [{ date: INITIAL_DATE, costoPaquete: 30 }] },
  { id: 'f9', name: 'Follaje Grande', price: 14, visible: true, imageUrl: 'https://storage.googleapis.com/gemini-prod-us-west1-assets/images/526715f3-529a-4712-9c4c-3571d7f69485.jpeg', costoPaquete: 50, cantidadPorPaquete: 10, merma: 1, costHistory: [{ date: INITIAL_DATE, costoPaquete: 50 }] },
  { id: 'f10', name: 'Gypsophila (S)', price: 5, visible: true, imageUrl: 'https://storage.googleapis.com/gemini-prod-us-west1-assets/images/5752c0f9-2e06-4448-a0c3-f66741757833.jpeg', costoPaquete: 20, cantidadPorPaquete: 5, merma: 1, costHistory: [{ date: INITIAL_DATE, costoPaquete: 20 }] },
  { id: 'f11', name: 'Gypsophila (M)', price: 15, visible: true, imageUrl: 'https://storage.googleapis.com/gemini-prod-us-west1-assets/images/5752c0f9-2e06-4448-a0c3-f66741757833.jpeg', costoPaquete: 40, cantidadPorPaquete: 5, merma: 1, costHistory: [{ date: INITIAL_DATE, costoPaquete: 40 }] },
  { id: 'f12', name: 'Gypsophila (L)', price: 20, visible: true, imageUrl: 'https://storage.googleapis.com/gemini-prod-us-west1-assets/images/5752c0f9-2e06-4448-a0c3-f66741757833.jpeg', costoPaquete: 60, cantidadPorPaquete: 5, merma: 0, costHistory: [{ date: INITIAL_DATE, costoPaquete: 60 }] },
];

const DEFAULT_FIXED_ITEMS = [
  { id: 't1', name: 'Box', price: 20, visible: true, imageUrl: 'https://storage.googleapis.com/gemini-prod-us-west1-assets/images/a4143a14-a90f-4fa1-85b6-7933b9340578.jpeg', costo: 10, costHistory: [{ date: INITIAL_DATE, costo: 10 }] },
  { id: 't2', name: 'Ramo Coreano', price: 10, visible: true, imageUrl: 'https://storage.googleapis.com/gemini-prod-us-west1-assets/images/4523cf10-1845-42f8-958a-a63e26df3229.jpeg', costo: 4, costHistory: [{ date: INITIAL_DATE, costo: 4 }] },
  { id: 't3', name: 'Ramo Simple', price: 5, visible: true, imageUrl: 'https://storage.googleapis.com/gemini-prod-us-west1-assets/images/2237d454-9443-4151-a120-72c019d08e9e.jpeg', costo: 2, costHistory: [{ date: INITIAL_DATE, costo: 2 }] },
];

module.exports = {
    DEFAULT_FLOWER_ITEMS,
    DEFAULT_FIXED_ITEMS,
};
