const seance = (session) => {

    return {
        getAllTodaySeance: async (req, res) => {
            try {
                const result = await session.run(
                    `MATCH(m:Movie)-[r:MOVIE_SEANCE]->(seance)
                     WHERE seance.date = '${new Date().toISOString().substr(0, 10)}'
                     RETURN {
                      id: ID(seance),
                      date: seance.date,
                      time: seance.time,
                      movieId: ID(m),
                      movieName: m.name,
                      availablePlace: seance.availablePlace,
                      price: seance.price
                   }`
                );
                const screenings = result.records.map(record => {
                    const dateTime = new Date(record.get(0).date + record.get(0).time);
                    return {
                        id: record.get(0).id.toNumber(),
                        dateTime: `${record.get(0).date} ${dateTime.getHours()}:${dateTime.getMinutes()}`,
                        ...record.get(0)
                    }
                });

                res.render('pages/index', {screenings});
            } catch (err) {
                console.error(err.message);
            }
        },
        getAllSeance: async (req, res) => {
            try {
                const future = [];
                const history = [];

                const result = await session.run(
                    `MATCH(m:Movie)-[r:MOVIE_SEANCE]->(seance)
                     WHERE seance.date <> '${new Date().toISOString().substr(0, 10)}'
                     RETURN {
                      id: ID(seance),
                      date: seance.date,
                      time: seance.time,
                      movieId: ID(m),
                      movieName: m.name,
                      availablePlace: seance.availablePlace,
                      price: seance.price
                     }`
                );
                result.records.forEach(record => {
                    const properties = record.get(0);
                    const date = new Date(properties.date).setHours(0, 0, 0, 0);
                    const today = new Date().setHours(0, 0, 0, 0);
                    const seance = {
                        id: properties.id.toNumber(),
                        dateTime: new Date(properties.date + properties.time).toISOString().substr(0, 16),
                        ...properties
                    }
                    if (date > today) {
                        future.push(seance);
                    } else if (date < today) {
                        history.push(seance);
                    }
                });
                res.render('pages/seance', {future, history});
            } catch (err) {
                console.error(err.message);
            }
        },
        getSeance: async (req, res) => {
            try {
                const id = req.params.id;
                const result = await session.run(
                    `MATCH(m:Movie)-[r:MOVIE_SEANCE]->(seance)
                     WHERE ID(seance) = ${id}
                     RETURN {
                      movieId: ID(m),
                      movieName: m.name,
                      seance: seance
                     }`
                );
                const node = result.records[0].get(0);
                const properties = node.seance.properties;
                const dateTime = new Date(properties.date + properties.time).toISOString().substr(0, 19);
                const seance = {
                    id: node.seance.identity.toNumber(),
                    dateTime,
                    movieId: node.movieId.toNumber(),
                    movieName: node.movieName,
                    ...properties
                }

                res.render('pages/seance-id', {seance});
            } catch (err) {
                console.error(err.message);
            }
        },
        addSeanceGet: async (req, res) => {
            try {
                const result = await session.run("MATCH (movie:Movie) RETURN {id: ID(movie), name: movie.name}");
                const movies = result.records.map(record => {
                    const node = record.get(0);
                    return {
                        id: node.id.toNumber(),
                        name: node.name
                    }
                });

                res.render('pages/seance-new', {movies});
            } catch (err) {
                console.error(err.message);
            }
        },
        addSeancePost: async (req, res) => {
            try {
                const movieId = req.body.movieId;
                const seance = {
                    date: new Date(req.body.seanceDateTime).toISOString().substr(0, 10),
                    time: new Date(req.body.seanceDateTime).toISOString().substr(10, 14),
                    hall: req.body.hall,
                    price: req.body.price,
                    availablePlace: req.body.availablePlace,
                    place: new Array(parseInt(req.body.availablePlace)).fill("")
                };

                const result = await session.run(
                    `CREATE (s:Seance {
                        date: $date,
                        time: $time,
                        hall: $hall,
                        price: $price,
                        availablePlace: $availablePlace,
                        place: $place
                    })
                    RETURN ID(s)`,
                    seance
                );
                const seanceId = result.records[0].get(0).toNumber();

                await session.run(
                    `MATCH (s:Seance), (m:Movie)
                     WHERE ID(s) = ${seanceId} AND ID(m) = ${movieId}
                     CREATE (m)-[r:MOVIE_SEANCE]->(s)
                     RETURN type(r)`
                );

                res.render('pages/success', {success: "Dodano seans"});
            } catch (err) {
                console.error(err.message);
            }
        },
        addReservationGet: async (req, res) => {
            try {
                const id = req.params.id;
                const result = await session.run(`MATCH(s:Seance) WHERE ID(s) = ${id} RETURN {place: s.place}`);
                const seance = {id, ...result.records[0].get(0)};

                res.render('pages/seance-reservation', {seance});
            } catch (err) {
                console.error(err.message);
            }
        },
        addReservationPost: async (req, res) => {
            try {
                const result = await session.run(
                    `MATCH (s:Seance)
                 WHERE id(s)=${req.body.seanceId}
                 RETURN {availablePlace: s. availablePlace, place: s.place}`
                );

                const places = result.records[0].get(0).place;
                const availablePlace = result.records[0].get(0).availablePlace;

                const reqPlaces = [...req.body.places];
                reqPlaces.forEach(place => places[parseInt(place)] = `${req.body.firstName} ${req.body.lastName}`);

                await session.run(
                    `MATCH (s:Seance)
                 WHERE id(s)=${req.body.seanceId}
                 SET s.place = $places, s.availablePlace = $availablePlace
                 RETURN s`,
                    {places, availablePlace: availablePlace - reqPlaces.length}
                );

                res.render('pages/success', {success: "Zarezerwowano bilety"});
            } catch (err) {
                console.error(err.message);
            }
        },
        updateSeance: async (req, res) => {
            try {
                const seance = {
                    id: req.body.id,
                    date: new Date(req.body.seanceDateTime).toISOString().substr(0, 10),
                    time: new Date(req.body.seanceDateTime).toISOString().substr(10, 14),
                    hall: req.body.hall,
                    price: req.body.price,
                };

                await session.run(
                    `MATCH (s:Seance)
                     WHERE id(s)=${seance.id}
                     SET
                        s.date = $date,
                        s.time = $time,
                        s.hall = $hall,
                        s.price = $price
                     RETURN ID(s)`,
                    seance
                );

                res.render('pages/success', {success: "Zaktualizowano dane o seansie"});
            } catch (err) {
                console.error(err.message);
            }
        },
        deleteSeance: async (req, res) => {
            try {
                const id = req.body.id;

                await session.run(
                    `MATCH (seance:Seance)
                     WHERE id(seance)=${id}
                     DETACH DELETE seance`,
                );

                res.render('pages/success', {success: "Usunięto seans"});
            } catch (err) {
                console.error(err.message);
            }
        }
    }
};

module.exports = seance;