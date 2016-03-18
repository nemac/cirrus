var Q = require( 'q' );
var helper = require( './helper' );
var EC2util = require( './ec2' );

var EBS = function( aws ) {
    this.aws = aws;
    this.region = aws.config.region;
    this.ec2 = new aws.EC2();
};

EBS.prototype = {
    list: function(filter) {
        var deferred = Q.defer();

        var params = {};

        if (filter) {
          filterParts = filter[0].split('=');
          params = {
            Filters: [{
              Name : 'tag-key',
              Values: [
                filterParts[0]
              ]
            },{
              Name: 'tag-value',
              Values: [
                filterParts[1]
              ]
            }]
          }
        }

        this.ec2.describeVolumes( params, function( err, data ) {
            if ( err ) return deferred.reject( err );

            var response = {
                message: ''
            };

            var volumes = data.Volumes;

            if ( volumes.length === 0 ) {
                response.message =  'No EBS volumes';
                return deferred.resolve( response );
            }

            response.table = {
                head: [],
                rows: []
            };

            response.data = [];

            var hasTags = false;
            volumes.some( function( volume ) {
                return hasTags = volume.Tags.length > 1;
            });

            response.table.head = ['Volume ID', 'Name', 'State', 'Size (GiB)', 'Snapshot ID', 'Attachment'];

            if ( hasTags ) {
                response.table.head.splice( 2, 0, 'Tags' );
            }

            // TODO map instance name with instanceid
            volumes.forEach( function( volume ) {
                var attachments = [];
                volume.Attachments.forEach( function( attachment ) {
                    attachments.push( attachment.InstanceId + ' -> ' + attachment.Device );
                });

                var name = '';
                var tags = [];

                volume.Tags.forEach( function( tag ) {
                    if ( tag.Key === 'Name' ) {
                        name = tag.Value;
                    } else {
                        tags.push( tag.Key + ': ' + tag.Value );
                    }
                });

                var row = [
                    volume.VolumeId,
                    name,
                    volume.State,
                    volume.Size,
                    volume.SnapshotId ? volume.SnapshotId : '',
                    attachments.length > 0 ? attachments.join( ', ' ) : ''];

                if ( hasTags ) {
                    row.splice( 2, 0, tags.join( ', ' ) );
                }

                response.table.rows.push( row );

                response.data.push({
                    name: name,
                    id: volume.VolumeId,
                    size: volume.Size,
                    snapshotId: volume.SnapshotId,
                    attachment: attachments.length > 0 ? attachments.join( ', ' ) : '',
                    tags: volume.Tags
                });
            });

            deferred.resolve( response );
        });

        return deferred.promise;
    },
    create: function( details ) {
        var deferred = Q.defer();
        var ec2 = this.ec2;
        var region = this.region;
        var t = this;

        this.findEntities({
            name: details.name
        }).then( function( volumes ) {
            if ( volumes.length > 0 ) {
                deferred.reject({
                    code: 'Name not unique',
                    message: 'The name provided for the volume is not unique. Please select another name.'
                });
            } else {
                ec2.createVolume({
                    AvailabilityZone: region + 'a', // TODO are there cases where we need b or d?
                    Size: details.size,
                    SnapshotId: details.snapshotId
                }, function( err, data ) {
                    if ( err ) {
                        deferred.reject( err );
                    } else {
                        t.name( data.VolumeId, details.name )
                            .then( function() {
                                deferred.resolve();
                            }).fail( function( err ) {
                                deferred.reject( err );
                            });
                    }
                });
            }
        }).fail( function( err ) {
            deferred.reject( err );
        });

        return deferred.promise;
    },
    findEntities: function( identifier ) {
        var deferred = Q.defer();
        var params = {};

        if ( typeof identifier !== 'undefined' && identifier !== null ) {
            if ( identifier.hasOwnProperty( 'name' ) ) {
                params = {
                    Filters: [{ Name: 'tag:Name', Values: [identifier.name] }]
                };
            }
        }

        this.ec2.describeVolumes(
            params,
            function( err, data ) {
                if ( err ) {
                    deferred.reject( err );
                } else {
                    deferred.resolve( data.Volumes );
                }
            });

        return deferred.promise;
    },
    name: function( id, name ) {
        var deferred = Q.defer();
        var ec2 = this.ec2;
        this.findEntities({ name: name })
            .then( function( resp ) {
                if ( resp.length > 0 ) {
                    deferred.reject({
                        code: 'Name not unique',
                        message: 'The name provided for the volume is not unique. Please select another name.'
                    });
                } else {
                    ec2.createTags({
                        Resources: [id],
                        Tags: [{
                            Key: 'Name',
                            Value: name
                        }]
                    }, function( err ) {
                        if ( err ) return deferred.reject( err );
                        deferred.resolve();
                    });
                }

            }).fail( function( err ) {
                deferred.reject( err );
            });

        return deferred.promise;
    },
    rename: function( oldName, newName ) {
        var deferred = Q.defer();
        var t = this;

        this.findEntities({ name: oldName })
            .then( function( resp ) {
                if ( resp.length !== 1 ) {
                    return deferred.reject({
                        code: 'Name not found',
                        message: 'The name provided for the volume was not found.'
                    });
                }

                t.name( resp[0].VolumeId, newName )
                    .then( function() {
                        deferred.resolve();
                    }).fail( function( err ) {
                        deferred.reject( err );
                    });
            }).fail( function( err ) {
                deferred.reject( err );
            });

        return deferred.promise;
    },
    remove: function( volume ) {
        var deferred = Q.defer();
        var ec2 = this.ec2;

        this.findEntities({
            name: volume
        }).then( function( volumes ) {
            if ( volumes.length !== 1 ) {
                return deferred.reject({
                    code: 'Name not found',
                    message: 'The name provided for the volume was not found.'
                });
            }

            ec2.deleteVolume({
                VolumeId: volumes[0].VolumeId
            }, function( err ) {
                if ( err ) return deferred.reject( err );
                deferred.resolve();
            });
        }).fail( function( err ){
            deferred.reject( err );
        });

        return deferred.promise;
    },
    attach: function( volume, instance, device ) {
        var deferred = Q.defer();
        var ec2util = new EC2util( this.aws );
        var ec2 = this.ec2;

        Q.allSettled([
            this.findEntities({ name: volume }),
            ec2util.findEntities({ name: instance })
        ]).then( function( resp ) {
            var rejR = helper.findIfHasRejectReason( resp );
            if ( rejR !== null ) return deferred.reject( rejR );

            var vol = resp[0].value[0];
            var inst = resp[1].value[0]

            ec2.attachVolume({
                Device: device,
                InstanceId: inst.InstanceId,
                VolumeId: vol.VolumeId
            }, function( err ) {
                if ( err ) return deferred.reject( err );
                deferred.resolve();
            });
        });

        return deferred.promise;
    },
    detach: function( volume ) {
        var deferred = Q.defer();
        var ec2 = this.ec2;

        this.findEntities({
            name: volume
        }).then( function( volumes ) {
            if ( volumes.length !== 1 ) {
                return deferred.reject({
                    code: 'Name not found',
                    message: 'The name provided for the volume was not found.'
                });
            }

            ec2.detachVolume({
                VolumeId: volumes[0].VolumeId
            }, function( err ) {
                if ( err ) return deferred.reject( err );
                deferred.resolve();
            });
        }).fail( function( err ){
            deferred.reject( err );
        });

        return deferred.promise;
    },
    listSnapshots: function(filter) {
        var deferred = Q.defer();

        var params = {
          Filters: [{
            Name: 'owner-id',
            Values: ['104538610210'] //TODO parameterize FOR NOW PUT VALUE HERE
          }]
        };

        if (filter) {
          filterParts = filter[0].split('=');
          params.Filters.push({
            Name: 'tag-key',
            Values: [
              filterParts[0]
            ]
          },{
            Name: 'tag-value',
            Values: [
              filterParts[1]
            ]
          })
        }

        this.ec2.describeSnapshots(params, function(err, data) {
            if (err) return deferred.reject(err);

            var response = {
              message: ''
            };

            var snapshots = data.Snapshots;

            if (snapshots.length === 0) {
              response.message =  'No EBS snapshots';
              return deferred.resolve( response );
            }

            response.table = {
              head: [],
              rows: []
            };

            response.data = [];

            var hasTags = false;
            snapshots.some(function(snapshot) {
              return hasTags = snapshot.Tags.length > 1;
            });

            response.table.head = ['Snapshot ID', 'Name', 'State', 'Start Time', 'Volume ID'];

            if (hasTags) {
              response.table.head.splice(2, 0, 'Tags');
            }

            snapshots.forEach(function(snapshot) {
                var name = '';
                var tags = [];

                snapshot.Tags.forEach(function(tag) {
                  if (tag.Key === 'Name') {
                    name = tag.Value;
                  } else {
                    tags.push(tag.Key + ': ' + tag.Value);
                  }
                });

                var row = [
                    snapshot.SnapshotId,
                    name,
                    snapshot.State,
                    snapshot.StartTime,
                    snapshot.VolumeId];

                if (hasTags) {
                  row.splice(2, 0, tags.join(', '));
                }

                response.table.rows.push( row );

                response.data.push({
                    name: name,
                    id: snapshot.VolumeId,
                    size: snapshot.Size,
                    snapshotId: snapshot.SnapshotId,
                    startTime: snapshot.StartTime,
                    tags: snapshot.Tags
                });
            });

            deferred.resolve(response);
        });

        return deferred.promise;
    },
    takeSnapshot: function(volumeName) {
      var deferred = Q.defer();
      var ec2 = this.ec2;

      this.findEntities({
        name: volumeName
      }).then(function(volumes) {
        if (volumes.length !== 1) {
          return deferred.reject({
            code: 'Name not found',
            message: 'The name provided for the volume was not found.'
          });
        }

        var volume = volumes[0];

        var volName = volume.Tags.filter(function(tag) {
          return tag.Key === 'Name';
        })[0].Value;

        ec2.createSnapshot({
          VolumeId: volume.VolumeId,
          Description: 'Automated snapshot of ' + volName + ' generated on ' + new Date().toDateString()
        }, function(err, data) {
          if (err) return deferred.reject(err);

          ec2.createTags({
            Resources: [data.SnapshotId],
            Tags: [{
              Key: 'Source',
              Value: volName
            }, {
              Key: 'CIRRUS',
              Value: 'true'
            }]
          }, function(err, data) {
            if (err) return deferred.reject(err);
            deferred.resolve();
          });
        });
      }).fail(function(err){
        deferred.reject(err);
      });

      return deferred.promise;
    },
    deleteSnapshot: function(ssid) {
      var deferred = Q.defer();

      this.ec2.deleteSnapshot({
        SnapshotId: ssid
      }, function(err) {
          if (err) return deferred.reject(err);
          deferred.resolve();
      });

      return deferred.promise;
    }
};

function getSnapshot( identifier ) {
    var deferred = Q.defer();
    var params = {};

    if ( typeof identifier !== 'undefined' && identifier !== null ) {
        if ( identifier.hasOwnProperty( 'name' ) ) {
            params = {
                Filters: [{ Name: 'tag:Name', Values: [identifier.name] }]
            };
        }
    }

    this.ec2.describeSnapshots(
        params,
        function( err, data ) {
            if ( err ) {
                deferred.reject( err );
            } else {
                console.log( data );
                //deferred.resolve( data.Volumes );
            }
        });

    return deferred.promise;
}

module.exports = EBS;
