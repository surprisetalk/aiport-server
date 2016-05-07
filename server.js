
var app = require('express')();
var api = require('api.js');

var PORT = 9097;

app.get( "/pile/:pile_name/*", api.pile.get );

app.listen( PORT, () => console.log( "aiport listening on port " + PORT ); );
