var fs = require('fs');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;

var Q = require( 'q' );
var helper = require( './helper' );

var EC2 = function( aws ) {
    this.ec2 = new aws.EC2();
};

EC2.prototype = {
    list: function( showBorders ) {
        var deferred = Q.defer();
        this.findEntities(
            //all
        ).then( function( instances ) {
            var response = {
                message: ''
            };
            
            if ( instances.length === 0 ) {
                response.message = 'No EC2 instances.';
                deferred.resolve( response );
            }

            response.table = {
                head: [
                    'ID', 
                    'Name', 
                    'Type', 
                    'State', 
                    'Public IP', 
                    'Private IP', 
                    'Key Name', 
                    'Security Groups' ],
                rows: []
            };

            response.data = [];
            
            // check if tags other than name
            var hasTags = false;
            instances.some( function( instance ) {
                return hasTags = instance.Tags.length > 1;
            });

            if ( hasTags ) response.table.head.splice( 2, 0, 'Tags' );
            
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
                    instance.PrivateIpAddress ? instance.PrivateIpAddress : '',
                    instance.KeyName ? process.env.CIRRUS_KEYS + "/" + instance.KeyName  + ".pem" : '',
                    groups.join( ', ' ) ];
                
                // TODO add EBS info?
                if ( hasTags ) row.splice( 2, 0, tags.join( ', ' ) );
                
                response.table.rows.push( row );

                response.data.push({
                    name: name,
                    type: instance.InstanceType,
                    key: instance.KeyName ? instance.KeyName : '',
                    groups: groups,
                    image: instance.ImageId
                });

            });
            
            deferred.resolve( response );
        }).fail( function( err ) {
            deferred.reject( err );
        });

        return deferred.promise;
    },
    create: function( details ) {
        var name = details.name;
        var image = details.image;
        var type = details.type;
        var key = details.key;
        var groups = details.groups;

        var deferred = Q.defer();
        var ec2 = this.ec2;

        this.findEntities({
            name: name
        }, true ).then( function( instances ) {
            if ( instances.length > 0 ) {
                return deferred.reject({
                    code: 'Name not unique',
                    message: 'The name provided for the instance is not unique. Please select another name.'
                });
            } else {
                ec2.runInstances({
                    ImageId: image,
                    InstanceType: type,
                    KeyName: key,
                    SecurityGroups: groups,
                    MinCount: 1, 
                    MaxCount: 1
                }, function( err, data ) {
                    if ( err ) return deferred.reject( err );
                    renameInstance( ec2, data.Instances[0].InstanceId, name )
                        .then( function() {
                            deferred.resolve();
                        }).fail( function( err ) {
                            deferred.reject( err );
                        });
                });
            }
        }).fail( function( err ) {
            deferred.reject( err );
        });

        return deferred.promise;
    },
    stop: function( name ) {
        var deferred = Q.defer();
        var ec2 = this.ec2;
        
        this.findEntities({
            name: name
        }).then( function( instances ) {
            ec2.stopInstances({
                InstanceIds: [ instances[0].InstanceId ]
            }, function( err ) {
                if ( err ) return deferred.reject( err );
                deferred.resolve();
            });
        }).fail( function( err ) {
            deferred.reject( err );
        });

        return deferred.promise;
    },
    start: function( name ) {
        var deferred = Q.defer();
        var ec2 = this.ec2;
        
        this.findEntities({
            name: name
        }).then( function( instances ) {
            ec2.startInstances({
                InstanceIds: [ instances[0].InstanceId ]
            }, function( err ) {
                if ( err ) return deferred.reject( err );
                deferred.resolve();
            });
        }).fail( function( err ) {
            deferred.reject( err );
        });

        return deferred.promise;
    },
    terminate: function( name ) {
        var deferred = Q.defer();
        var ec2 = this.ec2;
        
        this.findEntities({
            name: name
        }).then( function( instances ) {
            ec2.terminateInstances({
                InstanceIds: [ instances[0].InstanceId ]
            }, function( err ) {
                if ( err ) return deferred.reject( err );
                deferred.resolve();
            });
        }).fail( function( err ) {
            deferred.reject( err );
        });

        return deferred.promise;
    },
    setInstance: function( name, type ) {
        var deferred = Q.defer();
        var ec2 = this.ec2;
        
        this.findEntities({
            name: name
        }).then( function( instances ) {
            ec2.modifyInstanceAttribute({
                InstanceId: instances[0].InstanceId,
                InstanceType: { Value: type }
            }, function( err ) {
                if ( err ) return deferred.reject( err );
                deferred.resolve();
            });
        }).fail( function( err ) {
            deferred.reject( err );
        });

        return deferred.promise;
    },
    rename: function( oldName, newName ) {
        var deferred = Q.defer();
        var t = this;
        
        this.findEntities({
            name: newName
        }, true ).then( function( instances ) {
            if ( instances.length > 0 ) {
                return deferred.reject({
                    code: 'Name not unique',
                    message: 'The name provided for the instance is not unique. Please select another name.'
                });
            } else {
                t.findEntities({
                    name: oldName
                }).then( function( instances ) {
                    renameInstance( t.ec2, instances[0].InstanceId, newName )
                        .then( function() {
                            deferred.resolve();
                        }).fail( function ( err ) {
                            deferred.reject( err );
                        });
                }).fail( function( err ) {
                    deferred.reject( err );
                });
            }
        }).fail( function( err ) {
            deferred.reject( err );
        });

        return deferred.promise;
    },

    sshConfig: function( name ) {
        var deferred = Q.defer();
        var ec2 = this.ec2;

        this.findEntities({
            name: name
        }).then( function( instances ) {
            //console.log(instances);
            if (instances.length == 0) {
                deferred.reject({
                    message: "No instance found with name: " + name
                });
            } else if (instances.length > 1) {
                deferred.reject({
                    message: "Found more than one instance with name: " + name
                });
            } else {
                var instance = instances[0];
                var keyfile = process.env.CIRRUS_KEYS + "/" + instance.KeyName + ".pem";
                if (fs.existsSync(keyfile)) {
                    deferred.resolve({
                        message: "-i " + keyfile + " root@" + instance.PublicIpAddress
                    });
                } else {
                    deferred.reject({
                        message: "cannot find keyfile: " + keyfile
                    });
                }
            }
        }).fail( function( err ) {
            deferred.reject( err );
        });

        return deferred.promise;
    },

    ssh: function( name, command ) {
        var deferred = Q.defer();
        var ec2 = this.ec2;

        this.findEntities({
            name: name
        }).then( function( instances ) {
            if (instances.length == 0) {
                deferred.reject({
                    message: "No instance found with name: " + name
                });
            } else if (instances.length > 1) {
                deferred.reject({
                    message: "Found more than one instance with name: " + name
                });
            } else {
                var instance = instances[0];
                var keyfile = process.env.CIRRUS_KEYS + "/" + instance.KeyName + ".pem";
                if (fs.existsSync(keyfile)) {
                    var ssh = spawn("ssh", [
                        "-i", keyfile,
                        "root@" + instance.PublicIpAddress,
                        command
                    ]);
                    ssh.stdout.on('data', function(data) {
                        process.stdout.write(data);
                    });
                    ssh.stderr.on('data', function(data) {
                        process.stdout.write(data);
                    });
                    ssh.on('close', function(code) {
                        if (code === 0) {
                            deferred.resolve({
                                message: ''
                            });
                        } else {
                            deferred.reject({
                                message: 'ERROR'
                            });
                        }
                    });
                } else {
                    deferred.reject({
                        message: "cannot find keyfile: " + keyfile
                    });
                }
            }
        }).fail( function( err ) {
            deferred.reject( err );
        });

        return deferred.promise;
    },

    rsync: function( name, source, destination, options ) {
        var deferred = Q.defer();
        var ec2 = this.ec2;

        this.findEntities({
            name: name
        }).then( function( instances ) {
            if (instances.length == 0) {
                deferred.reject({
                    message: "No instance found with name: " + name
                });
            } else if (instances.length > 1) {
                deferred.reject({
                    message: "Found more than one instance with name: " + name
                });
            } else {
                var instance = instances[0];
                var keyfile = process.env.CIRRUS_KEYS + "/" + instance.KeyName + ".pem";
                if (fs.existsSync(keyfile)) {
                    var rsynccommand = ("rsync " + options + " -e 'ssh -i " + keyfile + "' "
                                        + source
                                        + " root@" + instance.PublicIpAddress + ":" + destination);
                    exec(rsynccommand, function(error, stdout, stderr) {
                        if (error) {
                            deferred.reject({
                                message: stderr
                            });
                        } else {
                            deferred.resolve({
                                message: stdout
                            });

                        }
                    });
                } else {
                    deferred.reject({
                        message: "cannot find keyfile: " + keyfile
                    });
                }
            }
        }).fail( function( err ) {
            deferred.reject( err );
        });

        return deferred.promise;
    },

    setTag: function( name, key, value ) {

        var deferred = Q.defer();
        var ec2 = this.ec2;

        this.findEntities({
            name: name
        }, true ).then( function( instances ) {
            if ( instances.length <= 0 ) {
                return deferred.reject({
                    code: 'Name not found',
                    message: 'The name provided for the instance was not found.'
                });
            } else {
                var tg = {};
                tg[key] = value;
                setTags( ec2, instances[0].InstanceId, tg )
                    .then( function() {
                        deferred.resolve();
                    }).fail( function( err ) {
                        deferred.reject( err );
                    });
            }
        }).fail( function( err ) {
            deferred.reject( err );
        });

        return deferred.promise;
    },


    
    // TODO think of a better logical way to handle expectZeroEntities
    findEntities: function( identifier, expectZeroEntities ) {
        var params = {};
        
        if ( typeof identifier !== 'undefined' && identifier !== null ) {
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
                            deferred.reject({
                                code: 'Name not found',
                                message: 'The name provided for the instance was not found.'
                            });
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
    var deferred = Q.defer();
    var params = {
        Resources: [id],
        Tags: [{
            Key: 'Name',
            Value: name
        }]
    };
    
    ec2.createTags( params, function( err ) {
        if ( err ) return deferred.reject( err );
        deferred.resolve();
    });

    return deferred.promise;
}

function setTags( ec2, id, tags ) {

    // The incoming `tags` arg is an object.  Each property corresponds to a tag
    // to be set; the property name is the name of the tag, the property value
    // is the value.  For example:
    //     { conf: 'webserver-a', color: 'brown' }
    // The following converts the `tags` object to an array of the form:
    //     [ { Key: 'conf', Value: 'webserver-a' },
    //       { Key: 'color', Value: 'brown' } ]
    var Tags = [];
    Object.keys(tags).forEach(function(key) {
        Tags.push({
            Key   : key,
            Value : tags[key]                                 
        });
    });

    var deferred = Q.defer();

    var params = {
        Resources: [id],
        Tags: Tags
    };
    
    ec2.createTags( params, function( err ) {
        if ( err ) return deferred.reject( err );
        deferred.resolve();
    });

    return deferred.promise;
}

module.exports = EC2;
