var colors = require( 'colors' );

exports.err = function( err ) {
    var code = err.code;
    console.log( '%s %s', code.red, err.message );
};