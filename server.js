
var _ = require('underscore');
var app = require('express')();

//----------------------------------------------------

var PORT = 9097;

//----------------------------------------------------

var errorer = ( code, msg ) =>
    res.status( err.code ).send( err.msg );

var errorerer = ( req, res ) => ( err ) => 
    errorer( err.code, err.msg );

var promiser = promise => ( req, res, next ) => 
    promise
	.then( data => { res.data = data; next() } )
	.catch( errorerer( req, res ) );

var sender = ( req, res ) =>
    res.send( res.data );

//----------------------------------------------------

var pile = require('aiport-pile');
app.get( "/pile/:pile_name", promiser( pile( req.params.id ).fetch( req.query ) ), sender );

var package = require('aiport-package');
app.get( "/packages/installed", promiser( package.installed() ), sender );
app.get( "/packages/available", promiser( package.available() ), sender );
app.post( "/package/install/:type/:name", promiser( package.install( req.params.type, req.params.name ) ), sender );

//----------------------------------------------------

app.listen( PORT, () => console.log( "aiport listening on port " + PORT ) );
