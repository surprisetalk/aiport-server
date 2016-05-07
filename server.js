
var _ = require('underscore');
var app = require('express')();
var api = require('api.js');

var PORT = 9097;

var errorer = ( code, msg )
    res.status( err.code ).send( err.msg );

var errorerer = ( req, res ) => ( err ) => 
    errorer( err.code, err.msg );

var promiser = ( promise ) => ( req, res, next ) => 
    promise
	.then( data => { res.data = data; next() } )
	.catch( errorerer( req, res ) );

var apier = ( req, res ) =>
    _.isArray( req.params ) && app.params.length 
	? _.has( api, req.params[0] ) 
	    ? promiser( api[ req.params[0] ]( req.query, _.drop( req.params ) ) ) 
	    : errorer( 404, "'" + req.params[0] + "' is not a valid api endpoint"  )
	: errorer( 500, "problem parsing the request parameters" );

app.all( "*", apier );

app.listen( PORT, () => console.log( "aiport listening on port " + PORT ); );
