const express = require('express');
const router = express.Router();
const client = require('../database');

router.get('/', async function (req, res, next) {
    
    const movieQuery = `
    
		SELECT 
			 movie.title AS "title",
			 movie.year AS "year",
			 movie.rating_imdb AS "IMDb_rating",
			 movie.duration AS "duration",
			 (SELECT json_agg(genre.name) FROM ofgenre NATURAL JOIN genre WHERE ofgenre.movieid = movie.movieid) AS "genre",
			 movie.country AS "country",
			 movie.oscarnom AS "oscar_nominations",
			 movie.oscars AS "oscars_won",
			 json_build_object(
				'name', director.name,
				'surname', director.surname) AS "director",
			(SELECT json_agg(json_build_object(
					'name', actor.name,
					'surname', actor.surname)) AS actors
					   FROM starring NATURAL JOIN actor WHERE starring.movieid = movie.movieid) AS "starring"
			FROM movie
			JOIN director USING(directorid)
			
			GROUP BY movie.movieid, movie.title, movie.year, movie.rating_imdb, movie.duration, movie.country, movie.oscarnom, movie.oscars,
				director.name, director.surname
			LIMIT 10
    `

    const movieJSON = (await client.query(movieQuery, []));
    //console.log("movieJSON:\n" + JSON.stringify(movieJSON));

    //console.log("\nNESTO:\n" + JSON.stringify(movieJSON.rows[0]));

    //const rowsJSON = movieJSON.rows;
    //console.log("\nrowsJSON:\n" + JSON.stringify(rowsJSON));

	
    res.render('../views/datatable', {
        movies: movieJSON.rows
    });
});

module.exports = router;