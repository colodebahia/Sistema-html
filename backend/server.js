const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// DB: SQLite local (cambiar a PostgreSQL en producción)
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false
});

// ── MODELOS ──────────────────────────────────────────────
const Client = sequelize.define('Client', {
  id:       { type: DataTypes.STRING, primaryKey: true },
  name:     DataTypes.STRING,
  phone:    DataTypes.STRING,
  email:    DataTypes.STRING,
  location: DataTypes.STRING,
  notes:    DataTypes.TEXT,
  geometry: DataTypes.JSON
});

const Product = sequelize.define('Product', {
  id:            { type: DataTypes.STRING, primaryKey: true },
  sku:           { type: DataTypes.STRING, unique: true },
  name:          DataTypes.STRING,
  description:   DataTypes.TEXT,
  supplier:      DataTypes.STRING,
  priceUsd:      DataTypes.REAL,
  priceArs:      DataTypes.REAL,
  stock:         DataTypes.INTEGER,
  leadTime:      DataTypes.INTEGER,
  components:    DataTypes.JSON,
  technicalInfo: DataTypes.JSON,
  images:        DataTypes.JSON
});

const Component = sequelize.define('Component', {
  id:          { type: DataTypes.STRING, primaryKey: true },
  sku:         { type: DataTypes.STRING, unique: true },
  name:        DataTypes.STRING,
  description: DataTypes.TEXT,
  supplier:    DataTypes.STRING,
  priceUsd:    DataTypes.REAL,
  priceArs:    DataTypes.REAL,
  leadTime:    DataTypes.INTEGER,
  stock:       DataTypes.INTEGER,
  notes:       DataTypes.TEXT
});

const Budget = sequelize.define('Budget', {
  id:          { type: DataTypes.STRING, primaryKey: true },
  clientId:    DataTypes.STRING,
  clientName:  DataTypes.STRING,
  items:       DataTypes.JSON,
  totalUsd:    DataTypes.REAL,
  totalArs:    DataTypes.REAL,
  totalWithIva: DataTypes.REAL,
  ivaPct:      DataTypes.REAL
});

// ── HELPER RUTAS CRUD ────────────────────────────────────
function crudRoutes(router, Model) {
  router.get('/', async (req, res) => {
    try { res.json(await Model.findAll()); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });

  router.post('/', async (req, res) => {
    try { res.status(201).json(await Model.create(req.body)); }
    catch (e) { res.status(400).json({ error: e.message }); }
  });

  router.put('/:id', async (req, res) => {
    try {
      const item = await Model.findByPk(req.params.id);
      if (!item) return res.status(404).json({ error: 'No encontrado' });
      await item.update(req.body);
      res.json(item);
    } catch (e) { res.status(400).json({ error: e.message }); }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const item = await Model.findByPk(req.params.id);
      if (!item) return res.status(404).json({ error: 'No encontrado' });
      await item.destroy();
      res.status(204).send();
    } catch (e) { res.status(400).json({ error: e.message }); }
  });
}

// ── RUTAS ────────────────────────────────────────────────
const clientsRouter = express.Router();
crudRoutes(clientsRouter, Client);
app.use('/api/clients', clientsRouter);

const productsRouter = express.Router();
crudRoutes(productsRouter, Product);
app.use('/api/products', productsRouter);

const componentsRouter = express.Router();
crudRoutes(componentsRouter, Component);
app.use('/api/components', componentsRouter);

const budgetsRouter = express.Router();
crudRoutes(budgetsRouter, Budget);
app.use('/api/budgets', budgetsRouter);

// ── SYNC: importar y exportar todo de una vez ────────────
app.get('/api/sync/export', async (req, res) => {
  try {
    res.json({
      clients:    await Client.findAll(),
      products:   await Product.findAll(),
      components: await Component.findAll(),
      budgets:    await Budget.findAll()
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/sync/import', async (req, res) => {
  try {
    const { clients, products, components, budgets } = req.body;
    const opts = { updateOnDuplicate: ['id'] };
    if (clients?.length)    await Client.bulkCreate(clients, opts);
    if (products?.length)   await Product.bulkCreate(products, opts);
    if (components?.length) await Component.bulkCreate(components, opts);
    if (budgets?.length)    await Budget.bulkCreate(budgets, opts);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ── HEALTH ───────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ── INICIO ───────────────────────────────────────────────
sequelize.sync({ force: false }).then(() => {
  app.listen(PORT, () => {
    console.log(`✓ Buena Huella API en http://localhost:${PORT}`);
    console.log(`✓ Base de datos: SQLite (database.sqlite)`);
    console.log(`✓ Endpoints: /api/clients | /api/products | /api/components | /api/budgets`);
  });
}).catch(err => {
  console.error('Error inicializando BD:', err);
  process.exit(1);
});
