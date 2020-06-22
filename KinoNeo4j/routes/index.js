const bodyParser = require('body-parser');
const { seanceCtrl, visitCtrl } = require('../controllers');

const urlencodedParser = bodyParser.urlencoded({ extended: false });

const routers = (app, db) => {
    const seance = seanceCtrl(db);
    const visit = visitCtrl(db);

    app.get('/', seance.getAllTodaySeance);

    app.get('/seance', seance.getAllSeance);
    app.get('/seance/id/:id', seance.getSeance);
    app.get('/seance/new', seance.addSeanceGet);
    app.post('/seance/new', urlencodedParser, seance.addSeancePost);
    app.get('/seance/id/:id/reservation', seance.addReservationGet);
    app.post('/seance/id/:id/reservation', urlencodedParser, seance.addReservationPost);
    app.put('/seance/id/:id', seance.updateSeance);
    app.delete('/seance/id/:id', seance.deleteSeance);

    app.get('/movie', visit.getAllMovies);
    app.get('/movie/id/:id', visit.getMovie);
    app.get('/movie/new', visit.addVMovieGet);
    app.post('/movie/new', visit.addMoviePost);
    app.put('/movie/id/:id', visit.updateMovie);
    app.delete('/movie/id/:id', visit.deleteMovie);

    return app;
}

module.exports = routers;
