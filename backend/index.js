
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const bcrypt = require('bcrypt');
const { DEFAULT_FLOWER_ITEMS, DEFAULT_FIXED_ITEMS } = require('./constants');


const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const uri = process.env.DATABASE_URL;
const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');

if (!uri) {
  throw new Error('La variable de entorno DATABASE_URL no está definida.');
}

const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});
let db;

// --- Helper Functions ---
const seedInitialDataForUser = async (userId) => {
    const flowerCollection = db.collection('flowers');
    const fixedCollection = db.collection('fixed_items');

    const userFlowers = DEFAULT_FLOWER_ITEMS.map(item => ({...item, userId}));
    const userFixedItems = DEFAULT_FIXED_ITEMS.map(item => ({...item, userId}));

    await flowerCollection.insertMany(userFlowers);
    await fixedCollection.insertMany(userFixedItems);
    console.log(`Datos iniciales sembrados para el usuario ${userId}`);
};


// --- API Endpoints ---
app.get('/', (req, res) => {
  res.send('¡El backend de Vitora ERP está funcionando con MongoDB y autenticación!');
});

// --- Auth Endpoint ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
    }

    try {
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
        
        if (!user) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
        }

        const match = await bcrypt.compare(password, user.password);

        if (match) {
            // Check if user has data, if not, seed it.
            const flowerCount = await db.collection('flowers').countDocuments({ userId: user._id.toString() });
            if (flowerCount === 0) {
                await seedInitialDataForUser(user._id.toString());
            }

            res.json({ _id: user._id, username: user.username, role: user.role });
        } else {
            res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
        }
    } catch (err) {
        console.error('Error en el login:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});


// --- Data Endpoints (Multi-user) ---
const createDataEndpoints = (appName, collectionName) => {
    app.get(`/api/${appName}`, async (req, res) => {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: 'userId es requerido.' });
        try {
            const items = await db.collection(collectionName).find({ userId }).toArray();
            items.sort((a, b) => (parseInt(a.id.substring(1), 10) - parseInt(b.id.substring(1), 10)));
            res.json(items);
        } catch (err) {
            console.error(`Error al obtener ${appName}:`, err);
            res.status(500).json({ error: 'Error interno del servidor.' });
        }
    });

    app.put(`/api/${appName}`, async (req, res) => {
        const { items, userId } = req.body;
        if (!Array.isArray(items) || !userId) {
            return res.status(400).json({ error: 'Se esperaba un array de items y un userId.' });
        }

        const session = client.startSession();
        try {
            await session.withTransaction(async () => {
                const collection = db.collection(collectionName);
                await collection.deleteMany({ userId }, { session });
                if (items.length > 0) {
                    const itemsWithUserId = items.map(item => ({ ...item, userId }));
                    await collection.insertMany(itemsWithUserId, { session });
                }
            });
            res.status(200).json(items);
        } catch (err) {
            console.error(`Error al actualizar ${appName}:`, err);
            res.status(500).json({ error: 'Error interno del servidor al actualizar.' });
        } finally {
            await session.endSession();
        }
    });
};

createDataEndpoints('flowers', 'flowers');
createDataEndpoints('fixed-items', 'fixed_items');


// --- Server Start ---
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await client.connect();
    console.log("Conectado exitosamente a MongoDB.");
    db = client.db("vitoraDB"); 
    
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en el puerto ${PORT}`);
    });
  } catch (err) {
    console.error("No se pudo conectar a MongoDB. Saliendo...", err);
    process.exit(1);
  }
};

startServer();
