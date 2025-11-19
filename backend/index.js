
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

const ensureInitialUsers = async () => {
    try {
        const usersCollection = db.collection('users');
        
        // 1. Asegurar ADMIN
        const adminUser = await usersCollection.findOne({ username: 'ADMIN' });
        if (!adminUser) {
            console.log("Creando Super Usuario ADMIN...");
            const hashedPassword = await bcrypt.hash('admin123', saltRounds); // Default pass
            await usersCollection.insertOne({
                username: 'ADMIN',
                password: hashedPassword,
                role: 'admin',
                modulePins: { finance: '1234', settings: '1234' },
                createdAt: new Date()
            });
             console.log("Usuario ADMIN creado (Pass: admin123).");
        }

        // 2. Asegurar Usuario Empleado (Floreria1) para que el selector no esté vacío
        const demoUser = await usersCollection.findOne({ username: 'Floreria1' });
        if (!demoUser) {
            console.log("Creando Usuario Empleado de prueba (Floreria1)...");
            const hashedPassword = await bcrypt.hash('user123', saltRounds); // Default pass
            const result = await usersCollection.insertOne({
                username: 'Floreria1',
                password: hashedPassword,
                role: 'user',
                createdAt: new Date()
            });
            // Sembrar datos para este usuario para que no empiece vacío
            await seedInitialDataForUser(result.insertedId.toString());
            console.log("Usuario Floreria1 creado (Pass: user123).");
        }

    } catch (error) {
        console.error("Error asegurando usuarios iniciales:", error);
    }
};


// --- API Endpoints ---
app.get('/', (req, res) => {
  res.send('AD ERP ESTA ON LAI (stá funcionando con MongoDB y autenticación!)');
});

// --- HEALTH CHECK ENDPOINT ---
app.get('/api/health', async (req, res) => {
    try {
        // Ejecuta un comando ping simple a la base de datos
        await db.command({ ping: 1 });
        res.json({ status: 'ok', message: 'Conexión exitosa a MongoDB' });
    } catch (error) {
        console.error("Health check failed:", error);
        res.status(500).json({ status: 'error', message: 'No se pudo conectar a la base de datos', error: error.message });
    }
});

