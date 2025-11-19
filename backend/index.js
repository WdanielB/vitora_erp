
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const { DEFAULT_FLOWER_ITEMS, DEFAULT_PRODUCTS, DEFAULT_VARIATION_GIFTS } = require('./constants');

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
        products: db.collection('products'),
        variation_gifts: db.collection('variation_gifts'),
        stock: db.collection('stock'),
        events: db.collection('events'),
        fixed_expenses: db.collection('fixed_expenses'),
        record_price: db.collection('record_price'), // Historial de costos
    };

    const userFlowers = DEFAULT_FLOWER_ITEMS.map(item => ({...item, userId}));
    const userProducts = DEFAULT_PRODUCTS.map(item => ({...item, userId}));
    const userGifts = DEFAULT_VARIATION_GIFTS.map(item => ({...item, userId}));

    await collections.flowers.insertMany(userFlowers);
    await collections.products.insertMany(userProducts);
    await collections.variation_gifts.insertMany(userGifts);

    // Seed Stock (Only Flowers and Products have stock, Gifts are "service/base")
    const initialStock = [
        ...userFlowers.map(item => ({
            itemId: item.id, userId, name: item.name, type: 'flower', quantity: 0, criticalStock: (item.cantidadPorPaquete || 10) * 2
        })),
        ...userProducts.map(item => ({
            itemId: item.id, userId, name: item.name, type: 'product', quantity: item.stock || 0, criticalStock: 5
        }))
    ];

    if (initialStock.length > 0) {
        await collections.stock.insertMany(initialStock);
    }

    // Seed Record Price (Initial Costs)
    const initialPrices = [
        ...userFlowers.map(item => ({
             userId, itemId: item.id, itemName: item.name, type: 'flower', price: item.costoPaquete, date: new Date().toISOString()
        })),
        ...userProducts.map(item => ({
             userId, itemId: item.id, itemName: item.name, type: 'product', price: item.costo, date: new Date().toISOString()
        })),
        ...userGifts.map(item => ({
             userId, itemId: item.id, itemName: item.name, type: 'gift', price: item.costo, date: new Date().toISOString()
        }))
    ];
    await collections.record_price.insertMany(initialPrices);


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

const ensureInitialUsers = async () => {
    try {
        const usersCollection = db.collection('users');
        
        const adminUser = await usersCollection.findOne({ username: 'admin' });
        if (!adminUser) {
            console.log("Creando Super Usuario admin...");
            const hashedPassword = await bcrypt.hash('admin123', saltRounds);
            await usersCollection.insertOne({
                username: 'admin',
                password: hashedPassword,
                role: 'admin',
                modulePins: { finance: '1234', settings: '1234' },
                createdAt: new Date()
            });
        }

        const demoUser = await usersCollection.findOne({ username: 'floreria1' });
        if (!demoUser) {
            console.log("Creando Usuario Empleado de prueba (floreria1)...");
            const hashedPassword = await bcrypt.hash('user123', saltRounds);
            const result = await usersCollection.insertOne({
                username: 'floreria1',
                password: hashedPassword,
                role: 'user',
                createdAt: new Date()
            });
            await seedInitialDataForUser(result.insertedId.toString());
        }

    } catch (error) {
        console.error("Error asegurando usuarios iniciales:", error);
    }
};


// --- API Endpoints ---
app.get('/', (req, res) => { res.send('AD ERP ONLINE'); });
app.get('/api/health', async (req, res) => {
    try { await db.command({ ping: 1 }); res.json({ status: 'ok', message: 'Conexión exitosa a MongoDB' }); } 
    catch (error) { res.status(500).json({ status: 'error', message: 'No se pudo conectar a la base de datos', error: error.message }); }
});

// --- Auth Endpoint ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos.' });
    try {
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
        if (!user) return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
        
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            const userIdString = user._id.toString();
            if (user.role !== 'admin') {
                 const flowerCount = await db.collection('flowers').countDocuments({ userId: userIdString });
                 if (flowerCount === 0) await seedInitialDataForUser(userIdString);
            }
            const { password, ...userWithoutPassword } = user;
            res.json({ ...userWithoutPassword, _id: userIdString });
        } else {
            res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
        }
    } catch (err) { res.status(500).json({ error: 'Error interno del servidor.' }); }
});

