var colors = require( 'colors' );

exports.err = function( err ) {
    if ( err ) {
        var code = err.code;
        console.log( '%s %s', code.red, err.message );
        return true;
    }
};