// --- Auth Endpoint ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
    }
    try {
        const usersCollection = db.collection('users');
        // Case insensitive login
        const user = await usersCollection.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
        if (!user) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
        }
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            const userIdString = user._id.toString();
            
            // Seed data for regular users if first time (redundancy check)
            if (user.username !== 'ADMIN') {
                 const flowerCount = await db.collection('flowers').countDocuments({ userId: userIdString });
                 if (flowerCount === 0) {
                     await seedInitialDataForUser(userIdString);
                 }
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
                    // If looking at all, user needs to own data or be admin. 
                    // For simpler logic in this MVP, Admin sees specific user data or their own.
                    // Ideally 'all' would aggregate, but for item lists it's messy.
                    // Default to admin's own data if 'all' is selected for catalogs.
                    if (endpointName === 'orders' || endpointName === 'stock/history') {
                         query = {}; // See everything for orders/history
                    } else {
                         query = { userId }; // Fallback for catalogs
                    }
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

// --- User management for admin (CRUD) ---
app.get('/api/users', async (req, res) => {
    const { role } = req.query;
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

app.post('/api/users', async (req, res) => {
    const { username, password, role } = req.body;
    const requesterId = req.headers['x-user-id'];

    if (!username || !password || !role || !requesterId) {
        return res.status(400).json({ error: 'Datos incompletos.' });
    }

    try {
        const requester = await db.collection('users').findOne({ _id: new ObjectId(requesterId) });
        if (!requester || requester.role !== 'admin') {
            return res.status(403).json({ error: 'Solo administradores pueden crear usuarios.' });
        }

        const existingUser = await db.collection('users').findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
        if (existingUser) {
            return res.status(400).json({ error: 'El nombre de usuario ya existe.' });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const newUser = {
            username,
            password: hashedPassword,
            role,
            createdAt: new Date(),
            modulePins: {}
        };

        const result = await db.collection('users').insertOne(newUser);
        
        // Si es un usuario normal, sembramos datos iniciales
        if (role === 'user') {
            await seedInitialDataForUser(result.insertedId.toString());
        }

        res.status(201).json({ success: true, userId: result.insertedId });
    } catch (err) {
        console.error("Error creando usuario:", err);
        res.status(500).json({ error: 'Error al crear usuario.' });
    }
});

app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { username, password, role } = req.body;
    const requesterId = req.headers['x-user-id'];

    try {
        if (!ObjectId.isValid(id)) {
             return res.status(400).json({ error: 'ID de usuario inválido.' });
        }

        const requester = await db.collection('users').findOne({ _id: new ObjectId(requesterId) });
        if (!requester || requester.role !== 'admin') {
            return res.status(403).json({ error: 'Acceso denegado.' });
        }

        const userToUpdate = await db.collection('users').findOne({ _id: new ObjectId(id) });
        if (!userToUpdate) {
             return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        
        // Protección extra para el usuario ADMIN
        if (userToUpdate.username === 'ADMIN' && username !== 'ADMIN') {
             return res.status(400).json({ error: 'No se puede cambiar el nombre de usuario del Super Admin.' });
        }

        const updateData = { username, role };
        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, saltRounds);
        }

        await db.collection('users').updateOne({ _id: new ObjectId(id) }, { $set: updateData });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar usuario.' });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const requesterId = req.headers['x-user-id'];

    try {
        if (!ObjectId.isValid(id)) {
             return res.status(400).json({ error: 'ID de usuario inválido.' });
        }

        const requester = await db.collection('users').findOne({ _id: new ObjectId(requesterId) });
        if (!requester || requester.role !== 'admin') {
            return res.status(403).json({ error: 'Acceso denegado.' });
        }
        
        if (id === requesterId) {
             return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta.' });
        }

        // Obtener usuario a eliminar para verificar si es ADMIN
        const userToDelete = await db.collection('users').findOne({ _id: new ObjectId(id) });
        
        if (!userToDelete) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        if (userToDelete.username === 'ADMIN') {
            return res.status(403).json({ error: 'No se puede eliminar al Super Admin del sistema.' });
        }

        await db.collection('users').deleteOne({ _id: new ObjectId(id) });
        // Opcional: Borrar datos relacionados (Cascade delete)
        // await db.collection('orders').deleteMany({ userId: id });
        // await db.collection('stock').deleteMany({ userId: id });
        // ... etc. Por seguridad, mantenemos los datos por ahora.

        res.json({ success: true });
    } catch (err) {
        console.error("Error borrando usuario:", err);
        res.status(500).json({ error: 'Error interno del servidor al eliminar usuario.' });
    }
});


app.post('/api/users/pins', async (req, res) => {
    const { userId, pins } = req.body;
    const requesterId = req.headers['x-user-id'];
    if (!userId || !pins || !requesterId) {
        return res.status(400).json({ error: 'userId, pins y x-user-id son requeridos.' });
    }
    try {
        const requester = await db.collection('users').findOne({ _id: new ObjectId(requesterId) });
        if (requester.role !== 'admin' && userId !== requesterId) {
            return res.status(403).json({ error: 'Acceso denegado. Solo los administradores pueden cambiar los PINs de otros usuarios.' });
        }

        await db.collection('users').updateOne(
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

// Stock management with WEIGHTED AVERAGE COST
app.post('/api/stock/update-batch', async (req, res) => {
    const { updates } = req.body;
    if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ error: 'Se requiere un array de actualizaciones.' });
    }

    const session = client.startSession();
    try {
        await session.withTransaction(async () => {
            const stockCollection = db.collection('stock');
            const movementsCollection = db.collection('stock_movements');
            const flowersCollection = db.collection('flowers');
            const fixedItemsCollection = db.collection('fixed_items');

            for (const update of updates) {
                const { itemId, change, userId, movementType, newCost, isPackage } = update;
                if (!userId) throw new Error(`userId no proporcionado para la actualización del item ${itemId}`);
                
                const stockItem = await stockCollection.findOne({ itemId, userId }, { session });
                if (!stockItem) throw new Error(`Stock item ${itemId} no encontrado para el usuario ${userId}`);

                // Logic for Unit Conversion (Package -> Stems)
                let quantityChange = change;
                if (isPackage && stockItem.type === 'flower') {
                    // Fetch catalog item to get conversion rate
                    const catalogItem = await flowersCollection.findOne({ id: itemId, userId }, { session });
                    if (catalogItem && catalogItem.cantidadPorPaquete) {
                        quantityChange = change * catalogItem.cantidadPorPaquete;
                    }
                }

                const quantityAfter = stockItem.quantity + quantityChange;

                // Logic for Weighted Average Cost (Costo Promedio Ponderado)
                if (movementType === 'compra' && newCost && newCost > 0) {
                    const collectionToUpdate = stockItem.type === 'flower' ? flowersCollection : fixedItemsCollection;
                    const catalogItem = await collectionToUpdate.findOne({ id: itemId, userId }, { session });
                    
                    if (catalogItem) {
                        // Calculate new weighted cost
                        // For flowers, cost is usually per package, but stock is stems. 
                        // Let's assume newCost coming in is per Package if isPackage is true.
                        
                        let currentTotalValue = 0;
                        let newTotalValue = 0;
                        let newTotalQty = 0;

                        if (stockItem.type === 'flower') {
                             // Current value (Stems * Unit Cost)
                             // Unit Cost = costoPaquete / cantidadPorPaquete (ignoring merma for stock value valuation)
                             const currentUnitCost = (catalogItem.costoPaquete || 0) / (catalogItem.cantidadPorPaquete || 1);
                             currentTotalValue = stockItem.quantity * currentUnitCost;
                             
                             // New Value
                             // If input was packages:
                             if (isPackage) {
                                 newTotalValue = change * newCost; // change is num packages * cost per package
                                 newTotalQty = stockItem.quantity + (change * (catalogItem.cantidadPorPaquete || 1));
                             } else {
                                 // If input was units (rare for purchase but possible)
                                 newTotalValue = change * (newCost / (catalogItem.cantidadPorPaquete || 1));
                                 newTotalQty = stockItem.quantity + change;
                             }

                             // New Unit Cost
                             if (newTotalQty > 0) {
                                 const newUnitCost = (currentTotalValue + newTotalValue) / newTotalQty;
                                 // Convert back to Package Cost for the catalog storage
                                 const newPackageCost = newUnitCost * (catalogItem.cantidadPorPaquete || 1);
                                 
                                 await collectionToUpdate.updateOne(
                                     { _id: catalogItem._id },
                                     { 
                                         $set: { costoPaquete: parseFloat(newPackageCost.toFixed(2)) },
                                         $push: { costHistory: { date: new Date().toISOString(), costoPaquete: parseFloat(newPackageCost.toFixed(2)) } }
                                     },
                                     { session }
                                 );
                             }

                        } else {
                            // Fixed Item
                            currentTotalValue = stockItem.quantity * (catalogItem.costo || 0);
                            newTotalValue = change * newCost;
                            newTotalQty = stockItem.quantity + change;

                            if (newTotalQty > 0) {
                                const newUnitCost = (currentTotalValue + newTotalValue) / newTotalQty;
                                await collectionToUpdate.updateOne(
                                     { _id: catalogItem._id },
                                     { 
                                         $set: { costo: parseFloat(newUnitCost.toFixed(2)) },
                                         $push: { costHistory: { date: new Date().toISOString(), costo: parseFloat(newUnitCost.toFixed(2)) } }
                                     },
                                     { session }
                                 );
                            }
                        }
                    }
                }

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
                    quantityChange,
                    quantityAfter,
                    createdAt: new Date().toISOString(),
                    note: isPackage ? `Ingreso de ${change} paquetes` : undefined
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
    } catch (err) {
        console.error('Error al crear el pedido:', err);
        res.status(500).json({ error: 'Error interno del servidor al crear el pedido.' });
    } finally {
        await session.endSession();
    }
});

// Order Update
app.put('/api/orders/:id', async (req, res) => {
    const { id } = req.params;
    const orderData = req.body;
    delete orderData._id;

    try {
        await db.collection('orders').updateOne({ _id: new ObjectId(id) }, { $set: orderData });
        const updatedOrder = await db.collection('orders').findOne({ _id: new ObjectId(id) });
        res.json(updatedOrder);
    } catch (err) {
        console.error('Error al actualizar el pedido:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// Order Delete
app.delete('/api/orders/:id', async (req, res) => {
    const { id } = req.params;
    const session = client.startSession();
    try {
        await session.withTransaction(async () => {
            const ordersCollection = db.collection('orders');
            const orderToDelete = await ordersCollection.findOne({ _id: new ObjectId(id) }, { session });

            if (!orderToDelete) {
                throw new Error('Pedido no encontrado');
            }

            // Restore stock
            const stockCollection = db.collection('stock');
            const movementsCollection = db.collection('stock_movements');
            for (const item of orderToDelete.items) {
                if (item.itemId) {
                    const stockItem = await stockCollection.findOne({ itemId: item.itemId, userId: orderToDelete.userId }, { session });
                    if (stockItem) {
                        const quantityAfter = stockItem.quantity + item.quantity;
                        await stockCollection.updateOne(
                            { _id: stockItem._id },
                            { $set: { quantity: quantityAfter } },
                            { session }
                        );
                        await movementsCollection.insertOne({
                            userId: orderToDelete.userId,
                            itemId: item.itemId,
                            itemName: stockItem.name,
                            type: 'cancelacion',
                            quantityChange: item.quantity,
                            quantityAfter,
                            relatedOrderId: id,
                            createdAt: new Date().toISOString(),
                        }, { session });
                    }
                }
            }
            await ordersCollection.deleteOne({ _id: new ObjectId(id) }, { session });
        });
        res.json({ success: true });
    } catch (err) {
        console.error('Error al eliminar el pedido:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
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
        
        const ordersCollection = db.collection('orders');
        const orderSummary = await ordersCollection.aggregate([
            { $match: { ...matchQuery, status: { $ne: 'cancelado' } } },
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


// --- Fixed Expenses CRUD ---
app.post('/api/fixed-expenses', async (req, res) => {
    const expenseData = req.body;
    try {
        const result = await db.collection('fixed_expenses').insertOne(expenseData);
        res.status(201).json({ ...expenseData, _id: result.insertedId });
    } catch (err) { res.status(500).json({ error: 'Error al crear gasto fijo' }); }
});
app.put('/api/fixed-expenses/:id', async (req, res) => {
    const { id } = req.params;
    const { name, amount } = req.body;
    try {
        await db.collection('fixed_expenses').updateOne({ _id: new ObjectId(id) }, { $set: { name, amount } });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Error al actualizar gasto fijo' }); }
});
app.delete('/api/fixed-expenses/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.collection('fixed_expenses').deleteOne({ _id: new ObjectId(id) });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Error al eliminar gasto fijo' }); }
});

// --- Events CRUD ---
app.post('/api/events', async (req, res) => {
    const eventData = req.body;
    try {
        const result = await db.collection('events').insertOne(eventData);
        res.status(201).json({ ...eventData, _id: result.insertedId });
    } catch (err) { res.status(500).json({ error: 'Error al crear evento' }); }
});
app.put('/api/events/:id', async (req, res) => {
    const { id } = req.params;
    const { name, date } = req.body;
    try {
        await db.collection('events').updateOne({ _id: new ObjectId(id) }, { $set: { name, date } });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Error al actualizar evento' }); }
});
app.delete('/api/events/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.collection('events').deleteOne({ _id: new ObjectId(id) });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Error al eliminar evento' }); }
});


// --- Server Start ---
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await client.connect();
    console.log("Conectado exitosamente a MongoDB.");
    const dbName = process.env.MONGO_DB_NAME || "Ad_db"; 
    db = client.db(dbName);
    console.log(`Usando la base de datos: ${dbName}`);
    
    await ensureInitialUsers(); // Cambio aquí: llamamos a la nueva función

    app.listen(PORT, () => {
      console.log(`Servidor escuchando en el puerto ${PORT}`);
    });
  } catch (err) {
    console.error("No se pudo conectar a MongoDB. Saliendo...", err);
    process.exit(1);
  }
};

startServer();
