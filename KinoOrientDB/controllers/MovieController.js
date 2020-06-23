const {v4: uuidv4} = require('uuid');

const movie = (pool) => {
    return {
        getAllMovies: async (req, res) => {
            try {
                const session = await pool.acquire();
                const movies = await session
                    .select()
                    .from("Movie")
                    .all();
                await session.close();

                res.render('pages/movie', {movies});
            } catch (err) {
                console.error(err.message);
            }
        },
        getMovie: async (req, res) => {
            try {
                const id = req.params.id;
                const session = await pool.acquire();
                const movie = await session
                    .select()
                    .from("Movie")
                    .where({id})
                    .one();
                await session.close();
                console.log(movie);

                res.render('pages/movie-id', {movie});
            } catch (err) {
                console.error(err.message);
            }
        },
        addMovieGet: async (req, res) => {
            try {
                res.render('pages/movie-new');
            } catch (err) {
                console.error(err.message);
            }
        },
        addMoviePost: async (req, res) => {
            try {
                const session = await pool.acquire();
                const movie = {
                    id: uuidv4().substr(0, 5),
                    name: req.body.movieName,
                    director: req.body.director,
                    category: req.body.category,
                    country: req.body.country,
                    language: req.body.language,
                    runningTime: req.body.runningTime,
                    rating: req.body.rating,
                };

                await session.create("VERTEX", "Movie")
                    .set(movie)
                    .one();
                await session.close();

                res.render('pages/success', {success: "Dodano film"});
            } catch (err) {
                console.error(err.message);
            }
        },
        updateMovie: async (req, res) => {
            try {
                const session = await pool.acquire();
                const id = req.body.id;
                const movie = {
                    name: req.body.movieName,
                    director: req.body.director,
                    category: req.body.category,
                    country: req.body.country,
                    language: req.body.language,
                    runningTime: req.body.runningTime,
                    rating: req.body.rating,
                };

                await session.update("Movie")
                    .set(movie)
                    .where({ id })
                    .one();
                await session.close();

                res.render('pages/success', {success: "Zaktualizowano dane o filmie"});
            } catch (err) {
                console.error(err.message);
            }
        },
        deleteMovie: async (req, res) => {
            try {
                const session = await pool.acquire();
                const id = req.body.id;

                await session.delete("VERTEX", "Movie")
                    .where({ id })
                    .one()
                await session.close();

                res.render('pages/success', {success: "Usunięto film"});
            } catch (err) {
                console.error(err.message);
            }
        }
    }
};

module.exports = movie;