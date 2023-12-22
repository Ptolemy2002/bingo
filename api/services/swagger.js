const swaggerAutogen = require('swagger-autogen')();

const outputFile = './swagger_output.json';
const endpointsFiles = [
	'routes/api/v1/index.js',
	'routes/api/v1/spaces.js'
];

const doc = {
	  info: {
		version: "1.0.0",
		title: "Bingo API",
		description: "Documentation of the Bingo API",
	  },
	  host: "localhost:8080",
	  basePath: "/api/v1",
	  schemes: ["http", "https"],
	  consumes: ["application/json"],
	  produces: ["application/json"],
};

swaggerAutogen(outputFile, endpointsFiles, doc);