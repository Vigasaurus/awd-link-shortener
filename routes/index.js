const express = require('express');
const router = express.Router();
const flash = require('express-flash');
const sql = require('mssql');
const path = require('path');
const fetch = require('node-fetch');
const yup = require('yup');
const { nanoid } = require('nanoid');

const requestSchema = yup.object().shape({
	slug: yup
		.string()
		.trim()
		.matches(/[a-zA-Z0-9\-_]/),
	url: yup.string().trim().url().required(),
});

router.get('/', function (req, res) {
	res.render('index');
});

router.post('/url', async (req, res, next) => {
	let { slug, url } = req.body;
	let replaced = false;
	try {
		slug = slug || nanoid(8);

		const validation = await requestSchema.validate({
			slug,
			url,
		});

		let isExistingSlug = (
			await new sql.Request()
				.input('slug', sql.VarChar, slug)
				.query('SELECT * FROM "shortened-urls" WHERE slug = @slug')
		).rowsAffected[0];

		while (isExistingSlug > 0) {
			slug = nanoid(8);
			replaced = true;
			isExistingSlug = (
				await new sql.Request()
					.input('slug', sql.VarChar, slug)
					.query('SELECT * FROM "shortened-urls" WHERE slug = @slug')
			).rowsAffected[0];
		}

		const insertRow = await new sql.Request()
			.input('slug', sql.VarChar, slug)
			.input('url', sql.VarChar, url)
			.query('INSERT INTO "shortened-urls" (slug,url) VALUES (@slug,@url)');

		if (insertRow.rowsAffected[0] > 0) {
			res.json({
				slug,
				url,
				message: replaced
					? 'Your short URL was taken, a new one was generated!'
					: undefined,
			});
		} else {
			res.status(500).json({
				message:
					'Something went wrong and your shortened URL was not saved, please try again!',
			});
		}
	} catch (error) {
		console.log(error);
		res.status(500).json(error);
	}
});

router.get('/:id', async (req, res, next) => {
	const slug = req.params.id;
	const foundItem = await new sql.Request()
		.input('slug', sql.VarChar, slug)
		.query('SELECT * FROM "shortened-urls" WHERE slug = @slug');

	const foundUrl = foundItem.rowsAffected[0] ? foundItem.recordset[0] : null;

	if (foundUrl) {
		res.redirect(foundUrl.url);
	} else {
		res.render('not-found', { slug });
	}
});

module.exports = router;
