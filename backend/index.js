require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Aumentar el límite para el payload

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Endpoint de prueba
app.get('/', (req, res) => {
  res.send('¡El backend de Vitora ERP está funcionando!');
});

// --- API Endpoints para Flores ---
app.get('/api/flowers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM flowers ORDER BY id ASC');
    res.json(result.rows);
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

    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Iniciar transacción
        
        // Una forma simple es borrar e insertar, ideal para listas no muy grandes.
        // Para aplicaciones más grandes, se haría un UPDATE o INSERT...ON CONFLICT.
        await client.query('TRUNCATE TABLE flowers RESTART IDENTITY'); 
        
        for (const item of items) {
            const { id, name, price, visible, imageUrl, costoPaquete, cantidadPorPaquete, merma, costHistory } = item;
            const query = `
                INSERT INTO flowers (id, name, price, visible, "imageUrl", "costoPaquete", "cantidadPorPaquete", merma, "costHistory") 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `;
            const values = [id, name, price, visible, imageUrl, costoPaquete, cantidadPorPaquete, merma, JSON.stringify(costHistory || [])];
            await client.query(query, values);
        }

        await client.query('COMMIT'); // Finalizar transacción
        res.status(200).json(items);

    } catch (err) {
        await client.query('ROLLBACK'); // Revertir en caso de error
        console.error('Error al actualizar flores:', err);
        res.status(500).json({ error: 'Error interno del servidor al actualizar.' });
    } finally {
        client.release();
    }
});


// --- API Endpoints para Items Fijos ---
app.get('/api/fixed-items', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fixed_items ORDER BY id ASC');
    res.json(result.rows);
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

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        await client.query('TRUNCATE TABLE fixed_items RESTART IDENTITY');
        
        for (const item of items) {
            const { id, name, price, visible, imageUrl, costo, costHistory } = item;
            const query = `
                INSERT INTO fixed_items (id, name, price, visible, "imageUrl", costo, "costHistory") 
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `;
            const values = [id, name, price, visible, imageUrl, costo, JSON.stringify(costHistory || [])];
            await client.query(query, values);
        }

        await client.query('COMMIT');
        res.status(200).json(items);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar items fijos:', err);
        res.status(500).json({ error: 'Error interno del servidor al actualizar.' });
    } finally {
        client.release();
    }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
