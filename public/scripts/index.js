// JS File for Index View
function handleShortenForm(e) {
	e.preventDefault();
	const url = e.target[0].value;
	const slug = e.target[1].value;

	const options = {
		method: 'POST',
		body: JSON.stringify({ url, slug }),
		headers: {
			'Content-Type': 'application/json',
		},
	};

	fetch('/url', options)
		.then((res) => res.json())
		.then((data) => {
			document.querySelector('#response').innerHTML = JSON.stringify(data)
				.replaceAll('",', '",<br />&#9;')
				.replaceAll(/({|})/g, '<br />$1<br />&#9;')
				.replace(
					/"slug":"[a-zA-Z0-9\-_]+"/g,
					`"slug": <a href='/${data.slug}'>${data.slug}</a>`
				);
		});
}

document
	.querySelector('#url-create-form')
	.addEventListener('submit', handleShortenForm);
