
var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var express = require('express');
var cons = require('consolidate');
var himalaya = require('himalaya');
var body_parser = require('body-parser');

var package = require('../aiport-package/package.js');
var annex = require('../aiport-annex/annex.js');
var scrap = require('../aiport-scrap/scrap.js');
var pile = require('../aiport-pile/pile.js');
var page = require('../aiport-page/page.js');

//----------------------------------------------------

var app = express();

//----------------------------------------------------

var PORT = 9097;

//----------------------------------------------------

app.use(express.static('public'));
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: false }));
// app.use((req,res,next)=>{console.log(req.params,req.body);next();});

//----------------------------------------------------

var tap = data => { console.log( data ); return data; };

var errorer = ( req, res ) => ( code, msg ) =>
    res.status( code ).send( msg );

var errorerer = ( req, res ) => err => 
    errorer( req, res )( "code" in err ? err.code : 500, "msg" in err ? err.msg : "something went wrong" );

var promiser = promise => ( req, res, next ) => 
    promise
	.then( data => { res.data = data; next(); } )
	.catch( errorerer( req, res ) );

var sender = ( req, res ) =>
    res.setHeader("Access-Control-Allow-Origin", "*")
    || res.send( res.data );

//----------------------------------------------------

app.set('views', __dirname );
app.engine('jade',cons.jade);

var renderror = ( req, res ) => err =>
    res.render( "panel/error.jade", err );

//----------------------------------------------------

// TODO: eventually move this into pager?

// TODO: don't use abs path
var dir_exists = dir => { try { fs.accessSync(dir, fs.F_OK); return true; } catch(e) { return false; } };
var annexes = package.installed().annex;
for( var i in annexes )
    if( dir_exists( "../aiport-annex-" + annexes[i] + "/public" ) )
        app.use( "/!/admin/annex/" + annexes[i] + "/public", express.static( "../aiport-annex-" + annexes[i] + "/public" ) );

var renderer = ( req, res ) => body =>
    res.render( "panel.jade", { body: body, annexes: package.installed().annex } );

var annexer = ( req, res, next ) => 
    // console.log( req.params.annex, req.path.split('/').slice(4), req.query ) ||
    annex( req.params.annex, req.path.split('/').slice(4), req.query )
	.then( renderer( req, res ) )
	.catch( renderror( req, res ) );
app.get( "/!/admin", ( req, res ) => app.render( "panel/home.jade", req.query, ( err, html ) => err ? renderror( req, res )( err ) : renderer( req, res )( html ) ) );
app.get( "/!/admin/:annex", annexer );
app.get( "/!/admin/:annex/*", annexer );

//----------------------------------------------------

// TODO: add subpile support! 
// TODO: add socket support! will keep client updated with query

var piler = ( express_method, pile_method, req_member ) => 
    app[ express_method ]( "/pile/:pile", ( req, res, next ) => promiser( pile( req.params.pile )[ pile_method ]( req[ req_member ] ) )( req, res, next ), sender );

piler( "get",    "fetch",  "query" );
piler( "post",   "create", "body"  );
piler( "put",    "update", "body"  );
piler( "delete", "remove", "body"  );

app.post( "/pile/:pile/:method", ( req, res, next ) => promiser( pile( req.params.pile )[ req.params.method ]( req.query ) )( req, res, next ), sender );

//----------------------------------------------------

app.get( "/package/installed", promiser( Promise.resolve( package.installed() ) ), sender );
app.get( "/package/available", promiser( package.available() ), sender );
app.post( "/package/install/:type/:name", ( req, res, next ) => promiser( package.install( req.params.type, req.params.name ) )( req, res, next ), sender );
app.post( "/package/uninstall/:type/:name", ( req, res, next ) => promiser( package.uninstall( req.params.type, req.params.name ) )( req, res, next ), sender );

//----------------------------------------------------

// TODO: error handling

var scrapper = ( name, options ) =>
    scrap( name )( options, () => Promise.resolve('<div scraphole></div>') );

var scrapperer = ( req, res ) =>
    scrapper( req.params.scrap, req.body )( req.query )
        .then( html => himalaya.parse( html ) )
        .then( json => res.send( json ) ) 
        .catch( renderror( req, res ) );

app.post( "/scrap/json/:scrap", scrapperer );

//----------------------------------------------------

// TODO: this will use aiport-page, which uses aiport-pile-page to transform a query into html

// TODO: this might not use res.render because we're creating the pages dynamically
var pager = ( req, res ) => 
    page( req.path.split('/'), req.query )
	// .then( p => res.render( p.template, p.data ) )
        .then( html => res.send( html ) )
	.catch( renderror( req, res ) );

app.get( "/*", pager );

//----------------------------------------------------

app.listen( PORT, () => console.log( "aiport listening on port " + PORT ) );
