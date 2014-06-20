var helper = require( './helper' );
var Q = require( 'q' );

var EC2 = function( aws ) {
    this.ec2 = new aws.EC2();
};

EC2.prototype = {
    list: function( showBorders ) {
        this.findEntities(
            //all
        ).then( function( instances ) {
            if ( instances.length === 0 ) return console.log( 'No EC2 instances.' );
           
            // check if tags other than name
	    var hasTags = false;
	    instances.some( function( instance ) {
		return hasTags = instance.Tags.length > 1;
	    });

	    var head = ['ID', 'Name', 'Type', 'State', 'Public IP', 'Key Name', 'Security Groups'];

	    if ( hasTags ) head.splice( 2, 0, 'Tags' );
            
	    var table = helper.table(
		head,
		showBorders
	    );
            
            instances.forEach( function( instance ) {
                var groups = [];
                instance.SecurityGroups.forEach( function( sg ) {
                    groups.push( sg.GroupName );
                });
                
		var name = '';
                var tags = [];
                instance.Tags.forEach( function( tag ) {
		    if ( tag.Key === 'Name' ) {
			name = tag.Value;
		    } else {
			tags.push( tag.Key + ': ' + tag.Value );
		    }              
                });

		var row = [
                    instance.InstanceId,
		    name,
                    instance.InstanceType,
                    instance.State.Name,
                    instance.PublicIpAddress ? instance.PublicIpAddress : '',
                    instance.KeyName ? instance.KeyName : '',
                    groups.join( ', ' ) ];
                                
                // TODO add EBS info?
		if ( hasTags ) row.splice( 2, 0, tags.join( ', ' ) );
		
                table.push( row );
            });
            
            console.log( table.toString() );
        });
    },
    create: function( name, image, type, keyName ) {
        var ec2 = this.ec2;

        this.findEntities({
            name: name
        }, true ).then( function( instances ) {
            if ( instances.length > 0 ) {
                return helper.err({
                    code: 'Name not unique',
                    message: 'The name provided for the instance is not unique. Please select another name.'
                });
            } else {
                ec2.runInstances({
                    ImageId: image,
                    InstanceType: type,
                    KeyName: keyName,
                    MinCount: 1, 
                    MaxCount: 1
                }, function( err, data ) {
                    if ( err ) return helper.err( err );
                    
                    renameInstance( ec2, data.Instances[0].InstanceId, name );
                });
            }
        });
    },
    stop: function( name ) {
        var ec2 = this.ec2;
        
        this.findEntities({
            name: name
        }).then( function( instances ) {
            ec2.stopInstances({
                InstanceIds: [ instances[0].InstanceId ]
            }, function( err ) {
                if ( err ) return helper.err( err );
            });
        });
    },
    start: function( name ) {
        var ec2 = this.ec2;
        
        this.findEntities({
            name: name
        }).then( function( instances ) {
            ec2.startInstances({
                InstanceIds: [ instances[0].InstanceId ]
            }, function( err ) {
                if ( err ) return helper.err( err );
            });
        });
    },
    terminate: function( name ) {
        var ec2 = this.ec2;
        
        this.findEntities({
            name: name
        }).then( function( instances ) {
            ec2.terminateInstances({
                InstanceIds: [ instances[0].InstanceId ]
            }, function( err ) {
                if ( err ) return helper.err( err );
            });
        });
    },
    setInstance: function( name, type ) {
        var ec2 = this.ec2;
        
        this.findEntities({
            name: name
        }).then( function( instances ) {
            ec2.modifyInstanceAttribute({
                InstanceId: instances[0].InstanceId,
                InstanceType: { Value: type }
            }, function( err ) {
                if ( err ) return helper.err( err );
            });
        });
    },
    rename: function( oldName, newName ) {
        var t = this;
        
        this.findEntities({
            name: newName
        }, true ).then( function( instances ) {
            if ( instances.length > 0 ) {
                return helper.err({
                    code: 'Name not unique',
                    message: 'The name provided for the instance is not unique. Please select another name.'
                });
            } else {
                t.findEntities({
                    name: oldName
                }).then( function( instances ) {
                    renameInstance( ec2, instances[0].InstanceId, newName );
                });
            }
        });
    },
    
    // TODO think of a better logical way to handle expectZeroEntities
    findEntities: function( identifier, expectZeroEntities ) {
        var params = {};
        
        if ( typeof identifier !== 'undefined' && identifier !== null ) {
            // TODO: potentially add more keys
            if ( identifier.hasOwnProperty( 'name' ) ) {
                params = { 
                    Filters: [{ Name: 'tag:Name', Values: [identifier.name] }]
                };
            }
        }
        
        var deferred = Q.defer();
        this.ec2.describeInstances( 
            params,
            function( err, data ) {
                if ( err ) {
                    console.log( 'error' );
                    helper.err( err );
                    deferred.reject( err );
                } else {
                    var instances = [];
                    
                    // flatten structure
                    // TODO are there circumstances where this won't work?
                    data.Reservations.forEach( function( reservation ) {
                        reservation.Instances.forEach( function( instance ) {
                            instances.push( instance );
                        });
                    });

                    if ( typeof expectZeroEntities === 'undefined' || expectZeroEntities === null || expectZeroEntities === false ) {
                        if ( instances.length > 0 ) {
                            deferred.resolve( instances );
                        } else {
                            var e = {
                                code: 'Name not found',
                                message: 'The name provided for the instance was not found.'
                            };

                            helper.err( e );
                            // TODO figure out JS error object thing, probably need to put legit error in here
                            deferred.reject( e );
                        }
                    } else {
                        deferred.resolve( instances );
                    }
                }
            });
    
        return deferred.promise;
    }
};

function renameInstance( ec2, id, name ) {
    params = {
        Resources: [id],
        Tags: [{
            Key: 'Name',
            Value: name
        }]
    };
    
    ec2.createTags( params, function( err ) {
        if ( err ) return helper.err( err );
    });
}

module.exports = EC2;