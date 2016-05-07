
var pile = require('aiport-pile');

module.exports = ( query, params ) => 
    pile( params[0] ).fetch( query );
