const express = require('express');
const router = express.Router();
const fs = require('fs');
const client = require('../database');
var format = require('pg-format');

//const bodyParser = require("body-parser");

router.use(express.json());
//router.use(bodyParser.json());

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
				"response": 
					[
						"@context" : {
							"@vocab" : "https://schema.org/",
							"title" : "title",
							"year" : "copyrightYear",
							"IMDb_rating" : "ratingValue",
							"duration" : "duration",
							"genre" : "genre",
							"country" : "countryOfOrigin",
							"oscar_nominations" : "number",
							"oscars_won" : "number",
							"director" : "director",
							"starring" : "actors"
						},
					%s]
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
            "response": 
				[
					"@context" : {
						"@vocab" : "https://schema.org/",
						"title" : "title",
						"year" : "copyrightYear",
						"IMDb_rating" : "ratingValue",
						"duration" : "duration",
						"genre" : "genre",
						"country" : "countryOfOrigin",
						"oscar_nominations" : "number",
						"oscars_won" : "number",
						"director" : "director",
						"starring" : "actors"
					},
				%s]
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
        "response": 
			[
				"@context" : {
					"@vocab" : "https://schema.org/",
					"title" : "title"
				},
			%s]
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
        "response": 
			[
				"@context" : {
					"@vocab" : "https://schema.org/",
					"director" : "director",
					"name" : "name",
					"surname" : "surname"
				},
			%s]
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
        "response": 
			[
				"@context" : {
					"@vocab" : "https://schema.org/",
					"actor" : "actor",
					"name" : "name",
					"surname" : "surname"
				},
			%s]
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
            "response": 
				[
					"@context" : {
						"@vocab" : "https://schema.org/",
						"title" : "title",
						"year" : "copyrightYear",
						"IMDb_rating" : "ratingValue",
						"duration" : "duration",
						"genre" : "genre",
						"country" : "countryOfOrigin",
						"oscar_nominations" : "number",
						"oscars_won" : "number",
						"director" : "director",
						"starring" : "actors"
					},
				%s]
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

