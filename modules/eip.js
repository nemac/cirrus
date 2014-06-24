var Q = require( 'q' );
var EC2util = require( './ec2' );

var EIP = function( aws ) {
    this.aws = aws;
    this.ec2 = new aws.EC2();
};

EIP.prototype = {
    list: function() {
	var deferred = Q.defer();
        var ec2util = new EC2util( this.aws );
        var ec2 = this.ec2;
        
        Q.allSettled([
            this.findEntities(),
            ec2util.findEntities()
        ]).then( function( resp ) {
	    var rejectReason = findIfHasRejectReason( resp );
	    if ( rejectReason !== null ) return deferred.reject( rejectReason );

	    var response = {
		message: ''
	    };
	    
            var addresses = resp[0].value;
            var instances = resp[1].value;
                
            if ( addresses.length === 0 ) {
		response.message = 'No Elastic IP addresses.';
		return deferred.resolve( message );
	    }

	    response.table = {
		head: [
		    'Allocation ID', 
		    'Public IP', 
		    'Association ID', 
		    'Instance' ],
		rows: []
	    };
            
            // map instances to addresses
            var instanceMap = {};
            instances.forEach( function( instance ) {
                instance.Tags.some( function( tag ) {
                    if ( tag.Key === 'Name' ) {
                        instanceMap[instance.InstanceId] = tag.Value;
                        return true;
                    }
                });
            });

            addresses.forEach( function( address ) {
                response.table.rows.push([
                    address.AllocationId,
                    address.PublicIp,
                    address.AssociationId ? address.AssociationId : 'Not associated',
                    address.InstanceId ? instanceMap[address.InstanceId] : 'Not associated'
                ]);
            });

	    deferred.resolve( response );
        });

	return deferred.promise;
    },
    allocate: function() {
	var deferred = Q.defer();
        this.ec2.allocateAddress( {}, function( err ) {
            if ( err ) return deferred.reject( err );
	    deferred.resolve();
        });

	return deferred.promise;
    },
    release: function( ip ) {
	var deferred = Q.defer();
        var ec2 = this.ec2;
        this.findEntities({
            ip: ip 
        }).then( function( addresses ) {
            ec2.releaseAddress({
                AllocationId: addresses[0].AllocationId 
            }, function( err ) {
		if ( err ) return deferred.reject( err );
		deferred.resolve();
            });
        }).fail( function( err ) {
	    deferred.reject( err );
	});

	return deferred.promise;
    },
    associate: function( ip, instance ) {
	var deferred = Q.defer();
        var ec2util = new EC2util( this.aws );
        var ec2 = this.ec2;
        
        Q.allSettled([
            this.findEntities({ ip: ip }),
            ec2util.findEntities({ name: instance })
        ]).then( function( resp ) {
	    var rejectReason = findIfHasRejectReason( resp );
	    if ( rejectReason !== null ) return deferred.reject( rejectReason );

            ec2.associateAddress({
                AllocationId: resp[0].value[0].AllocationId,
                InstanceId: resp[1].value[0].InstanceId
            }, function( err ) {
		if ( err ) return deferred.reject( err );
		deferred.resolve();
            });
        })

	return deferred.promise;
    },
    disassociate: function( ip ) {
	var deferred = Q.defer();
        var ec2 = this.ec2;
        this.findEntities({ 
            ip: ip 
        }).then( function( addresses ) {
            ec2.disassociateAddress({ 
                AssociationId: addresses[0].AssociationId 
            }, function( err ) {
		if ( err ) return deferred.reject( err );
		deferred.resolve();
            });
        }).fail( function( err ) {
	    deferred.reject( err );
	});

	return deferred.promise;
    },
    findEntities: function( identifier ) {
        var params = {};
        
        if ( typeof identifier !== 'undefined' && identifier !== null ) {
            // TODO: potentially add more keys
        
            if ( identifier.hasOwnProperty( 'ip' ) ) {
                params = { PublicIps: [ identifier.ip.toString() ] };
            }
        }

        var deferred = Q.defer();
        this.ec2.describeAddresses( 
            params, 
            function( err, data ) {
                if ( err ) {
                    deferred.reject( err );
                } else {
                    deferred.resolve( data.Addresses );
                }
            });
            
        return deferred.promise;
    }
};

function findIfHasRejectReason( resp ) {
    var rejectReason = null;
    resp.some( function( r ) {
	if ( r.state === 'rejected' ) {
	    rejectReason = r.reason;
	}
    });

    return rejectReason;
}

module.exports = EIP;