// --- Item CRUD with Stock Integration ---
const createItemEndpoints = (collectionName, itemType) => {
    // GET
    app.get(`/api/${collectionName}`, async (req, res) => {
        const { userId, role, selectedUserId } = req.query;
        if (!userId) return res.status(400).json({ error: 'userId requerido.' });
        try {
            let query = { userId };
            if (role === 'admin' && selectedUserId && selectedUserId !== 'all') query = { userId: selectedUserId };
            const items = await db.collection(collectionName).find(query).toArray();
            res.json(items);
        } catch (err) { res.status(500).json({ error: 'Error.' }); }
    });

    // POST (Create new Item + Create Stock Entry)
    app.post(`/api/${collectionName}`, async (req, res) => {
        const itemData = req.body;
        if (!itemData.userId) return res.status(400).json({ error: 'userId requerido.' });
        
        // Ensure custom ID if not present
        if (!itemData.id) itemData.id = `${itemType[0]}_${Date.now()}`;

        const session = client.startSession();
        try {
            let createdItem;
            await session.withTransaction(async () => {
                const result = await db.collection(collectionName).insertOne(itemData, { session });
                createdItem = { ...itemData, _id: result.insertedId };

                // Auto-create stock entry
                await db.collection('stock').insertOne({
                    itemId: itemData.id,
                    userId: itemData.userId,
                    name: itemData.name,
                    type: itemType,
                    quantity: 0,
                    criticalStock: 10
                }, { session });
            });
            res.status(201).json(createdItem);
        } catch (err) { res.status(500).json({ error: 'Error al crear item.' }); } finally { await session.endSession(); }
    });

    // PUT (Update Item)
    app.put(`/api/${collectionName}/:id`, async (req, res) => {
        const { id } = req.params; // Mongo _id
        const itemData = req.body;
        delete itemData._id; // Prevent updating _id
        try {
            await db.collection(collectionName).updateOne({ _id: new ObjectId(id) }, { $set: itemData });
            
            // Update name in stock if changed
            if (itemData.name || itemData.id) {
                await db.collection('stock').updateOne(
                    { itemId: itemData.id, userId: itemData.userId },
                    { $set: { name: itemData.name } }
                );
            }
            res.json({ success: true });
        } catch (err) { res.status(500).json({ error: 'Error al actualizar.' }); }
    });

    // DELETE (Delete Item)
    app.delete(`/api/${collectionName}/:id`, async (req, res) => {
        const { id } = req.params;
        try {
            const item = await db.collection(collectionName).findOne({ _id: new ObjectId(id) });
            if (item) {
                await db.collection(collectionName).deleteOne({ _id: new ObjectId(id) });
                // Cleanup stock entry
                await db.collection('stock').deleteOne({ itemId: item.id, userId: item.userId });
            }
            res.json({ success: true });
        } catch (err) { res.status(500).json({ error: 'Error al eliminar.' }); }
    });
};

createItemEndpoints('flowers', 'flower');
createItemEndpoints('products', 'product'); 

// --- Generic Endpoints Creator (Read-Only or Batch specific) ---
const createDataEndpoints = (endpointName, collectionName) => {
    app.get(`/api/${endpointName}`, async (req, res) => {
        const { userId, role, selectedUserId } = req.query;
        if (!userId) return res.status(400).json({ error: 'userId es requerido.' });
        try {
            let query = { userId };
            if (role === 'admin') {
                if (selectedUserId && selectedUserId !== 'all') query = { userId: selectedUserId };
                else if (['orders', 'stock/history', 'record-prices'].includes(endpointName)) query = {};
            }
            const items = await db.collection(collectionName).find(query).toArray();
            res.json(items);
        } catch (err) { res.status(500).json({ error: 'Error interno del servidor.' }); }
    });
    // Generic update logic for simple collections
    if (collectionName !== 'flowers' && collectionName !== 'products') {
         app.put(`/api/${endpointName}`, async (req, res) => {
            const { items, userId } = req.body;
            if (!Array.isArray(items) || !userId) return res.status(400).json({ error: 'Se esperaba un array de items y un userId.' });
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
            } catch (err) { res.status(500).json({ error: 'Error al actualizar.' }); } 
            finally { await session.endSession(); }
        });
    }
};

createDataEndpoints('variation-gifts', 'variation_gifts');
createDataEndpoints('stock', 'stock');
createDataEndpoints('orders', 'orders');
createDataEndpoints('clients', 'clients');
createDataEndpoints('events', 'events');
createDataEndpoints('fixed-expenses', 'fixed_expenses');
createDataEndpoints('record-prices', 'record_price');

