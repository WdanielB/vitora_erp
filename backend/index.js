
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
    // ... (Seeding logic remains the same)
    const collections = {
        flowers: db.collection('flowers'),
        fixed_items: db.collection('fixed_items'),
        stock: db.collection('stock'),
        events: db.collection('events'),
        fixed_expenses: db.collection('fixed_expenses'),
    };
    const userFlowers = DEFAULT_FLOWER_ITEMS.map(item => ({...item, userId}));
    const userFixedItems = DEFAULT_FIXED_ITEMS.map(item => ({...item, userId}));
    await collections.flowers.insertMany(userFlowers);
    await collections.fixed_items.insertMany(userFixedItems);
    const allItems = [...userFlowers, ...userFixedItems];
    const initialStock = allItems.map(item => ({
        itemId: item.id,
        userId,
        name: item.name,
        type: item.id.startsWith('f') ? 'flower' : 'fixed',
        quantity: 0,
        criticalStock: item.id.startsWith('f') ? (item.cantidadPorPaquete || 10) * 2 : 10,
    }));
    if (initialStock.length > 0) {
        await collections.stock.insertMany(initialStock);
    }
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
            const { password, ...userWithoutPassword } = user;
            res.json({ ...userWithoutPassword, _id: userIdString });
        } else {
            res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
        }
    } catch (err) {
        console.error('Error en el login:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});


// --- Data Endpoints (Role-Based Access Control) ---
const createDataEndpoints = (endpointName, collectionName) => {
    app.get(`/api/${endpointName}`, async (req, res) => {
        const { userId, role, selectedUserId } = req.query;
        if (!userId) return res.status(400).json({ error: 'userId es requerido.' });
        
        try {
            let query = { userId };
            if (role === 'admin') {
                if (selectedUserId && selectedUserId !== 'all') {
                    query = { userId: selectedUserId };
                } else {
                    query = {}; // Admin seeing all users
                }
            }
            const items = await db.collection(collectionName).find(query).toArray();
            res.json(items);
        } catch (err) {
            console.error(`Error al obtener ${endpointName}:`, err);
            res.status(500).json({ error: 'Error interno del servidor.' });
        }
    });

    app.put(`/api/${endpointName}`, async (req, res) => {
        // ... (PUT logic remains the same)
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
                    const itemsToInsert = items.map(({ _id, ...item }) => ({ ...item, userId }));
                    await collection.insertMany(itemsToInsert, { session });
                }
            });
            const updatedItems = await db.collection(collectionName).find({ userId }).toArray();
            res.status(200).json(updatedItems);
        } catch (err) {
            console.error(`Error al actualizar ${endpointName}:`, err);
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
createDataEndpoints('clients', 'clients');
createDataEndpoints('events', 'events');
createDataEndpoints('fixed-expenses', 'fixed_expenses');

// --- Custom Endpoints ---

// User management for admin
app.get('/api/users', async (req, res) => {
    const { userId, role } = req.query;
    if (role !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado.' });
    }
    try {
        const users = await db.collection('users').find({}, { projection: { password: 0 } }).toArray();
        res.json(users);
    } catch(err) {
        res.status(500).json({ error: 'Error al obtener usuarios.' });
    }
});

app.post('/api/users/pins', async (req, res) => {
    const { userId, pins } = req.body;
    if (!userId || !pins) {
        return res.status(400).json({ error: 'userId y pins son requeridos.' });
    }
    try {
        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: { modulePins: pins } }
        );
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar los PINs.' });
    }
});


