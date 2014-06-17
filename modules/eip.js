var helper = require( './helper' );
var Table = require( 'cli-table' );

var EIP = function( aws ) {
    this.ec2 = new aws.EC2();
};

EIP.prototype = {
    list: function() {
        this.ec2.describeAddresses( {}, function( err, data ) {
            if ( err ) return helper.err( err );

            var addresses = data.Addresses;
            
            if ( addresses.length === 0 ) return console.log( 'No Elastic IP addresses.' );
            
            var table = new Table({
                head: [
                    'Allocation ID'.cyan,
                    'Public IP'.cyan,
                    'Association ID'.cyan,
                    'Instance'.cyan
                ]
            });

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
    release: function( allocationId ) {
        this.ec2.releaseAddress( { AllocationId: allocationId }, function( err, data ) {
            if ( err ) return helper.err( err );
        });
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

module.exports = EIP;