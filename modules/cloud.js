var Q = require( 'q' );
var fs = require( 'fs' );
var colors = require( 'colors' );

var EC2 = require( './ec2' );
var EIP = require( './eip' );
var EBS = require( './ebs' );
var helper = require( './helper' );

var Cloud = function( aws ) {
    this.aws = aws;
    this.ec2Util = new EC2( aws );
    this.eipUtil = new EIP( aws );
    this.ebsUtil = new EBS( aws );
};

// TODO ebs
Cloud.prototype = {
    describe: function( writeFile ) {
	var deferred = Q.defer();
	var infrastructure = {
	    ec2: [],
	    eip: [],
	    ebs: []
	};

	Q.allSettled([
	    this.ec2Util.list(),
	    this.eipUtil.list()
	    //this.ebsUtil.list()
	]).then( function( responses ) {
	    infrastructure.ec2 = responses[0].value.data;
	    infrastructure.eip = responses[1].value.data;
	    //infrastructure.ebs = responses[2].value.data;

	    // TODO make the caller responsible for stringifying and writing the file
	    var infrastructureString = JSON.stringify( infrastructure, null, 2 );
	    if ( writeFile ) {
		fs.writeFile( writeFile, infrastructureString, function( err ) {
		    if ( err ) {
			deferred.reject( err );
		    } else {
			deferred.resolve();
		    }
		});
	    } else {
		deferred.resolve({ data: infrastructure });
	    }
	});
	
	return deferred.promise;
    },
    validateConfig: function( entities ) {
	var deferred = Q.defer();
	var malformedElements = [];

	elementTypes.forEach( function( type ) {
	    entities[type].forEach( function ( entity ) {
		var missingKeys = objectIsWellFormed( entity, keys[type] );
		if ( missingKeys.length > 0 ) {
		    malformedElements.push({
			entity: entity,
			missingKeys: missingKeys
		    });
		}
	    });
	});

	if ( malformedElements.length > 0 ) {
	    deferred.reject({
		code: 'Configuration is malformed',
		message: 'Error output:\n' + JSON.stringify( malformedElements, null, 2 )
	    });
	} else {
	    deferred.resolve();
	}

	return deferred.promise;
    },
    diff: function( entitiesInConfig ) {
	var deferred = Q.defer();
	var t = this;

	// first, check if config is well formed
	this.validateConfig( entitiesInConfig )
	    .then( function() {
		t.describe()
	        .then( function( response ) {
		    var entitiesInCloud = response.data;
		    var differenceReport = {};
		    elementTypes.forEach( function( type ) {
			entitiesInConfig[type].forEach( function( entity ) {
			    var comp = compareObjectToObjects( entity, entitiesInCloud[type], type );
			    if ( comp.status !== 'same' ) {
				if ( !differenceReport.hasOwnProperty( type ) ) differenceReport[type] = [];
				differenceReport[type].push( comp );
			    }
			});
		    });

		    if ( helper.isEmptyObject( differenceReport ) ) {
			deferred.resolve();
		    } else {
			var response = {
			    table: {
				head: [
				    'Entity',
				    'Status',
				    'Element',
				    'Detail'
				],
				rows: []
			    },
			    data: differenceReport
			};

			for ( var entity in differenceReport ) {
			    if ( differenceReport.hasOwnProperty( entity ) ) {
				differenceReport[entity].forEach( function( element ) {
				    if ( element.status === 'new' ) {
					response.table.rows.push([
					    entity,
					    element.status.green,
					    element.element.hasOwnProperty( 'name' ) ? element.element.name : 'Will be added',
					    JSON.stringify( element.element, null, 2 )
					]);
				    } else {
					var diff = [];
					// each element may have multiple differences if not new
					element.differences.forEach( function( d ) {
					    diff.push( d.key + ': ' + d.b + ' ==> ' + d.a  );
					});

					response.table.rows.push([
					    entity,
					    element.status.yellow,
					    element.element.hasOwnProperty( 'name' ) ? element.element.name : element.element,
					    diff.join('\n')
					]);   
				    }
				});
			    }
			};

			deferred.resolve( response );
		    }
		    


		}).fail( function( err ) {
		    deferred.reject( err );
		});
	    }).fail( function( err ) {
		deferred.reject( err );
	    });

	return deferred.promise;
    }
};

function compareObjectToObjects( obj, objArr, type ) {
    var report = {
	status: '',
	element: obj,
	differences: []
    };

    var counterpart = null;

    objArr.some( function( o ) {
	if ( counterpartComparison[type]( obj, o ) ) {
	    counterpart = o;
	    return true;
	}
    });
    
    if ( counterpart !== null ) {
	var comparison = identicalComparison( obj, counterpart, keys[type] );
	if ( comparison.length > 0 ) {
	    report.status = 'different';
	    report.differences = comparison;
	} else {
	    report.status = 'same';
	}
    } else {
	report.status = 'new';
    }

    return report;
}

var counterpartComparison = {
    ec2: function( a, b ) {
	return a.name === b.name;
    },
    eip: function( obj ) {
	return obj.ip && obj.instance || JSON.stringify( obj );
    },
    ebs: function( obj ) {

    }
};

function objectIsWellFormed( obj, keys ) {
    var missingKeys = [];

    keys.forEach( function( key ) {
	if ( !obj.hasOwnProperty( key ) ) {
	    missingKeys.push( key );
	}
    });

    return missingKeys;
}

function identicalComparison( a, b, keys ) {
    var report = [];
    keys.forEach( function( key ) {
	var isIdentical = true;

	if ( a[key] instanceof Array ) {
	    isIdentical = helper.arraysIdentical( a[key], b[key] );
	} else {
	    isIdentical = a[key] === b[key];
	}

	if ( !isIdentical ) {
	    report.push({
		key: key,
		a: a[key],
		b: b[key]
	    });
	}

    });

    return report;
}

var elementTypes = [ 'ec2' ];

var keys = {
    ec2: ['name', 'type', 'key', 'groups', 'image'],
    eip: ['ip', 'instance'],
    ebs: []
};

module.exports = Cloud;