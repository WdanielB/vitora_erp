require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Aumentar el límite para el payload

// La cadena de conexión debe estar en tu archivo .env o en las variables de entorno de Render
const uri = process.env.DATABASE_URL;
if (!uri) {
  throw new Error('La variable de entorno DATABASE_URL no está definida.');
}

// Crear un cliente de MongoDB con las opciones recomendadas
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
let db;

// Endpoint de prueba
app.get('/', (req, res) => {
  res.send('¡El backend de Vitora ERP está funcionando con MongoDB!');
});

// --- API Endpoints para Flores ---
app.get('/api/flowers', async (req, res) => {
  try {
    const flowers = await db.collection('flowers').find({}).toArray();
    // Replicar el orden de la base de datos anterior
    flowers.sort((a, b) => {
        const numA = parseInt(a.id.substring(1), 10);
        const numB = parseInt(b.id.substring(1), 10);
        return numA - numB;
    });
    res.json(flowers);
  } catch (err) {
    console.error('Error al obtener flores:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.put('/api/flowers', async (req, res) => {
    const items = req.body;
    if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Se esperaba un array de items.' });
    }

    const session = client.startSession();
    try {
        await session.withTransaction(async () => {
            const collection = db.collection('flowers');
            // Borrar todos los documentos existentes
            await collection.deleteMany({}, { session });
            // Insertar los nuevos si la lista no está vacía
            if (items.length > 0) {
                await collection.insertMany(items, { session });
            }
        });
        res.status(200).json(items);
    } catch (err) {
        console.error('Error al actualizar flores:', err);
        res.status(500).json({ error: 'Error interno del servidor al actualizar.' });
    } finally {
        await session.endSession();
    }
});


// --- API Endpoints para Items Fijos ---
app.get('/api/fixed-items', async (req, res) => {
  try {
    const fixedItems = await db.collection('fixed_items').find({}).toArray();
    // Replicar el orden de la base de datos anterior
    fixedItems.sort((a, b) => {
        const numA = parseInt(a.id.substring(1), 10);
        const numB = parseInt(b.id.substring(1), 10);
        return numA - numB;
    });
    res.json(fixedItems);
  } catch (err) {
    console.error('Error al obtener items fijos:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.put('/api/fixed-items', async (req, res) => {
    const items = req.body;
    if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Se esperaba un array de items.' });
    }

    const session = client.startSession();
    try {
        await session.withTransaction(async () => {
            const collection = db.collection('fixed_items');
            await collection.deleteMany({}, { session });
            if (items.length > 0) {
                await collection.insertMany(items, { session });
            }
        });
        res.status(200).json(items);
    } catch (err) {
        console.error('Error al actualizar items fijos:', err);
        res.status(500).json({ error: 'Error interno del servidor al actualizar.' });
    } finally {
        await session.endSession();
    }
});


const PORT = process.env.PORT || 3001;

// Función para iniciar el servidor
const startServer = async () => {
  try {
    // Conectar a MongoDB
    await client.connect();
    console.log("Conectado exitosamente a MongoDB.");
    // Seleccionar la base de datos. Si no existe, se creará al insertar datos.
    db = client.db("vitoraDB"); 
    
    // Iniciar el servidor Express
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en el puerto ${PORT}`);
    });
  } catch (err) {
    console.error("No se pudo conectar a MongoDB. Saliendo...", err);
    process.exit(1);
  }
};

// Iniciar la aplicación
startServer();