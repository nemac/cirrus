var helper = require( './helper' );

var EIP = function( aws ) {
    this.ec2 = new aws.EC2();
};

EIP.prototype = {
    list: function( showBorders ) {
        this.ec2.describeAddresses( {}, function( err, data ) {
            if ( err ) return helper.err( err );

            var addresses = data.Addresses;
            
            if ( addresses.length === 0 ) return console.log( 'No Elastic IP addresses.' );
            
            var table = helper.table( 
		['Allocation ID', 'Public IP', 'Association ID', 'Instance'],
		showBorders );

            addresses.forEach( function( address ) {
                table.push([
                    address.AllocationId,
                    address.PublicIp,
                    address.AssociationId ? address.AssociationId : 'Not associated',
                    address.InstanceId ? address.InstanceId : 'Not associated'
                ]);
            });

            console.log( table.toString() );
        });
    },
    allocate: function() {
        this.ec2.allocateAddress( {}, function( err, data) {
            if ( err ) return helper.err( err );
        });
    },
    release: function( arg ) {
	if ( arg.indexOf( '.' ) === -1 ) {
	    releaseIp( this.ec2, arg );
	} else {
	    findEntityByIp( this.ec2, arg, 'AllocationId', releaseIp );
	}
    },
    associate: function( allocationId, instance ) {
        var params = {
            AllocationId: allocationId,
            InstanceId: instance
        };
        
        this.ec2.associateAddress( params, function( err, data ) {
            if ( err ) return helper.err( err );
        });
    },
    disassociate: function( associationId ) {
        this.ec2.disassociateAddress( { AssociationId: associationId }, function( err, data ) {
            if ( err ) return helper.err( err );
        });
    }
};

function findEntityByIp( ec2, ip, key, callback ) {
    ec2.describeAddresses( { PublicIps: [ ip.toString() ] }, function( err, data ) {
	if ( err ) {
	    helper.err( err );
	    process.exit( 1 );
	} else {
	    callback( ec2, data.Addresses[0][key] );
	}
    });
}

function releaseIp( ec2, allocationId ) {
    ec2.releaseAddress( { AllocationId: allocationId }, function( err, data ) {
        if ( err ) {
	    helper.err( err );
	    process.exit( 1 );
	}
    });
}

function associateIp( ec2, allocationId, instanceId ) {

}

module.exports = EIP;