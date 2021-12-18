const express = require('express');
const router = express.Router();
const client = require('../database');

router.use(express.json());

// INITIAL QUERRY
const movieDisplayQuery = `
    
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
    `;

// EXPORTS
var pathJSON = 'C:/Users/Franz Joseph/Documents/GitHub/OR_0036523987/web/exports/export.json';
var pathCSV = 'C:/Users/Franz Joseph/Documents/GitHub/OR_0036523987/web/exports/export.csv';

// MAIN
router.get('/', async function (req, res, next) {

	const movieJSON = (await client.query(movieDisplayQuery, []));
	//console.log("movieJSON:\n" + JSON.stringify(movieJSON));

	//console.log("\nNESTO:\n" + JSON.stringify(movieJSON.rows[0]));

	//const rowsJSON = movieJSON.rows;
	//console.log("\nrowsJSON:\n" + JSON.stringify(rowsJSON));

	res.render('../views/datatable', {
		movies: movieJSON.rows
	});
});
/*
const itemsContainer = document.querySelector(".data-table-rows");
const searchField = document.querySelector(".input-all");
const select = document.querySelector(".filter-select");


function movieDisplayTemplate(data) {
	const {movie, actor} = data;

	return `<tr>
				<td>${movie.title}</td>
				<td>${movie.year}</td>
				<td>${movie.director.name} ${movie.director.name}</td>
				<td>${movie.genre}</td>
				<td>${movie.IMDb_rating}</td>
				<td>${movie.duration}</td>
				<td>${movie.country}</td>
				<td>${actor.name} ${actor.surname}</td>
				<td>${movie.oscar_nominations}</td>
				<td>${movie.oscars_won}</td>
			</tr>`
}


router.post('/', async function (req, res, next) {

	const response = await fetch(req.body.)



});

async function searchAll() {

	const response = await fetch(req);
	var input = document.getElementById("input-all");

	if (!input) {
		console.log('0');
	}
	else {
		console.log('1');
	}


}
*/
module.exports = router;