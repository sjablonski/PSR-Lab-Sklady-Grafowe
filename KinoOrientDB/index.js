const express = require('express');
const methodOverride = require('method-override');
const OrientDBClient = require("orientjs").OrientDBClient;
const routes = require('./routes');
const {databaseOptions, sessionOptions} = require('./constants');

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

let client;
let pool;
(async function() {
    try {
        let client = await OrientDBClient.connect({
            host: "localhost",
            pool: {
                max: 10
            }
        });

        let exists = await client.existsDatabase(databaseOptions);

        if (!exists) {
            await client.createDatabase(databaseOptions);
        }

        pool = await client.sessions(sessionOptions);
        const session = await pool.acquire();
        await session.command("create class Seance IF NOT EXISTS extends V").one();
        await session.command("create class Movie IF NOT EXISTS extends V").one();
        await session.command("create class Movie_Seance IF NOT EXISTS extends E").one();
        await session.close();

        routes(app, pool);
        const server = app.listen(3001, function () {
            const host = server.address().address;
            const port = server.address().port;

            console.log("App listening at http://%s:%s", host, port)
        });
    } catch (e) {
        console.log(e);
    }
})();

process.on('SIGINT', async () => {
    try {
        if (client) {
            await pool.close();
            await client.dropDatabase(databaseOptions);
            await client.close();
            console.log("Disconnected");
        }
        process.exit();
    } catch (err) {
        console.error(err.message);
    }
});