require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const yup = require('yup');
const { nanoid } = require('nanoid');
const Url = require('./models/Url');

const requestSchema = yup.object().shape({
	slug: yup.string().trim().matches(/[a-zA-Z0-9\-_]/),
	url: yup.string().trim().url().required()
});

const app = express();
const restrictedSlugs = ['url', 'not-found'];

mongoose.connect('mongodb://localhost:27017/awd-link-shortener', {useNewUrlParser: true, useUnifiedTopology: true});

app.use(express.json());
app.use(express.static('./public', {extensions:['html']}));

app.post('/url', async (req, res, next) => {
	let { slug, url } = req.body;
	let replaced = false;
	try {
		slug = slug || nanoid(8);

		await requestSchema.validate({
			slug, url
		});

		let existingUrls = await Url.find({slug});

		while (existingUrls.length || restrictedSlugs.includes(slug)) {
			slug = nanoid(8);
			existingUrls = await Url.find({slug});
			replaced = true;
		}

		const savedUrl = new Url({url, slug});
		await savedUrl.save();

		res.json({ slug, url, message: replaced ? 'Your short URL was taken, a new one was generated!' : undefined });
	} catch (error) {
		next(error);
	}
});

app.get('/:id', async (req, res, next) => {
	const foundUrl = await Url.findOne({slug: req.params.id});

	if (restrictedSlugs.includes(req.params.id))
	{
		next();
		return;
	}

	if (foundUrl) {
		res.redirect(foundUrl.url);
	} else {
		res.redirect('/not-found');
	}

	next();
});

app.use((error, req, res, next) => {
	if (error.status)
		res.status(error.status);
	else
		res.status(500);
	res.json({
		message: error.message,
		stack: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : error.stack
	});
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`Live at http://localhost:${port}`);
});