// --- User CRUD ---
app.get('/api/users', async (req, res) => {
    const { role } = req.query;
    if (role !== 'admin') return res.status(403).json({ error: 'Acceso denegado.' });
    try { res.json(await db.collection('users').find({}, { projection: { password: 0 } }).toArray()); } catch(err) { res.status(500).json({ error: 'Error.' }); }
});

app.post('/api/users', async (req, res) => {
    const { username, password, role } = req.body;
    const requesterId = req.headers['x-user-id'];
    if (!username || !password || !role || !requesterId) return res.status(400).json({ error: 'Datos incompletos.' });
    try {
        const requester = await db.collection('users').findOne({ _id: new ObjectId(requesterId) });
        if (!requester || requester.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado.' });
        
        const existingUser = await db.collection('users').findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
        if (existingUser) return res.status(400).json({ error: 'El usuario ya existe.' });

        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const result = await db.collection('users').insertOne({ username: username.toLowerCase(), password: hashedPassword, role, createdAt: new Date(), modulePins: {} });
        if (role === 'user') await seedInitialDataForUser(result.insertedId.toString());
        res.status(201).json({ success: true, userId: result.insertedId });
    } catch (err) { res.status(500).json({ error: 'Error al crear usuario.' }); }
});

app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { username, password, role } = req.body;
    const requesterId = req.headers['x-user-id'];
    try {
        if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'ID inválido.' });
        const requester = await db.collection('users').findOne({ _id: new ObjectId(requesterId) });
        if (!requester || requester.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado.' });
        const updateData = { username: username.toLowerCase(), role };
        if (password?.trim()) updateData.password = await bcrypt.hash(password, saltRounds);
        await db.collection('users').updateOne({ _id: new ObjectId(id) }, { $set: updateData });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Error al actualizar.' }); }
});

app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const requesterId = req.headers['x-user-id'];
    try {
        if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'ID inválido.' });
        const requester = await db.collection('users').findOne({ _id: new ObjectId(requesterId) });
        if (!requester || requester.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado.' });
        if (id === requesterId) return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta.' });
        const result = await db.collection('users').deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Error al eliminar.' }); }
});

app.post('/api/users/pins', async (req, res) => {
    const { userId, pins } = req.body;
    const requesterId = req.headers['x-user-id'];
    try {
        const requester = await db.collection('users').findOne({ _id: new ObjectId(requesterId) });
        if (requester.role !== 'admin' && userId !== requesterId) return res.status(403).json({ error: 'Acceso denegado.' });
        await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: { modulePins: pins } });
        res.status(200).json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Error.' }); }
});

app.post('/api/clients', async (req, res) => {
    const clientData = req.body;
    try {
        const result = await db.collection('clients').insertOne(clientData);
        res.status(201).json({ ...clientData, _id: result.insertedId });
    } catch (err) { res.status(500).json({ error: 'Error.' }); }
});

