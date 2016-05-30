
var path = require('path');
var app = require('express')();
var cons = require('consolidate');

//----------------------------------------------------

var PORT = 9097;

//----------------------------------------------------

var errorer = ( code, msg ) =>
    res.status( err.code ).send( err.msg );

var errorerer = ( req, res ) => err => 
    errorer( err.code, err.msg );

var promiser = promise => ( req, res, next ) => 
    promise
	.then( data => { res.data = data; next(); } )
	.catch( errorerer( req, res ) );

var sender = ( req, res ) =>
    res.send( res.data );

//----------------------------------------------------

var renderror = ( req, res ) => err =>
    res.render( "panel/error.html", err );

// TODO: wrap html in panel
var panel = html => html;

var paneler = ( req, res ) => ( err, html ) =>
    err 
	? renderror( req, res )( { code: 500, msg: err } )
	: res.status( 200 ).send( panel( html ) );
    
var renderer = ( req, res ) => template_file =>
    app.render( template_file, req.query, paneler( req, res ) );

app.engine('hbs',cons.handlebars);
app.engine('handlebars',cons.handlebars);
app.engine('ms',cons.mustache);
app.engine('mustache',cons.mustache);
app.engine('jade',cons.jade);
app.engine('pug',cons.pug);

var annex = require('aiport-annex');
var annexer = annex_name => ( req, res, next ) => annex( annex_name ).then( renderer( req, res ) ).catch( renderror( req, res ) );
app.get( "/!/admin", annexer('home') );
app.get( "/!/admin/:annex", ( req, res, next ) => annexer( req.params.annex )( req, res, next ) );

// var scaffold = require('aiport-scaffold');
// TODO: scaffold will hold current scaffold info in aiport-pile-scaffold, which is controlled by aiport-annex-scaffold

//----------------------------------------------------

var pile = require('aiport-pile');
app.get( "/pile/:pile", ( req, res, next ) => promiser( pile( req.params.pile ).fetch( req.query ) )( req, res, next ), sender );

var package = require('aiport-package');
app.get( "/package/installed", promiser( Promise.resolve( package.installed() ) ), sender );
app.get( "/package/available", promiser( package.available() ), sender );
app.post( "/package/install/:type/:name", ( req, res, next ) => promiser( package.install( req.params.type, req.params.name ) )( req, res, next ), sender );

//----------------------------------------------------

app.listen( PORT, () => console.log( "aiport listening on port " + PORT ) );
