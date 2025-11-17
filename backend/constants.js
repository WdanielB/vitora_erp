
const INITIAL_DATE = new Date('2023-10-27T10:00:00Z').toISOString();

const DEFAULT_FLOWER_ITEMS = [
    {
      "id": "f1", "name": "Rosas", "price": 5, "visible": true,
      "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS-T_CP7Hf0TZxXTMB0E8WvjXujLw5fBu4kEd1APtczhsXjnXLjAPduk0o&s=10",
      "costoPaquete": 40, "cantidadPorPaquete": 24, "merma": 2,
      "costHistory": [{ "date": "2023-10-27T10:00:00.000Z", "costoPaquete": 40 }]
    },
    {
      "id": "f7", "name": "Follaje Pequeño", "price": 4, "visible": true,
      "imageUrl": "https://storage.googleapis.com/gemini-prod-us-west1-assets/images/13c7c7f3-4e42-42e1-807e-9769911e8093.jpeg",
      "costoPaquete": 2, "cantidadPorPaquete": 1, "merma": 0,
      "costHistory": [{ "date": "2023-10-27T10:00:00.000Z", "costoPaquete": 15 }]
    },
    {
      "id": "f2", "name": "Tulipanes", "price": 18, "visible": true,
      "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRRJFewwZu9SSn3D-AXzW_zhsWw9ChCMMBy97Pop5xUsA&s=10",
      "costoPaquete": 90, "cantidadPorPaquete": 10, "merma": 1,
      "costHistory": [{ "date": "2023-10-27T10:00:00.000Z", "costoPaquete": 90 }]
    },
    {
      "id": "f13", "name": "Margarita", "price": 5, "visible": true, "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRzL4sYFFl7JzY2IIwY-aVbXkXqRA0wSg-5vQ&s",
      "costoPaquete": 30, "cantidadPorPaquete": 8, "merma": 0,
      "costHistory": [{ "date": "2025-10-28T20:50:05.873Z", "costoPaquete": 30 }]
    },
    {
      "id": "f14", "name": "Astromelia", "price": 2, "visible": true,
      "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_6Cd_4oSyz0kxhTFJhSsND0jHq_YELcTW4AVQ-0XKOA&s=10",
      "costoPaquete": 9, "cantidadPorPaquete": 10, "merma": 1,
      "costHistory": [{ "date": "2025-10-28T20:51:38.527Z", "costoPaquete": 9 }]
    },
    {
      "id": "f15", "name": "Gerbera", "price": 7, "visible": true,
      "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQe6C7QKUCLKAvIXHZg-zvNrr3zyEx1IMuHZq1g5A7eAg&s=10",
      "costoPaquete": 35, "cantidadPorPaquete": 10, "merma": 1,
      "costHistory": [{ "date": "2025-10-28T02:09:22.200Z", "costoPaquete": 35 }]
    },
    {
      "id": "f3", "name": "Hortensia", "price": 9, "visible": true,
      "imageUrl": "https://www.viveroelencanto.com/wp-content/uploads/2023/06/106-HORTENCIA-BOLSA.jpg",
      "costoPaquete": 12, "cantidadPorPaquete": 6, "merma": 1,
      "costHistory": [{ "date": "2023-10-27T10:00:00.000Z", "costoPaquete": 5 }]
    },
    {
      "id": "f6", "name": "Hortensia Azul", "price": 10, "visible": true,
      "imageUrl": "https://storage.googleapis.com/gemini-prod-us-west1-assets/images/60f722e0-53b7-4c07-ae49-a23d9b044d71.jpeg",
      "costoPaquete": 5, "cantidadPorPaquete": 1, "merma": 0,
      "costHistory": [{ "date": "2023-10-27T10:00:00.000Z", "costoPaquete": 6 }]
    },
    {
      "id": "f10", "name": "Gypsophila (S)", "price": 5, "visible": true,
      "imageUrl": "https://storage.googleapis.com/gemini-prod-us-west1-assets/images/5752c0f9-2e06-4448-a0c3-f66741757833.jpeg",
      "costoPaquete": 2, "cantidadPorPaquete": 1, "merma": 0,
      "costHistory": [{ "date": "2023-10-27T10:00:00.000Z", "costoPaquete": 20 }]
    },
    {
      "id": "f8", "name": "Follaje Mediano", "price": 9, "visible": true,
      "imageUrl": "https://storage.googleapis.com/gemini-prod-us-west1-assets/images/5f02275b-0a75-4752-9721-364210e7c53d.jpeg",
      "costoPaquete": 5, "cantidadPorPaquete": 1, "merma": 0,
      "costHistory": [{ "date": "2023-10-27T10:00:00.000Z", "costoPaquete": 30 }]
    },
    {
      "id": "f4", "name": "Girasoles", "price": 5, "visible": true,
      "imageUrl": "https://storage.googleapis.com/gemini-prod-us-west1-assets/images/056bed80-87a7-4767-88d4-f4812328059c.jpeg",
      "costoPaquete": 20, "cantidadPorPaquete": 12, "merma": 1,
      "costHistory": [{ "date": "2023-10-27T10:00:00.000Z", "costoPaquete": 30 }]
    },
    {
      "id": "f11", "name": "Gypsophila (M)", "price": 15, "visible": true,
      "imageUrl": "https://storage.googleapis.com/gemini-prod-us-west1-assets/images/5752c0f9-2e06-4448-a0c3-f66741757833.jpeg",
      "costoPaquete": 7, "cantidadPorPaquete": 1, "merma": 0,
      "costHistory": [{ "date": "2023-10-27T10:00:00.000Z", "costoPaquete": 40 }]
    },
    {
      "id": "f9", "name": "Follaje Grande", "price": 14, "visible": true,
      "imageUrl": "https://storage.googleapis.com/gemini-prod-us-west1-assets/images/526715f3-529a-4712-9c4c-3571d7f69485.jpeg",
      "costoPaquete": 8, "cantidadPorPaquete": 1, "merma": 0,
      "costHistory": [{ "date": "2023-10-27T10:00:00.000Z", "costoPaquete": 50 }]
    },
    {
      "id": "f5", "name": "Lirio", "price": 15, "visible": true,
      "imageUrl": "https://storage.googleapis.com/gemini-prod-us-west1-assets/images/6d3e37f6-65e9-467f-94a1-77b3111f1807.jpeg",
      "costoPaquete": 10, "cantidadPorPaquete": 1, "merma": 0,
      "costHistory": [{ "date": "2023-10-27T10:00:00.000Z", "costoPaquete": 10 }]
    },
    {
      "id": "f12", "name": "Gypsophila (L)",
      "price": 30, "visible": true,
      "imageUrl": "https://storage.googleapis.com/gemini-prod-us-west1-assets/images/5752c0f9-2e06-4448-a0c3-f66741757833.jpeg",
      "costoPaquete": 15, "cantidadPorPaquete": 1, "merma": 0,
      "costHistory": [{ "date": "2023-10-27T10:00:00.000Z", "costoPaquete": 60 }]
    },
    {
      "id": "f16", "name": "Clavel", "price": 3, "visible": true,
      "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRzL4sYFFl7JzY2IIwY-aVbXkXqRA0wSg-5vQ&s",
      "costoPaquete": 13, "cantidadPorPaquete": 24, "merma": 5,
      "costHistory": [{ "date": "2025-10-28T20:57:50.599Z", "costoPaquete": 13 }]
    },
    {
      "id": "f17", "name": "Lisianthus", "price": 7, "visible": true,
      "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR5wDA3Jb8sQ_9sZ7p5wY9x2X3c7v8n9f0fGg&s",
      "costoPaquete": 40, "cantidadPorPaquete": 12, "merma": 1,
      "costHistory": [{ "date": "2025-10-28T22:24:01.851Z", "costoPaquete": 40 }]
    }
];

