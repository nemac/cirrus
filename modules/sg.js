var Q = require( 'q' );

var SG = function ( aws ) {
    this.ec2 = new aws.EC2();
};

SG.prototype = {
    list: function() {
	var deferred = Q.defer();
	this.ec2.describeSecurityGroups( {}, function( err, data ) {
	    if ( err )  return deferred.reject( err );

	    var response = {
		message: ''
	    };

	    var groups = data.SecurityGroups;

	    if ( groups.length === 0 ) {
		response.message = 'No security groups.';
		return deferred.resolve( response );
	    }

	    response.table = {
		head: [
		    'Group ID', 
		    'Group Name', 
		    'Inbound rules', 
		    'Outbound rules' ],
		rows: []
	    };

	    groups.forEach( function( group ) {
		response.table.rows.push([
		    group.GroupId,
		    group.GroupName,
		    summarizeIpRules( group.IpPermissions ),
		    summarizeIpRules( group.IpPermissionsEgress )
		]);
	    });
		
	    deferred.resolve( response );
	});

	return deferred.promise;
    }
};

function summarizeIpRules( rules ) {
    var ports = [];

    rules.forEach( function ( ip ) {
	var portString =  'All ports ->';
	if ( ip.IpProtocol !== '-1' ) {
	    portString = ip.IpProtocol + ':' + ip.ToPort + ' -> '; 
	}
	
	var ranges = [];
	ip.IpRanges.forEach( function ( r ) {
	    ranges.push( r.CidrIp );
	});

	portString += ranges.join( ',' );
	ports.push( portString );
    });

    return ports.join( '\n' );
}

module.exports = SG;