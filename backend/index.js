
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const collections = {
        flowers: db.collection('flowers'),
        fixed_items: db.collection('fixed_items'),
        stock: db.collection('stock'),
        events: db.collection('events'),
        fixed_expenses: db.collection('fixed_expenses'),
    };

    // Seed products
    const userFlowers = DEFAULT_FLOWER_ITEMS.map(item => ({...item, userId}));
    const userFixedItems = DEFAULT_FIXED_ITEMS.map(item => ({...item, userId}));
    await collections.flowers.insertMany(userFlowers);
    await collections.fixed_items.insertMany(userFixedItems);

    // Seed initial stock
    const allItems = [...userFlowers, ...userFixedItems];
    const initialStock = allItems.map(item => ({
        itemId: item.id,
        userId,
        name: item.name,
        type: item.id.startsWith('f') ? 'flower' : 'fixed',
        quantity: 0, // Start with 0 stock
        criticalStock: item.id.startsWith('f') ? (item.cantidadPorPaquete || 10) * 2 : 10,
    }));
    if (initialStock.length > 0) {
        await collections.stock.insertMany(initialStock);
    }
    
    // Seed initial events and expenses (placeholders)
    const initialEvents = [
        { name: "Día de San Valentín", date: "2025-02-14T05:00:00.000Z", userId },
        { name: "Día de la Madre", date: "2025-05-11T05:00:00.000Z", userId },
    ];
    await collections.events.insertMany(initialEvents);

    const initialExpenses = [
      { name: "Alquiler Taller", amount: 800, userId },
      { name: "Servicios (Luz, Agua)", amount: 250, userId },
    ];
    await collections.fixed_expenses.insertMany(initialExpenses);

    console.log(`Datos iniciales sembrados para el usuario ${userId}`);
};


// --- API Endpoints ---
app.get('/', (req, res) => {
  res.send('AD ERP ESTA ON LAI (stá funcionando con MongoDB y autenticación!)');
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
            const userIdString = user._id.toString();
            const flowerCount = await db.collection('flowers').countDocuments({ userId: userIdString });
            if (flowerCount === 0) {
                await seedInitialDataForUser(userIdString);
            }

            res.json({ _id: userIdString, username: user.username, role: user.role });
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
            if (appName === 'flowers' || appName === 'fixed-items') {
                 items.sort((a, b) => (parseInt(a.id.substring(1), 10) - parseInt(b.id.substring(1), 10)));
            }
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
                    // Remove _id from items to avoid duplicate key error on re-insertion
                    const itemsToInsert = items.map(({ _id, ...item }) => ({ ...item, userId }));
                    await collection.insertMany(itemsToInsert, { session });
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
createDataEndpoints('stock', 'stock');
createDataEndpoints('orders', 'orders');
createDataEndpoints('events', 'events');
createDataEndpoints('fixed-expenses', 'fixed_expenses');


// --- Custom Endpoints ---

app.post('/api/stock/update', async (req, res) => {
    const { itemId, change, userId } = req.body;
    if (!itemId || change === undefined || !userId) {
        return res.status(400).json({ error: 'itemId, change y userId son requeridos.' });
    }
    try {
        const stockCollection = db.collection('stock');
        const result = await stockCollection.findOneAndUpdate(
            { itemId, userId },
            { $inc: { quantity: Number(change) } },
            { returnDocument: 'after', upsert: true }
        );
        res.status(200).json(result.value);
    } catch (err) {
        console.error('Error al actualizar stock:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

app.post('/api/orders', async (req, res) => {
    const orderData = req.body;
    if (!orderData || !orderData.userId) {
        return res.status(400).json({ error: 'Datos de pedido y userId son requeridos.' });
    }
    const session = client.startSession();
    try {
        let createdOrder;
        await session.withTransaction(async () => {
            // 1. Insert the order
            const ordersCollection = db.collection('orders');
            const result = await ordersCollection.insertOne({ ...orderData, createdAt: new Date().toISOString() }, { session });
            createdOrder = { ...orderData, _id: result.insertedId, createdAt: new Date().toISOString() };

            // 2. Decrement stock
            const stockCollection = db.collection('stock');
            const stockUpdates = orderData.items.map(item => {
                return stockCollection.updateOne(
                    { itemId: item.itemId, userId: orderData.userId },
                    { $inc: { quantity: -item.quantity } },
                    { session }
                );
            });
            await Promise.all(stockUpdates);
        });
        res.status(201).json(createdOrder);
    } catch (err) {
        console.error('Error al crear el pedido:', err);
        res.status(500).json({ error: 'Error interno del servidor al crear el pedido.' });
    } finally {
        await session.endSession();
    }
});

app.get('/api/finance/summary', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId es requerido.' });

    try {
        // 1. Calculate total revenue and COGS from orders
        const ordersCollection = db.collection('orders');
        const orderSummary = await ordersCollection.aggregate([
            { $match: { userId } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$userId",
                    totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
                    totalCostOfGoods: { $sum: { $multiply: ["$items.quantity", "$items.unitCost"] } },
                }
            }
        ]).toArray();

        // 2. Calculate total fixed expenses
        const expensesCollection = db.collection('fixed_expenses');
        const expenseSummary = await expensesCollection.aggregate([
             { $match: { userId } },
             {
                $group: {
                    _id: "$userId",
                    totalExpenses: { $sum: "$amount" }
                }
             }
        ]).toArray();

        const revenue = orderSummary[0]?.totalRevenue || 0;
        const cogs = orderSummary[0]?.totalCostOfGoods || 0;
        const fixedExpenses = expenseSummary[0]?.totalExpenses || 0;
        const netProfit = revenue - cogs - fixedExpenses;

        res.json({
            totalRevenue: revenue,
            totalCostOfGoods: cogs,
            wastedGoodsCost: 0, // Placeholder
            fixedExpenses: fixedExpenses,
            netProfit: netProfit,
        });

    } catch (err) {
        console.error('Error al calcular el resumen financiero:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});


// --- Server Start ---
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await client.connect();
    console.log("Conectado exitosamente a MongoDB.");
    const dbName = process.env.MONGO_DB_NAME || "vitoraDB"; 
    db = client.db(dbName);
    console.log(`Usando la base de datos: ${dbName}`);
    
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en el puerto ${PORT}`);
    });
  } catch (err) {
    console.error("No se pudo conectar a MongoDB. Saliendo...", err);
    process.exit(1);
  }
};

startServer();
