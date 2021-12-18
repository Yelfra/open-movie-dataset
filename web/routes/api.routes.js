const express = require('express');
const router = express.Router();
const fs = require('fs');
const client = require('../database');
var format = require('pg-format');

router.use(express.json());

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
			
    `;

const movieDisplayQueryID = `
	SELECT 
		movie.movieId AS "movieId",
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
		
	`;

const groupByQuery = `
	GROUP BY movie.movieid, movie.title, movie.year, movie.rating_imdb, movie.duration, movie.country, movie.oscarnom, movie.oscars,
		director.name, director.surname
`;

router.get('/openapi', async (req, res) => {
	fs.readFile("./OpenAPI.json", "utf-8", function (err, data) {
		if (err) throw err;

		data = JSON.parse(data);

		let response = format(`{
				"status": "200 OK",
				"message": "FETCHED OpenAPI specifications",
				"response": [%s]
			}`, data);
		res.set({
			'method': 'GET',
			'status': '200 OK',
			'message': 'FETCHED OpenAPI specifications',
			'Content-type': 'application/json'
		});
		res.status(200).send(response);
	});
});

// A) GET CHUNKS
router.get('/', async (req, res) => {
	fs.readFile("./movies.json", "utf-8", function (err, data) {
		if (err) throw err;

		data = JSON.parse(data);

		let response = format(`{
            "status": "200 OK",
            "message": "FETCHED movies",
            "response": [%s]
        }`, data);
		res.set({
			'method': 'GET',
			'status': '200 OK',
			'message': 'FETCHED movies',
			'Content-type': 'application/json'
		});

		res.status(200).send(response);
	});
});

// C) GET UNITS
router.get('/titles', async (req, res) => {

	var data = (await (await client.query(`SELECT title FROM movie`))).rows;

	let response = format(`{
        "status": "200 OK",
        "message": "FETCHED movie titles",
        "response": [%s]
    }`, data);
	res.set({
		'method': 'GET',
		'status': '200 OK',
		'message': 'FETCHED movie titles',
		'Content-type': 'application/json'
	});

	res.status(200).send(response);
});

router.get('/directors', async (req, res) => {
	var data = (await (await client.query(`SELECT name, surname FROM director`))).rows;

	let response = format(`{
        "status": "200 OK",
        "message": "FETCHED movie directors",
        "response": [%s]
    }`, data);
	res.set({
		'method': 'GET',
		'status': '200 OK',
		'message': 'FETCHED movie directors',
		'Content-type': 'application/json'
	});

	res.status(200).send(response);
})

router.get('/actors', async (req, res) => {
	var data = (await (await client.query(`SELECT name, surname FROM actor`))).rows;

	let response = format(`{
        "status": "200 OK",
        "message": "FETCHED movie actors",
        "response": [%s]
    }`, data);
	res.set({
		'method': 'GET',
		'status': '200 OK',
		'message': 'FETCHED movie actors',
		'Content-type': 'application/json'
	});

	res.status(200).send(response);
})

// B) GET BY ID
router.get('/:id', async (req, res) => {

	const id = req.params.id;
	checkId(id, req.method, res);

	let idQuery = format(`%s WHERE movie.movieId=%s %s`, movieDisplayQueryID, id, groupByQuery);

	var data = (await (await client.query(idQuery))).rows;

	let response = format(`{
            "status": "200 OK",
            "message": "FETCHED movie with id=%s",
            "response": [%s]
        }`, id, data);
	res.set({
		'method': 'GET',
		'status': '200 OK',
		'message': 'FETCHED movie with id=%s',
		'Content-type': 'application/json'
	});

	res.status(200).send(response);
});

// D) POST
router.post('/', async (req, res) => {

	var topMovieId_init = (await client.query(`SELECT MAX(movieID) FROM movie`)).rows[0].max;
	var topActorId_init = (await client.query(`SELECT MAX(actorID) FROM actor`)).rows[0].max;
	var topDirectorId_init = (await client.query(`SELECT MAX(directorID) FROM director`)).rows[0].max;
	var topGenreId_init = (await client.query(`SELECT MAX(genreID) FROM genre`)).rows[0].max;

	if (!req.body.title || !req.body.year || !req.body.IMDb_rating || !req.body.duration || !req.body.country || !req.body.oscar_nominations || !req.body.oscars_won ||
		!req.body.director_name || !req.body.director_surname ||
		!req.body.actor_name || !req.body.actor_surname ||
		!req.body.genre_name) {

		res.status(400).send('Invalid input');
	}

	let data = req.body;

	const title = data.title;
	const year = data.year;
	const IMDb_rating = data.IMDb_rating;
	const duration = data.duration;
	const country = data.country;
	const oscar_nominations = data.oscar_nominations;
	const oscars_won = data.oscars_won;

	const director_name = data.director_name;
	const director_surname = data.director_surname;

	const actor_name = data.actor_name;
	const actor_surname = data.actor_surname;

	const genre_name = data.genre_name;

	// NEW MOVIE
	var checkExisting = (await client.query(format(`SELECT * 
													FROM movie 
													LEFT JOIN director USING(directorId) 
													WHERE title LIKE '%s'
														AND directorId IN (SELECT directorId
																			FROM director
																			WHERE name LIKE '%s' AND surname LIKE '%s')
													`, title, director_name, director_surname))).rows[0];
	if (!checkExisting) await client.query(format(`INSERT INTO movie (title, year, rating_imdb, duration, country, oscarnom, oscars, directorId) 
												VALUES('%s', %s, %s, %s, '%s', %s, %s,
													(SELECT directorId FROM director WHERE name LIKE '%s' AND surname LIKE '%s'));
												`, title, year, IMDb_rating, duration, country, oscar_nominations, oscars_won,
		director_name, director_surname));

	// NEW DIRECTOR
	var checkExisting = (await client.query(format(`SELECT directorId FROM director WHERE name LIKE '%s' AND surname LIKE '%s'`, director_name, director_surname))).rows[0];
	if (!checkExisting) await client.query(format(`INSERT INTO director (name, surname) VALUES('%s', '%s');`, director_name, director_surname));

	// NEW ACTOR
	var checkExisting = (await client.query(format(`SELECT actorId FROM actor WHERE name LIKE '%s' AND surname LIKE '%s'`, actor_name, actor_surname))).rows[0];
	if (!checkExisting) await client.query(format(`INSERT INTO actor (name, surname) VALUES('%s', '%s');`, actor_name, actor_surname));

	// NEW GENRE
	var checkExisting = (await client.query(format(`SELECT genreId FROM genre WHERE name LIKE '%s'`, genre_name))).rows[0];
	if (!checkExisting) await client.query(format(`INSERT INTO genre (name) VALUES('%s');`, genre_name));


	// OVERWRITE JSON CSV
	var jsonPOST = format(`COPY (
						SELECT json_agg(row_to_json(movies)) FROM (%s %s) movies) 
						TO 'C:/Users/Franz Joseph/Documents/GitHub/OR_0036523987/web/movies.json'`, movieDisplayQuery, groupByQuery);
	var csvPOST = format(`COPY (%s %s) 
						TO 'C:/Users/Franz Joseph/Documents/GitHub/OR_0036523987/web/movies.csv' 
						DELIMITER ',' 
						ENCODING 'utf-8' CSV HEADER`, movieDisplayQuery, groupByQuery);
	await client.query(jsonPOST);
	await client.query(csvPOST);

	// POST TO DATASET
	var topMovieId_final = (await client.query(`SELECT MAX(movieId) FROM movie`)).rows[0].max;
	var topActorId_final = (await client.query(`SELECT MAX(actorId) FROM actor`)).rows[0].max;
	var topDirectorId_final = (await client.query(`SELECT MAX(directorId) FROM director`)).rows[0].max;
	var topGenreId_final = (await client.query(`SELECT MAX(genreId) FROM genre`)).rows[0].max;

	if (topMovieId_init === topMovieId_final || topActorId_init === topActorId_final ||
		topDirectorId_init === topDirectorId_final || topGenreId_init === topGenreId_final) {

		var response = format(`{
            "status": "200 OK",
            "message": "Data already exists in dataset",
            "response": [%s]
        }`, data);
		res.set({
			'method': 'POST',
			'status': '200 OK',
			'message': 'Data already exists in dataset',
			'Content-type': 'application/json'
		});
	} else {
		var response = format(`{
            "status": "201 Created",
            "message": "Request successful, new data created",
            "response": [%s]
        }`, data);
		res.set({
			'method': 'POST',
			'status': '201 Created',
			'message': 'Request successful, new data created',
			'Content-type': 'application/json'
		});
	}

	response = JSON.parse(response)
	res.status(200).send(response);
});

// E) PUT
router.put('/:id', async (req, res) => {

	const id = req.params.id;
	checkId(id, req.method, res)

	const fin = req.body;

	const init = (await client.query(format(`%s WHERE movieId=%s %s`, movieDisplayQuery, id, groupByQuery))).rows[0];

	if (fin.title !== init.title || fin.year !== init.year || fin.IMDb_rating !== init.IMDb_rating ||
		fin.duration !== init.duration || fin.country !== init.country ||
		fin.oscar_nominations !== init.oscar_nominations || fin.oscars_won !== init.oscars_won || fin.director_name !== init.director_name || fin.director_surname !== fin.director_surname) {

		var update = format(`UPDATE movie SET title = '%s', year = %s, rating_imdb = %s, duration = %s, country = '%s', oscarNom = %s, oscars = %s, 
								directorid = (SELECT directorId FROM director WHERE name LIKE '%s' AND surname LIKE '%s')
								WHERE movieId=%s`,
			init.title, init.year, init.IMDb_rating, init.duration, init.country, init.oscar_nominations, init.oscars_won, init.director_name, init.director_surname, id);
		await client.query(update);
	}

	// OVERWRITE JSON CSV
	var jsonPOST = format(`COPY (
		SELECT json_agg(row_to_json(movies)) FROM (%s %s) movies) 
		TO 'C:/Users/Franz Joseph/Documents/GitHub/OR_0036523987/web/movies.json'`, movieDisplayQuery, groupByQuery);
	var csvPOST = format(`COPY (%s %s) 
		TO 'C:/Users/Franz Joseph/Documents/GitHub/OR_0036523987/web/movies.csv' 
		DELIMITER ',' 
		ENCODING 'utf-8' CSV HEADER`, movieDisplayQuery, groupByQuery);
	await client.query(jsonPOST);
	await client.query(csvPOST);

	var response = format(`{
        "status": "200 OK",
        "message": "Request successful",
        "response": [%s]
    }`, fin);

	response = JSON.parse(response);
	res.status(200).send(response);
});

// F) DELETE
router.delete('/:id', async (req, res) => {
	res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");

	const id = req.params.id;
	checkId(id, req.method, res);

	await client.query(format(`DELETE FROM movie WHERE movieId=%s`, id));
	var response = {
		"status": "200 OK",
		"message": "Movie with the provided id successfully deleted",
		"response": null
	};

	// OVERWRITE JSON CSV
	var jsonPOST = format(`COPY (
		SELECT json_agg(row_to_json(movies)) FROM (%s %s) movies) 
		TO 'C:/Users/Franz Joseph/Documents/GitHub/OR_0036523987/web/movies.json'`, movieDisplayQuery, groupByQuery);
	var csvPOST = format(`COPY (%s %s) 
		TO 'C:/Users/Franz Joseph/Documents/GitHub/OR_0036523987/web/movies.csv' 
		DELIMITER ',' 
		ENCODING 'utf-8' CSV HEADER`, movieDisplayQuery, groupByQuery);
	await client.query(jsonPOST);
	await client.query(csvPOST);

	res.status(200).send(response);

});

// function
async function checkId(id, method, res) {
	var idArr = (await client.query('SELECT movieId FROM movie')).rows[0];

	if (isNaN(id)) {
		res.set({
			'method': method,
			'status': '400 Bad Request',
			'message': "INVALID SYNTAX (bad id)",
			'Content-type': 'application/json'
		});
		let response = {
			'status': "400 Bad Request",
			'message': "INVALID SYNTAX (bad id)",
			"response": null
		};

		res.status(400).send(response);
	}

	if (!idArr.includes(id)) {
		res.set({
			'method': 'GET',
			'status': '404 Not Found',
			'message': "Movie id doesn't exist",
			'Content-type': 'application/json'
		});
		let response = {
			'status': "404 Not Found",
			'message': "Movie id doesn't exist",
			'response': null
		};
		res.status(404).send(response);
	}
}

// 501
router.use((req, res) => {

	if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'DELETE') {
		let response = {
			"status": "501 Not Implemented",
			"message": "The request method is not supported by the server and cannot be handled.",
			"response": null
		}
		res.set({
			'method': req.method,
			'status': '501 Not Implemented',
			'message': 'The request method is not supported by the server and cannot be handled.',
			'Content-type': 'application/json'
		});
		res.status(501).send(response);
	}
	let response = {
		"status": "404 Not Found",
		"message": "The server can not find the requested resource. Given URL is not recognized.",
		"response": null
	}
	res.set({
		'method': req.method,
		'status': '404 Not Found',
		'message': 'The server can not find the requested resource. Given URL is not recognized.',
		'Content-type': 'application/json'
	});

	res.status(404).send(response);
});

module.exports = router;