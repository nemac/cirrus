var colors = require( 'colors' );
var Table = require( 'cli-table' );

exports.err = function( err ) {
    var code = err.code;
    console.log( '%s %s', code.red, err.message );
};

exports.table = function( head, hasBorders ) {
    var chars = {};
    var formattedHead = [];

    head.forEach( function( th ) {
	formattedHead.push( th.cyan );
    });


    if ( hasBorders ) {
    } else {
	chars = { 
	    'top': '',
	    'top-mid': '',
	    'top-left': '',
	    'top-right': '',
	    'bottom': '',
	    'bottom-mid': '',
	    'bottom-left': '',
	    'bottom-right': '',
	    'left': '',
	    'left-mid': '',
	    'mid': '',
	    'mid-mid': '',
	    'right': '',
	    'right-mid': '',
	    'middle': ''
	};
    }

    return new Table({
	chars: chars,
	head: formattedHead
    });
};