// Client management
app.post('/api/clients', async (req, res) => {
    // ... (logic remains same)
    const clientData = req.body;
    if (!clientData || !clientData.userId || !clientData.name) {
        return res.status(400).json({ error: 'Datos de cliente incompletos.' });
    }
    try {
        const clientsCollection = db.collection('clients');
        const result = await clientsCollection.insertOne(clientData);
        const newClient = { ...clientData, _id: result.insertedId };
        res.status(201).json(newClient);
    } catch (err) {
        console.error('Error al crear cliente:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// Stock management with history
app.post('/api/stock/update-batch', async (req, res) => {
    const { updates } = req.body; // updates is an array of { itemId, change, userId, type, movementType }
    if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ error: 'Se requiere un array de actualizaciones.' });
    }

    const session = client.startSession();
    try {
        await session.withTransaction(async () => {
            const stockCollection = db.collection('stock');
            const movementsCollection = db.collection('stock_movements');

            for (const update of updates) {
                const { itemId, change, userId, movementType } = update;
                const stockItem = await stockCollection.findOne({ itemId, userId }, { session });
                
                if (!stockItem) throw new Error(`Stock item ${itemId} no encontrado para el usuario ${userId}`);

                const quantityAfter = stockItem.quantity + change;

                await stockCollection.updateOne(
                    { _id: stockItem._id },
                    { $set: { quantity: quantityAfter } },
                    { session }
                );

                const movement = {
                    userId,
                    itemId,
                    itemName: stockItem.name,
                    type: movementType,
                    quantityChange: change,
                    quantityAfter,
                    createdAt: new Date().toISOString(),
                };
                await movementsCollection.insertOne(movement, { session });
            }
        });
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error en la actualización de stock por lote:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        await session.endSession();
    }
});

app.get('/api/stock/history/:itemId', async (req, res) => {
    const { itemId } = req.params;
    const { userId, role, selectedUserId } = req.query;

    try {
        let queryUserId = userId;
        if (role === 'admin' && selectedUserId && selectedUserId !== 'all') {
            queryUserId = selectedUserId;
        }

        const history = await db.collection('stock_movements')
            .find({ itemId, userId: queryUserId })
            .sort({ createdAt: -1 })
            .toArray();
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener historial de stock.' });
    }
});


// Order creation with history
app.post('/api/orders', async (req, res) => {
    // ... updated logic
    const orderData = req.body;
    if (!orderData || !orderData.userId) {
        return res.status(400).json({ error: 'Datos de pedido y userId son requeridos.' });
    }
    const session = client.startSession();
    try {
        let createdOrder;
        await session.withTransaction(async () => {
            const ordersCollection = db.collection('orders');
            const result = await ordersCollection.insertOne({ ...orderData, createdAt: new Date().toISOString() }, { session });
            const orderId = result.insertedId;
            createdOrder = { ...orderData, _id: orderId, createdAt: new Date().toISOString() };

            const stockCollection = db.collection('stock');
            const movementsCollection = db.collection('stock_movements');

            for (const item of orderData.items) {
                if (item.itemId) { // Only for catalog items
                    const stockItem = await stockCollection.findOne({ itemId: item.itemId, userId: orderData.userId }, { session });
                    if (stockItem) {
                         const quantityAfter = stockItem.quantity - item.quantity;
                         await stockCollection.updateOne(
                            { _id: stockItem._id },
                            { $set: { quantity: quantityAfter } },
                            { session }
                        );

                        await movementsCollection.insertOne({
                            userId: orderData.userId,
                            itemId: item.itemId,
                            itemName: stockItem.name,
                            type: 'venta',
                            quantityChange: -item.quantity,
                            quantityAfter,
                            relatedOrderId: orderId.toString(),
                            createdAt: new Date().toISOString(),
                        }, { session });
                    }
                }
            }
        });
        res.status(201).json(createdOrder);
    } catch (err)
        {
        console.error('Error al crear el pedido:', err);
        res.status(500).json({ error: 'Error interno del servidor al crear el pedido.' });
    } finally {
        await session.endSession();
    }
});

// Financial summary with admin view
app.get('/api/finance/summary', async (req, res) => {
    const { userId, role, selectedUserId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId es requerido.' });

    try {
        let matchQuery = { userId };
        let groupKey = "$userId";

        if (role === 'admin') {
            if (selectedUserId && selectedUserId !== 'all') {
                matchQuery = { userId: selectedUserId };
            } else {
                matchQuery = {}; // Admin seeing all users
                groupKey = "admin_total";
            }
        }
        
        // ... (aggregation logic is the same)
        const ordersCollection = db.collection('orders');
        const orderSummary = await ordersCollection.aggregate([
            { $match: matchQuery },
            { $unwind: "$items" },
            {
                $group: {
                    _id: groupKey,
                    totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
                    totalCostOfGoods: { $sum: { $multiply: ["$items.quantity", "$items.unitCost"] } },
                }
            }
        ]).toArray();

        const expensesCollection = db.collection('fixed_expenses');
        const expenseSummary = await expensesCollection.aggregate([
             { $match: matchQuery },
             {
                $group: {
                    _id: groupKey,
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