const databaseOptions = {
    name: "cinema",
    username: "root",
    password: "orientdb",
    type: "graph"
};

const sessionOptions = {
    name: "cinema",
    username: "admin",
    password: "admin",
    pool: {
        max: 25
    }
};

exports.databaseOptions = databaseOptions;
exports.sessionOptions = sessionOptions;