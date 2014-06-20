var helper = require( './helper' );
var Q = require( 'q' );
var EC2util = require( './ec2' );

var EIP = function( aws ) {
    this.aws = aws;
    this.ec2 = new aws.EC2();
};

EIP.prototype = {
    list: function( showBorders ) {
        var ec2util = new EC2util( this.aws );
        var ec2 = this.ec2;
        
        Q.allSettled([
            this.findEntity(),
            ec2util.findEntity()
        ]).then( function( resp ) {
            var addresses = resp[0].value;
            var instances = resp[1].value;
                
            if ( addresses.length === 0 ) return console.log( 'No Elastic IP addresses.' );
            
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

            var table = helper.table( 
		['Allocation ID', 'Public IP', 'Association ID', 'Instance'],
		showBorders );

            addresses.forEach( function( address ) {
                table.push([
                    address.AllocationId,
                    address.PublicIp,
                    address.AssociationId ? address.AssociationId : 'Not associated',
                    address.InstanceId ? instanceMap[address.InstanceId] : 'Not associated'
                ]);
            });

            console.log( table.toString() );
        });
    },
    allocate: function() {
        this.ec2.allocateAddress( {}, function( err ) {
            if ( err ) return helper.err( err );
        });
    },
    release: function( ip ) {
        var ec2 = this.ec2;
        this.findEntity({
            ip: ip 
        }).then( function( address ) {
            ec2.releaseAddress({
                AllocationId: address[0].AllocationId 
            }, function( err ) {
                if ( err ) helper.err( err );
            });
        });
    },
    associate: function( ip, instance ) {
        var ec2util = new EC2util( this.aws );
        var ec2 = this.ec2;
        
        Q.allSettled([
            this.findEntity( { ip: ip } ),
            ec2util.findEntity( { name: instance } )
        ]).then( function( resp ) {
            ec2.associateAddress({
                AllocationId: resp[0].value[0].AllocationId,
                InstanceId: resp[1].value[0].InstanceId
            }, function( err ) {
                if ( err ) return helper.err( err );
            });
        });
    },
    disassociate: function( ip ) {
        var ec2 = this.ec2;
        this.findEntity({ 
            ip: ip 
        }).then( function( address ) {
            ec2.disassociateAddress({ 
                AssociationId: address[0].AssociationId 
            }, function( err ) {
                if ( err ) return helper.err( err );
            });
        });
    },
    findEntity: function( identifier ) {
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
                    helper.err( err );
                    deferred.reject( err );
                } else {
                    deferred.resolve( data.Addresses );
                }
            });
            
        return deferred.promise;
    }
};

module.exports = EIP;