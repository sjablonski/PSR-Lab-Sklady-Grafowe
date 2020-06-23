const {v4: uuidv4} = require('uuid');

const seance = (pool) => {
    const seanceProperty =
        `inV().id AS id,
         inV().date AS date,
         inV().time AS time,
         inV().availablePlace AS availablePlace,
         inV().price AS price,
         outV().name AS movieName,
         outV().id AS movieId`;

    return {
        getAllTodaySeance: async (req, res) => {
            try {
                const session = await pool.acquire();
                const result = await session
                                    .select(seanceProperty)
                                    .from(`SELECT FROM Movie_Seance`)
                                    .where("inV().date = :date")
                                    .all({date: new Date().toISOString().substr(0, 10)});
                const screenings = result.map(seance => {
                    const dateTime = new Date(seance.date + seance.time)
                                        .toISOString()
                                        .substr(0, 16)
                                        .replace("T", " ");
                    return {
                        ...seance,
                        dateTime
                    }
                });
                await session.close();

                res.render('pages/index', {screenings});
            } catch (err) {
                console.error(err.message);
            }
        },
        getAllSeance: async (req, res) => {
            try {
                const session = await pool.acquire();
                const future = [];
                const history = [];
                const result = await session
                                    .select(seanceProperty)
                                    .from(`SELECT FROM Movie_Seance`)
                                    .where("date != :date")
                                    .all({date: new Date().toISOString().substr(0, 10)});

                result.forEach(record => {
                    const dateTime = new Date(record.date + record.time)
                                        .toISOString()
                                        .substr(0, 16)
                                        .replace("T", " ");
                    const date = new Date(record.date).setHours(0, 0, 0, 0);
                    const today = new Date().setHours(0, 0, 0, 0);
                    const seance = {
                        ...record,
                        dateTime,
                    }
                    if (date > today) {
                        future.push(seance);
                    } else if (date < today) {
                        history.push(seance);
                    }
                });
                await session.close();

                res.render('pages/seance', {future, history});
            } catch (err) {
                console.error(err.message);
            }
        },
        getSeance: async (req, res) => {
            try {
                const session = await pool.acquire();
                const id = req.params.id;
                const result = await session
                    .select(`inV().id AS id,
                             inV().date AS date,
                             inV().time AS time,
                             inV().hall AS hall,
                             inV().place AS place,
                             inV().availablePlace AS availablePlace,
                             inV().price AS price,
                             outV().name AS movieName,
                             outV().id AS movieId`)
                    .from(`SELECT FROM Movie_Seance`)
                    .where('inV().id=:id')
                    .one({id});

                const dateTime = new Date(result.date + result.time).toISOString().substr(0, 19);
                const seance = {
                    ...result,
                    dateTime
                };
                await session.close();

                res.render('pages/seance-id', {seance});
            } catch (err) {
                console.error(err.message);
            }
        },
        addSeanceGet: async (req, res) => {
            try {
                const session = await pool.acquire();
                const movies = await session
                    .select("id, name")
                    .from("Movie")
                    .all();
                await session.close();

                res.render('pages/seance-new', {movies});
            } catch (err) {
                console.error(err.message);
            }
        },
        addSeancePost: async (req, res) => {
            try {
                const session = await pool.acquire();
                const movieId = req.body.movieId;
                const seance = {
                    id: uuidv4().substr(0, 5),
                    date: new Date(req.body.seanceDateTime).toISOString().substr(0, 10),
                    time: new Date(req.body.seanceDateTime).toISOString().substr(10, 14),
                    hall: req.body.hall,
                    price: req.body.price,
                    availablePlace: req.body.availablePlace,
                    place: new Array(parseInt(req.body.availablePlace)).fill("")
                };

                await session.create("VERTEX", "Seance")
                    .set(seance)
                    .one();
                await session.create("EDGE", "Movie_Seance")
                    .from(`SELECT FROM Movie WHERE id='${movieId}'`)
                    .to(`SELECT FROM Seance WHERE id='${seance.id}'`)
                    .one();
                await session.close();

                res.render('pages/success', {success: "Dodano seans"});
            } catch (err) {
                console.error(err.message);
            }
        },
        addReservationGet: async (req, res) => {
            try {
                const id = req.params.id;
                const session = await pool.acquire();
                const seance = await session
                    .select("id, place")
                    .from("Seance")
                    .where({id})
                    .one();
                await session.close();

                res.render('pages/seance-reservation', {seance});
            } catch (err) {
                console.error(err.message);
            }
        },
        addReservationPost: async (req, res) => {
            try {
                const session = await pool.acquire();
                const id = req.body.seanceId;
                const result = await session
                    .select("availablePlace, place")
                    .from("Seance")
                    .where({id})
                    .one();

                const places = result.place;
                const availablePlace = result.availablePlace;

                const reqPlaces = [...req.body.places];
                reqPlaces.forEach(place => places[parseInt(place)] = `${req.body.firstName} ${req.body.lastName}`);

                const seance = {place: places, availablePlace: availablePlace - reqPlaces.length};
                await session.update("Seance")
                    .set(seance)
                    .where({id})
                    .one();
                await session.close();

                res.render('pages/success', {success: "Zarezerwowano bilety"});
            } catch (err) {
                console.error(err.message);
            }
        },
        updateSeance: async (req, res) => {
            try {
                const session = await pool.acquire();
                const id = req.body.id;
                const seance = {
                    date: new Date(req.body.seanceDateTime).toISOString().substr(0, 10),
                    time: new Date(req.body.seanceDateTime).toISOString().substr(10, 14),
                    hall: req.body.hall,
                    price: req.body.price,
                };

                await session.update("Seance")
                    .set(seance)
                    .where({id})
                    .one();
                await session.close();

                res.render('pages/success', {success: "Zaktualizowano dane o seansie"});
            } catch (err) {
                console.error(err.message);
            }
        },
        deleteSeance: async (req, res) => {
            try {
                const session = await pool.acquire();
                const id = req.body.id;

                await session.delete("VERTEX", "Seance")
                    .where({id})
                    .one()
                await session.close();

                res.render('pages/success', {success: "Usunięto seans"});
            } catch (err) {
                console.error(err.message);
            }
        }
    }
};

module.exports = seance;