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

exports.isEmptyObject = function( obj ) {
    for ( var prop in obj ) {
	if ( obj.hasOwnProperty( prop ) ) {
	    return false;
	}

	return true;
    }
}

exports.arraysIdentical = arraysIdentical;

function arraysIdentical( a, b ) {
    if ( a.length !== b.length ) {
	return false;
    }

    for ( var i = 0; i < a.length; i++ ) {
        if ( a[i] instanceof Array && b[i] instanceof Array) {
            if ( !arraysIdentical( a[i], b[i] ) )
                return false;
        }
        else if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}