// Stock Update with Weighted Cost and Record Price
app.post('/api/stock/update-batch', async (req, res) => {
    const { updates } = req.body;
    if (!Array.isArray(updates)) return res.status(400).json({ error: 'Array requerido.' });
    const session = client.startSession();
    try {
        await session.withTransaction(async () => {
            for (const update of updates) {
                const { itemId, change, userId, movementType, newCost, isPackage } = update;
                const stockItem = await db.collection('stock').findOne({ itemId, userId }, { session });
                if (!stockItem) continue;

                const flowersCollection = db.collection('flowers');
                const productsCollection = db.collection('products');
                const collectionToUpdate = stockItem.type === 'flower' ? flowersCollection : productsCollection;

                let quantityChange = change;
                if (isPackage && stockItem.type === 'flower') {
                    const catalogItem = await flowersCollection.findOne({ id: itemId, userId }, { session });
                    if (catalogItem?.cantidadPorPaquete) quantityChange = change * catalogItem.cantidadPorPaquete;
                }
                const quantityAfter = stockItem.quantity + quantityChange;

                // Weighted Average Cost Logic
                if (movementType === 'compra' && newCost !== undefined && newCost !== null && newCost >= 0) {
                    const catalogItem = await collectionToUpdate.findOne({ id: itemId, userId }, { session });
                    if (catalogItem) {
                        let currentTotalValue = 0;
                        let newTotalValue = 0;
                        let newTotalQty = 0;
                        let newUnitCost = 0;
                        let newCostForRecord = 0;

                        if (stockItem.type === 'flower') {
                             // Flower calculation
                             const currentUnitCost = (catalogItem.costoPaquete || 0) / (catalogItem.cantidadPorPaquete || 1);
                             currentTotalValue = stockItem.quantity * currentUnitCost;
                             
                             if (isPackage) {
                                 newTotalValue = change * newCost;
                                 newTotalQty = stockItem.quantity + (change * (catalogItem.cantidadPorPaquete || 1));
                             } else {
                                 newTotalValue = change * newCost; 
                                 newTotalQty = stockItem.quantity + change;
                             }

                             if (newTotalQty > 0) {
                                 newUnitCost = (currentTotalValue + newTotalValue) / newTotalQty;
                                 const newPackageCost = newUnitCost * (catalogItem.cantidadPorPaquete || 1);
                                 
                                 await collectionToUpdate.updateOne({ _id: catalogItem._id }, { $set: { costoPaquete: parseFloat(newPackageCost.toFixed(2)) } }, { session });
                                 newCostForRecord = newPackageCost; // Record package cost for flowers
                             }
                        } else {
                            // Product calculation
                            currentTotalValue = stockItem.quantity * (catalogItem.costo || 0);
                            newTotalValue = change * newCost; // newCost is unit cost for products
                            newTotalQty = stockItem.quantity + change;
                            
                            if (newTotalQty > 0) {
                                newUnitCost = (currentTotalValue + newTotalValue) / newTotalQty;
                                await collectionToUpdate.updateOne({ _id: catalogItem._id }, { $set: { costo: parseFloat(newUnitCost.toFixed(2)) } }, { session });
                                newCostForRecord = newUnitCost;
                            }
                        }
                        
                        // Record Price History (Always record on purchase with new cost)
                        if (newTotalQty > 0) {
                            await db.collection('record_price').insertOne({
                                userId,
                                itemId,
                                itemName: stockItem.name,
                                type: stockItem.type,
                                price: parseFloat(newCostForRecord.toFixed(2)),
                                date: new Date().toISOString()
                            }, { session });
                        }
                    }
                }

                await db.collection('stock').updateOne({ _id: stockItem._id }, { $set: { quantity: quantityAfter } }, { session });
                await db.collection('stock_movements').insertOne({
                    userId, itemId, itemName: stockItem.name, type: movementType,
                    quantityChange, quantityAfter, createdAt: new Date().toISOString()
                }, { session });
            }
        });
        res.status(200).json({ success: true });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno.' }); } finally { await session.endSession(); }
});

app.get('/api/stock/history/:itemId', async (req, res) => {
    const { itemId } = req.params;
    const { userId } = req.query;
    try {
        const history = await db.collection('stock_movements').find({ itemId, userId }).sort({ createdAt: -1 }).toArray();
        res.json(history);
    } catch (err) { res.status(500).json({ error: 'Error.' }); }
});

app.post('/api/orders', async (req, res) => {
    const orderData = req.body;
    const session = client.startSession();
    try {
        let createdOrder;
        await session.withTransaction(async () => {
            const result = await db.collection('orders').insertOne({ ...orderData, createdAt: new Date().toISOString() }, { session });
            createdOrder = { ...orderData, _id: result.insertedId };

            for (const item of orderData.items) {
                if (item.itemId) {
                    const stockItem = await db.collection('stock').findOne({ itemId: item.itemId, userId: orderData.userId }, { session });
                    if (stockItem) {
                         const quantityAfter = stockItem.quantity - item.quantity;
                         await db.collection('stock').updateOne({ _id: stockItem._id }, { $set: { quantity: quantityAfter } }, { session });
                         await db.collection('stock_movements').insertOne({
                            userId: orderData.userId, itemId: item.itemId, itemName: stockItem.name, type: 'venta',
                            quantityChange: -item.quantity, quantityAfter, relatedOrderId: result.insertedId.toString(), createdAt: new Date().toISOString(),
                        }, { session });
                    }
                }
            }
        });
        res.status(201).json(createdOrder);
    } catch (err) { res.status(500).json({ error: 'Error al crear pedido.' }); } finally { await session.endSession(); }
});

app.put('/api/orders/:id', async (req, res) => {
    const { id } = req.params;
    const orderData = req.body;
    delete orderData._id;
    try { await db.collection('orders').updateOne({ _id: new ObjectId(id) }, { $set: orderData }); res.json({success: true}); } catch (e) { res.status(500).send(e); }
});

app.delete('/api/orders/:id', async (req, res) => {
    const { id } = req.params;
    const session = client.startSession();
    try {
        await session.withTransaction(async () => {
            const order = await db.collection('orders').findOne({ _id: new ObjectId(id) }, { session });
            if (!order) throw new Error('Pedido no encontrado');
            
            for (const item of order.items) {
                if (item.itemId) {
                    const stockItem = await db.collection('stock').findOne({ itemId: item.itemId, userId: order.userId }, { session });
                    if (stockItem) {
                        const quantityAfter = stockItem.quantity + item.quantity;
                        await db.collection('stock').updateOne({ _id: stockItem._id }, { $set: { quantity: quantityAfter } }, { session });
                        await db.collection('stock_movements').insertOne({
                            userId: order.userId, itemId: item.itemId, itemName: stockItem.name, type: 'cancelacion',
                            quantityChange: item.quantity, quantityAfter, relatedOrderId: id, createdAt: new Date().toISOString(),
                        }, { session });
                    }
                }
            }
            await db.collection('orders').deleteOne({ _id: new ObjectId(id) }, { session });
        });
        res.json({ success: true });
    } catch (e) { res.status(500).send(e); } finally { await session.endSession(); }
});

app.get('/api/finance/summary', async (req, res) => {
    const { userId, role, selectedUserId } = req.query;
    try {
        let matchQuery = { userId };
        let groupKey = "$userId";
        if (role === 'admin' && (!selectedUserId || selectedUserId === 'all')) { matchQuery = {}; groupKey = "admin_total"; }
        else if (selectedUserId) matchQuery = { userId: selectedUserId };

        const orderSum = await db.collection('orders').aggregate([
            { $match: { ...matchQuery, status: { $ne: 'cancelado' } } },
            { $unwind: "$items" },
            { $group: { _id: groupKey, totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }, totalCost: { $sum: { $multiply: ["$items.quantity", "$items.unitCost"] } } } }
        ]).toArray();
        
        const expSum = await db.collection('fixed_expenses').aggregate([{ $match: matchQuery }, { $group: { _id: groupKey, total: { $sum: "$amount" } } }]).toArray();
        
        const revenue = orderSum[0]?.totalRevenue || 0;
        const cogs = orderSum[0]?.totalCost || 0;
        const expenses = expSum[0]?.total || 0;
        
        res.json({ totalRevenue: revenue, totalCostOfGoods: cogs, wastedGoodsCost: 0, fixedExpenses: expenses, netProfit: revenue - cogs - expenses });
    } catch (e) { res.status(500).send(e); }
});

