var colors = require( 'colors' );
var Table = require( 'cli-table' );

var commonInterface = {
    table: {},
    message: {}
}

exports.err = function( err ) {
    var code = err.code;
    console.log( '%s %s', code.red, err.message );
};

exports.printTable = function( tbl, hasBorders ) {
    var chars = {};
    var formattedHead = [];

    tbl.head.forEach( function( th ) {
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

    var table = new Table({
	chars: chars,
	head: formattedHead
    });

    tbl.rows.forEach( function( row ) {
	table.push( row );
    });

    console.log( table.toString() );
};