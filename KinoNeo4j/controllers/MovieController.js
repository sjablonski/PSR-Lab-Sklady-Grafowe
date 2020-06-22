const movie = (session) => {
    return {
        getAllMovies: async (req, res) => {
            try {
                const result = await session.run("MATCH (movie:Movie) RETURN movie");
                const movies = result.records.map(record => {
                    const node = record.get('movie');
                    return {
                        id: node.identity.toNumber(),
                        ...node.properties
                    }
                });
                res.render('pages/movie', {movies});
            } catch (err) {
                console.error(err.message);
            }
        },
        getMovie: async (req, res) => {
            try {
                const id = req.params.id;
                const result = await session.run(
                    `MATCH (movie:Movie) WHERE ID(movie)=${id} RETURN movie`
                );
                const node = result.records[0].get('movie');
                const movie = {
                    id: node.identity.toNumber(),
                    ...node.properties
                };

                res.render('pages/movie-id', {movie});
            } catch (err) {
                console.error(err.message);
            }
        },
        addVMovieGet: async (req, res) => {
            try {
                res.render('pages/movie-new');
            } catch (err) {
                console.error(err.message);
            }
        },
        addMoviePost: async (req, res) => {
            try {
                const movie = {
                    name: req.body.movieName,
                    director: req.body.director,
                    category: req.body.category,
                    country: req.body.country,
                    language: req.body.language,
                    runningTime: req.body.runningTime,
                    rating: req.body.rating,
                };

                await session.run(
                    `CREATE (movie:Movie {
                        name: $name, 
                        director: $director,
                        category: $category,
                        country: $country,
                        language: $language,
                        runningTime: $runningTime,
                        rating: $rating
                    }) 
                    RETURN movie`,
                    movie
                );

                res.render('pages/success', {success: "Dodano film"});
            } catch (err) {
                console.error(err.message);
            }
        },
        updateMovie: async (req, res) => {
            try {
                const movie = {
                    id: req.body.id,
                    name: req.body.movieName,
                    director: req.body.director,
                    category: req.body.category,
                    country: req.body.country,
                    language: req.body.language,
                    runningTime: req.body.runningTime,
                    rating: req.body.rating,
                };

                await session.run(
                    `MATCH (movie:Movie)
                     WHERE id(movie)=${movie.id}
                     SET
                        movie.name = $name, 
                        movie.director = $director,
                        movie.category = $category,
                        movie.country = $country,
                        movie.language = $language,
                        movie.runningTime = $runningTime,
                        movie.rating = $rating
                     RETURN movie`,
                    movie
                );

                res.render('pages/success', {success: "Zaktualizowano dane o filmie"});
            } catch (err) {
                console.error(err.message);
            }
        },
        deleteMovie: async (req, res) => {
            try {
                const id = req.body.id;

                await session.run(
                    `MATCH (movie:Movie)
                     WHERE id(movie)=${id}
                     DETACH DELETE movie`
                );

                res.render('pages/success', {success: "Usunięto film"});
            } catch (err) {
                console.error(err.message);
            }
        }
    }
};

module.exports = movie;