/*
(post) {"title":"There Will Be Blood","year":2007,"IMDb_rating":8.2,"duration":158,"genre":["Drama"],"country":"USA","oscar_nominations":6,"oscars_won":2,"director":{"name" : "Paul Thomas", "surname" : "Anderson"},"starring":[{"name" : "Daniel", "surname" : "Day-Lewis"}, {"name" : "Paul", "surname" : "Dano"}, {"name" : "Ciaran", "surname" : "Hinds"}]}
(put) {"title":"There Will Be No Blood","year":2021,"IMDb_rating":8.2,"duration":158,"genre":["Adventure","Drama"],"country":"USA","oscar_nominations":6,"oscars_won":2,"director":{"name" : "Mr", "surname" : "Anderson"},"starring":[{"name" : "Daniel", "surname" : "Day-Lewis"}, {"name" : "Paul", "surname" : "Dano"}, {"name" : "Christopher", "surname" : "Walken"}]}

delete from starring where movieid>=11;
delete from ofgenre where movieid>=11;
delete from genre where genreid>=10;
delete from movie where movieid>=11;
delete from actor where actorid>=29;
delete from director where directorid>=10;
*/
router.post('/', async (req, res) => {

	//console.log(req.body);
	let data = req.body;

	if (!data.title || !data.year || !data.IMDb_rating || !data.duration || !data.country || !data.oscar_nominations || !data.oscars_won ||
		!data.director || !data.starring ||
		!data.genre) {

		console.log(false);
		res.status(400).send('Invalid input ' + JSON.stringify(data, null, 2));
	}
	//console.log(true);

	const title = data.title;
	const year = data.year;
	const IMDb_rating = data.IMDb_rating;
	const duration = data.duration;
	const country = data.country;
	const oscar_nominations = data.oscar_nominations;
	const oscars_won = data.oscars_won;

	const director = data.director;

	const actors = data.starring;

	const genres = data.genre;

	let created = false;

	// NEW MOVIE
	var checkExisting = (await client.query(`SELECT * 
													FROM movie 
													LEFT JOIN director USING(directorId) 
													WHERE title LIKE '${title}'
														AND directorId IN (SELECT directorId
																			FROM director
																			WHERE name LIKE '${director.name}' AND surname LIKE '${director.surname}')
													`)).rows[0];
	if (!checkExisting) {
		console.log(true);
		created = true;
		var topMovieId = (await client.query(`SELECT MAX(movieID) FROM movie`)).rows[0].max;

		// NEW DIRECTOR
		var topDirectorId = (await client.query(`SELECT MAX(directorID) FROM director`)).rows[0].max;
		var checkExisting = (await client.query(format(`SELECT directorId FROM director WHERE name LIKE '%s' AND surname LIKE '%s'`, director.name, director.surname))).rows[0];
		if (!checkExisting) {
			await client.query(format(`INSERT INTO director (directorID, name, surname) VALUES(%s, '%s', '%s');`, topDirectorId + 1, director.name, director.surname));
			console.log("NEW DIRECTOR : " + director.name + " " + director.surname + " " + (topDirectorId + 1));
		}

		// NEW ACTOR
		for (var actor in actors) {
			var topActorId = (await client.query(`SELECT MAX(actorID) FROM actor`)).rows[0].max;
			var checkExisting = (await client.query(format(`SELECT actorId FROM actor WHERE name LIKE '%s' AND surname LIKE '%s'`, actors[actor].name, actors[actor].surname))).rows[0];
			if (!checkExisting) {
				await client.query(format(`INSERT INTO actor (actorID, name, surname) VALUES(%s, '%s', '%s');`, topActorId + 1, actors[actor].name, actors[actor].surname));
				console.log("NEW ACTOR : " + actors[actor].name + " " + actors[actor].surname + " " + (topActorId + 1));
			}
		}

		// NEW GENRE
		for (var genre in genres) {
			var topGenreId = (await client.query(`SELECT MAX(genreID) FROM genre`)).rows[0].max;
			var checkExisting = (await client.query(format(`SELECT genreId FROM genre WHERE name LIKE '%s'`, genres[genre]))).rows[0];
			if (!checkExisting) {
				await client.query(format(`INSERT INTO genre (genreID, name) VALUES(%s, '%s');`, topGenreId + 1, genres[genre]));
				console.log("NEW GENRE : " + genres[genre] + " " + (topGenreId + 1));
			}
		}

		// NEW MOVIE
		var topMovieId = (await client.query(`SELECT MAX(movieID) FROM movie`)).rows[0].max;
		await client.query(`INSERT INTO movie (movieID, title, year, rating_imdb, duration, country, oscarnom, oscars, directorId) 
												VALUES(${topMovieId + 1}, '${title}', ${year}, ${IMDb_rating}, ${duration}, '${country}', ${oscar_nominations}, ${oscars_won},
													(SELECT directorId FROM director WHERE name LIKE '${director.name}' AND surname LIKE '${director.surname}'));
												`);
		console.log("NEW MOVIE : " + title + " " + (topMovieId + 1));

		// UPDATE STARRING
		for (var actor in actors) {

			await client.query(`INSERT INTO starring (movieID, actorID)
								VALUES(
									${topMovieId + 1},
									(SELECT actorID FROM actor WHERE name LIKE '${actors[actor].name}' AND surname LIKE '${actors[actor].surname}')
								);`);
			console.log("Updated starring");
		}

		// UPDATE OFGENRE
		for (var genre in genres) {
			await client.query(`INSERT INTO ofGenre (movieID, genreID)
								VALUES(
									${topMovieId + 1},
									(SELECT genreID FROM genre WHERE name LIKE '${genres[genre]}')
								);`);
			console.log("Updated ofGenre");
		}
	}
	// OVERWRITE JSON CSV
	/*
	var jsonPOST = format(`COPY (
						SELECT json_agg(row_to_json(movies)) FROM (%s %s) movies) 
						TO 'C:/Users/Franz Joseph/Documents/GitHub/OR_0036523987/web/movies.json'`, movieDisplayQuery, groupByQuery);
	var csvPOST = format(`COPY (%s %s) 
						TO 'C:/Users/Franz Joseph/Documents/GitHub/OR_0036523987/web/movies.csv' 
						DELIMITER ',' 
						ENCODING 'utf-8' CSV HEADER`, movieDisplayQuery, groupByQuery);
	await client.query(jsonPOST);
	await client.query(csvPOST);
	*/

	if (!created) {
		var response = format(`{
            "status": "200 OK",
            "message": "Data already exists in dataset",
            "response": 
				[
					"@context" : {
						"@vocab" : "https://schema.org/",
						"title" : "title",
						"year" : "copyrightYear",
						"IMDb_rating" : "ratingValue",
						"duration" : "duration",
						"genre" : "genre",
						"country" : "countryOfOrigin",
						"oscar_nominations" : "number",
						"oscars_won" : "number",
						"director" : "director",
						"starring" : "actors"
					},
				%s]
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
            "response": 
				[
					"@context" : {
						"@vocab" : "https://schema.org/",
						"title" : "title",
						"year" : "copyrightYear",
						"IMDb_rating" : "ratingValue",
						"duration" : "duration",
						"genre" : "genre",
						"country" : "countryOfOrigin",
						"oscar_nominations" : "number",
						"oscars_won" : "number",
						"director" : "director",
						"starring" : "actors"
					},
				%s]
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

//{"title":"There Will Be No Blood","year":2021,"IMDb_rating":8.2,"duration":158,"genre":["Adventure","Drama"],"country":"USA","oscar_nominations":6,"oscars_won":2,"director":{"name" : "Mr", "surname" : "Anderson"},"starring":[{"name" : "Daniel", "surname" : "Day-Lewis"}, {"name" : "Paul", "surname" : "Dano"}, {"name" : "Christopher", "surname" : "Walken"}]}

// E) PUT
router.put('/:id', async (req, res) => {

	const id = req.params.id;
	checkId(id, req.method, res)

	const fin = req.body;

	const title = fin.title;
	const year = fin.year;
	const IMDb_rating = fin.IMDb_rating;
	const duration = fin.duration;
	const country = fin.country;
	const oscar_nominations = fin.oscar_nominations;
	const oscars_won = fin.oscars_won;

	const director = fin.director;

	const actors = fin.starring;

	const genres = fin.genre;

	const init = (await client.query(format(`%s WHERE movieId=%s %s`, movieDisplayQuery, id, groupByQuery))).rows[0];

	if (title !== init.title || year !== init.year || IMDb_rating !== init.IMDb_rating ||
		duration !== init.duration || country !== init.country ||
		genres !== init.genre || actors !== init.starring ||
		oscar_nominations !== init.oscar_nominations || oscars_won !== init.oscars_won ||
		director.name !== init.director.name || director.surname !== director.surname) {

		// NEW DIRECTOR
		if (director.name !== init.director.name || director.surname !== init.director.surname) {

			var checkExisting = (await client.query(format(`SELECT directorId FROM director WHERE name LIKE '%s' AND surname LIKE '%s'`, director.name, director.surname))).rows[0];
			if (!checkExisting) {
				var topDirectorId = (await client.query(`SELECT MAX(directorID) FROM director`)).rows[0].max;

				await client.query(format(`INSERT INTO director (directorID, name, surname) VALUES(%s, '%s', '%s');`, topDirectorId + 1, director.name, director.surname));
				console.log("NEW DIRECTOR : " + director.name + " " + director.surname + " " + (topDirectorId + 1));
			}
			console.log("UPDATED director");
		}

		// NEW ACTOR
		if (actors !== init.starring) {

			// removing previous actors...
			await client.query(`DELETE FROM starring WHERE movieid=${id}`);

			for (var actor in actors) {

				var checkExisting = (await client.query(format(`SELECT actorId FROM actor WHERE name LIKE '%s' AND surname LIKE '%s'`, actors[actor].name, actors[actor].surname))).rows[0];
				if (!checkExisting) {
					var topActorId = (await client.query(`SELECT MAX(actorID) FROM actor`)).rows[0].max;

					await client.query(format(`INSERT INTO actor (actorID, name, surname) VALUES(%s, '%s', '%s');`, topActorId + 1, actors[actor].name, actors[actor].surname));
					console.log("NEW ACTOR : " + actors[actor].name + " " + actors[actor].surname + " " + (topActorId + 1));
				}

				// UPDATE STARRING
				await client.query(`INSERT INTO starring (movieID, actorID)
								VALUES(
									${id},
									(SELECT actorID FROM actor WHERE name LIKE '${actors[actor].name}' AND surname LIKE '${actors[actor].surname}')
								);`);
				console.log("Updated starring");

			}
			console.log("UPDATED actors");
		}

		// NEW GENRE
		if (genres !== init.genre) {

			// removing previous genres...
			await client.query(`DELETE FROM ofGenre WHERE movieid=${id}`);

			for (var genre in genres) {

				var checkExisting = (await client.query(format(`SELECT genreId FROM genre WHERE name LIKE '%s'`, genres[genre]))).rows[0];
				if (!checkExisting) {
					var topGenreId = (await client.query(`SELECT MAX(genreID) FROM genre`)).rows[0].max;

					await client.query(format(`INSERT INTO genre (genreID, name) VALUES(%s, '%s');`, topGenreId + 1, genres[genre]));
					console.log("NEW GENRE : " + genres[genre] + " " + (topGenreId + 1));
				}

				// UPDATE OFGENRE
				await client.query(`INSERT INTO ofGenre (movieID, genreID)
								VALUES(
									${id},
									(SELECT genreID FROM genre WHERE name LIKE '${genres[genre]}')
								);`);
				console.log("Updated ofGenre");

			}
			console.log("UPDATED genre");
		}

		var update = format(`UPDATE movie SET title = '%s', year = %s, rating_imdb = %s, duration = %s, country = '%s', oscarNom = %s, oscars = %s, 
								directorid = (SELECT directorId FROM director WHERE name LIKE '%s' AND surname LIKE '%s')
								WHERE movieId=%s`,
			title, year, IMDb_rating, duration, country, oscar_nominations, oscars_won, director.name, director.surname, id);
		await client.query(update);
		console.log("UPDATED " + title);
	}

	// OVERWRITE JSON CSV
	/*
	var jsonPOST = format(`COPY (
		SELECT json_agg(row_to_json(movies)) FROM (%s %s) movies) 
		TO 'C:/Users/Franz Joseph/Documents/GitHub/OR_0036523987/web/movies.json'`, movieDisplayQuery, groupByQuery);
	var csvPOST = format(`COPY (%s %s) 
		TO 'C:/Users/Franz Joseph/Documents/GitHub/OR_0036523987/web/movies.csv' 
		DELIMITER ',' 
		ENCODING 'utf-8' CSV HEADER`, movieDisplayQuery, groupByQuery);
	await client.query(jsonPOST);
	await client.query(csvPOST);
	*/

	var response = format(`{
        "status": "200 OK",
        "message": "Request successful",
        "response": 
			[
				"@context" : {
					"@vocab" : "https://schema.org/",
					"title" : "title",
					"year" : "copyrightYear",
					"IMDb_rating" : "ratingValue",
					"duration" : "duration",
					"genre" : "genre",
					"country" : "countryOfOrigin",
					"oscar_nominations" : "number",
					"oscars_won" : "number",
					"director" : "director",
					"starring" : "actors"
				},
			%s]
    }`, fin);

	response = JSON.parse(response);
	res.status(200).send(response);
});

// F) DELETE
router.delete('/:id', async (req, res) => {
	res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");

	const id = req.params.id;
	checkId(id, req.method, res);

	await client.query(`DELETE FROM starring WHERE movieId=${id};`);
	console.log("Updated starring");

	await client.query(`DELETE FROM ofGenre WHERE movieId=${id};`);
	console.log("Updated ofGenre");

	await client.query(`DELETE FROM movie WHERE movieId=${id};`);
	console.log("DELETED movie " + id);

	var response = {
		"status": "200 OK",
		"message": "Movie with the provided id successfully deleted",
		"response": null
	};

	// OVERWRITE JSON CSV
	/*
	var jsonPOST = format(`COPY (
		SELECT json_agg(row_to_json(movies)) FROM (%s %s) movies) 
		TO 'C:/Users/Franz Joseph/Documents/GitHub/OR_0036523987/web/movies.json'`, movieDisplayQuery, groupByQuery);
	var csvPOST = format(`COPY (%s %s) 
		TO 'C:/Users/Franz Joseph/Documents/GitHub/OR_0036523987/web/movies.csv' 
		DELIMITER ',' 
		ENCODING 'utf-8' CSV HEADER`, movieDisplayQuery, groupByQuery);
	await client.query(jsonPOST);
	await client.query(csvPOST);
	*/

	res.status(200).send(response);

});

// function
async function checkId(id, method, res) {
	const idArr = (await client.query('SELECT movieId FROM movie')).rows[0];

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

	for (var arrID in idArr)
		if (arrID == id) {
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