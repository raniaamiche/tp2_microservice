const express = require('express');
const db = require('./database');
const session = require('express-session');
const Keycloak = require('keycloak-connect');

const app = express();
app.use(express.json());

const PORT =  4000;  // Change de port ici à 4000 parce que elle n'a pas marché a 3000 lorsque je teste avec Postman

// Configuration Keycloak
const memoryStore = new session.MemoryStore();
app.use(session({
    secret: 'api-secret',
    resave: false,
    saveUninitialized: true,
    store: memoryStore
}));

const keycloak = new Keycloak({ store: memoryStore }, './keycloak-config.json');
app.use(keycloak.middleware());

// Routes
app.get('/', (req, res) => {
    res.json("Registre de personnes! Choisissez le bon routage!");
});

// Récupérer toutes les personnes
app.get('/personnes', keycloak.protect(), (req, res) => {
    db.all("SELECT * FROM personnes", [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "data": rows });
    });
});

// Récupérer une personne par ID
app.get('/personnes/:id', keycloak.protect(), (req, res) => {
    const id = req.params.id;
    db.get("SELECT * FROM personnes WHERE id = ?", [id], (err, row) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "data": row });
    });
});

// Créer une nouvelle personne
app.post('/personnes', keycloak.protect(), (req, res) => {
    const { nom, adresse } = req.body;
    db.run(`INSERT INTO personnes (nom, adresse) VALUES (?, ?)`, [nom, adresse], function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "data": { id: this.lastID } });
    });
});

// Mettre à jour une personne
app.put('/personnes/:id', keycloak.protect(), (req, res) => {
    const id = req.params.id;
    const { nom, adresse } = req.body;
    db.run(`UPDATE personnes SET nom = ?, adresse = ? WHERE id = ?`, [nom, adresse, id], function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success" });
    });
});

// Supprimer une personne
app.delete('/personnes/:id', keycloak.protect(), (req, res) => {
    const id = req.params.id;
    db.run(`DELETE FROM personnes WHERE id = ?`, id, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success" });
    });
});

// Route sécurisée
app.get('/secure', keycloak.protect(), (req, res) => {
    res.json({ message: 'Vous êtes authentifié !' });
});

// Lancer le serveur
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