const DEFAULT_FIXED_ITEMS = [
    {
      "id": "t1", "name": "Box", "price": 20, "visible": true,
      "imageUrl": "https://magia.pe/cdn/shop/files/magia-diadelamadre-2.png?v=1713231274",
      "costo": 10, "costHistory": [{ "date": "2023-10-27T10:00:00.000Z", "costo": 10 }]
    },
    {
      "id": "t2", "name": "Ramo Coreano", "price": 10, "visible": true,
      "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRqI_cbXsL6cMxTQBNwelQ7QO6UV3gzG4Y03xR62-2eEnqqu1sIN0xEW2s&s=10",
      "costo": 4, "costHistory": [{ "date": "2023-10-27T10:00:00.000Z", "costo": 4 }]
    },
    {
      "id": "t3", "name": "Ramo Simple", "price": 5, "visible": true,
      "imageUrl": "https://rosatelpe.vtexassets.com/arquivos/ids/158793-1200-1200?v=638845535133070000&width=1200&height=1200&aspect=true",
      "costo": 2, "costHistory": [{ "date": "2023-10-27T10:00:00.000Z", "costo": 2 }]
    }
];

module.exports = {
    DEFAULT_FLOWER_ITEMS,
    DEFAULT_FIXED_ITEMS,
};