// Fixed Expenses, Events CRUD (Simplified)
const simpleCrud = (col) => {
    app.post(`/api/${col}`, async (req, res) => { try { const r = await db.collection(col).insertOne(req.body); res.status(201).json({...req.body, _id: r.insertedId}); } catch(e){res.status(500).send(e)} });
    app.put(`/api/${col}/:id`, async (req, res) => { try { await db.collection(col).updateOne({_id: new ObjectId(req.params.id)}, {$set: req.body}); res.json({success:true}); } catch(e){res.status(500).send(e)} });
    app.delete(`/api/${col}/:id`, async (req, res) => { try { await db.collection(col).deleteOne({_id: new ObjectId(req.params.id)}); res.json({success:true}); } catch(e){res.status(500).send(e)} });
};
simpleCrud('fixed-expenses');
simpleCrud('events');

// BACKUP ENDPOINT
app.get('/api/backup/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const data = {
            flowers: await db.collection('flowers').find({ userId }).toArray(),
            products: await db.collection('products').find({ userId }).toArray(),
            variation_gifts: await db.collection('variation_gifts').find({ userId }).toArray(),
            stock: await db.collection('stock').find({ userId }).toArray(),
            orders: await db.collection('orders').find({ userId }).toArray(),
            clients: await db.collection('clients').find({ userId }).toArray(),
            events: await db.collection('events').find({ userId }).toArray(),
            fixed_expenses: await db.collection('fixed_expenses').find({ userId }).toArray(),
            record_price: await db.collection('record_price').find({ userId }).toArray(),
            backupDate: new Date().toISOString()
        };
        res.json(data);
    } catch (e) { res.status(500).json({ error: 'Error generando backup' }); }
});

const PORT = process.env.PORT || 3001;
const startServer = async () => {
  try {
    await client.connect();
    db = client.db(process.env.MONGO_DB_NAME || "Ad_db");
    await ensureInitialUsers();
    app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
  } catch (err) { process.exit(1); }
};
startServer();
