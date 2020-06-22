const express = require('express');
const methodOverride = require('method-override');
const neo4j = require('neo4j-driver')
const routes = require('./routes');

const app = express();

app.use(express.urlencoded({extended: true}))
app.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        const method = req.body._method
        delete req.body._method
        return method
    }
}));
app.set('view engine', 'ejs');

const driver = neo4j.driver("neo4j://localhost:7687", neo4j.auth.basic('neo4j', 'neo4jpassword'));
const session = driver.session();

routes(app, session);
const server = app.listen(3001, function () {
    const host = server.address().address;
    const port = server.address().port;

    console.log("App listening at http://%s:%s", host, port)
});

process.on('SIGINT', async () => {
    try {
        await session.run("MATCH (n) DETACH DELETE n");
        await session.close();
        await driver.close();
        process.exit();
    } catch (err) {
        console.error(err.message);
    }
});