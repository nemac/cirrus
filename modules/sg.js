var helper = require( './helper' );

var SG = function ( aws ) {
    this.ec2 = new aws.EC2();
};

SG.prototype = {
    list: function( showBorders ) {
	this.ec2.describeSecurityGroups( {}, function( err, data ) {
	    var groups = data.SecurityGroups;

	    if ( groups.length === 0 ) return console.log( 'No security groups.' );

	    var table = helper.table(
		['Group ID', 'Group Name', 'Inbound rules', 'Outbound rules'],
		showBorders );

	    groups.forEach( function( group ) {
		table.push([
		    group.GroupId,
		    group.GroupName,
		    summarizeIpRules( group.IpPermissions ),
		    summarizeIpRules( group.IpPermissionsEgress )
		]);

	    });

	    console.log( table.toString() );
	});
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