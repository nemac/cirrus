var colors = require( 'colors' );
var helper = require( './helper' );
var questions = require( 'questions' );
var progress = require( 'progress' );
var fs = require( 'fs' );
var pathUtil = require( 'path' );
var finder = require( 'findit' );

var maxKeys = 1000000000;

var S3 = function ( aws ) {
    this.s3 = new aws.S3();
};

S3.prototype = {
    list: function() {
        this.s3.listBuckets( function( err, data ){
            if ( err ) return helper.err( err );
            
            data.Buckets.forEach( function( bucket ) {
                console.log( bucket.Name );
            });

	    process.exit( 0 );
        });
    },
    du : function( bucket, dir ) {
        var params = {
            Bucket: bucket,
            MaxKeys: maxKeys // todo test if this truly overrides, or if the services maxes at 1k
        };
        
        this.s3.listObjects( params, function( err, data ) {
            if ( err ) return helper.err( err );

            if ( data.IsTruncated ) {
                console.log( 'WARNING\n'.yellow + 'Only the first %s objects were scanned', data.MaxKeys );
            } else {
                console.log( 'Total objects in %s: %s', bucket, data.Contents.length );
            }
            
            var size = 0;
            
            data.Contents.forEach( function( content ) {
                size += content.Size;
            });
            
            console.log( 'Total size: ' + size + ' bytes' );
	    process.exit( 0 );
        });
    },
    create: function( bucket ) {
        var params = {
            Bucket: bucket
        };
        
        this.s3.createBucket(params, function( err, data ) {
            if ( err ) return helper.err( err );
	    process.exit( 0 );
        });
    },
    remove: function( bucket ) {
        var params = {
            Bucket: bucket
        };
        
        var t = this;
        
        this.s3.deleteBucket(params, function( err, data ) {
            if ( err ) {
                if ( err.code === 'BucketNotEmpty' ) {
                    t.empty( bucket );
                } else {
                    helper.err( err );
                }
            }

	    //process.exit( 0 );
        });
    },
    empty: function( bucket ) {
        var question = {
            info: 'WARNING\n'.yellow + 'This will delete the bucket and all contents, are you sure? \nType "yes" to continue the operation'
        };
        
        var t = this;
        
        questions.askOne(question, function( resp ) {
            if ( resp !== 'yes' ) {
                console.log( 'Remove canceled'.green );
                return;
            }
            
            emptyBucket( t, bucket, 0 );
	    //process.exit( 0 );
        });
    },
    put: function( path, bucket ) {
        var s3 = this.s3;
        
        try {
            fs.stat( path, function( err, stats ) {
		if ( typeof stats === 'undefined' ) {
		    helper.err ( { code: 'File not found', message: 'Please check the source path' } );
		    process.exit( 1 );
		}

                if ( stats.isFile() ) {
                    putFile( s3, path, bucket, pathUtil.basename( path ));
                } else {
                    putDir( s3, path, bucket );
                }
            });
        } catch ( err ) {
            helper.err( err );
	    process.exit( 1 );
        }
    }
 };

function emptyBucket( t, bucket, count ) {
    var params = {
        Bucket: bucket,
        MaxKeys: maxKeys
    };
        
    t.s3.listObjects( params, function( err, data ) {
        if ( err ) return helper.err( err );
                
        var objParams = {
            Bucket: bucket,
            Key: ''
        };
                
        console.log();
        var bar = new progress( '  deleting [:bar] :percent :etas', {
            complete: '=',
            incomplete: ' ',
            width: 20,
            total: data.Contents.length
        });
                
        for ( var i = 0; i < data.Contents.length; i++ ) {
            objParams.Key = data.Contents[i].Key;

            t.s3.deleteObject( objParams, function( err ) {
                if ( err ) {
                    helper.err( e );
                    process.exit( 1 );
                }
            });
            
            bar.tick( 1 );
            count++;
        }
        
        // recurse if there's more data
        if ( data.IsTruncated ) {
            emptyBucket( t, bucket, count );
        } else {
            t.remove( bucket );
            console.log();
            console.log( '%s items deleted, %s removed', count, bucket );
        }
    });
}

function putDir( s3, path, bucket ) {
    path = pathUtil.normalize( path );
    
    var files = [];
    
    console.log( 'Finding files ');
    finder( path ).on( 'file', function( file ) {
        files.push( file );
    }).on( 'end', function(){
        console.log();
        var bar = new progress( '  uploading [:bar] :percent :etas', {
            complete: '=',
            incomplete: ' ',
            width: 20,
            total: files.length - 1
        });
        
        for (var i = 0; i < files.length; i++) {
            if ( i < files.length - 1 ) {
                putFile( s3, files[i], bucket, getRelativeFile( files[i], path ), bar );
            }  else {
                putFile( s3, files[i], bucket, getRelativeFile( files[i], path ), bar, files.length );
		if ( i === files.length - 1) {
		    //process.exit( 0 );
		}
            }
        };
    });
}

function putFile( s3, fileName, bucket, key, bar, len ) {
    var fileBuffer = fs.readFileSync( fileName );
    var contentType = getContentType( fileName ); //todo
        
    s3.putObject({
        Bucket: bucket,
        Key: key,
        ACL: 'private', // todo: parameterize ACL?
        Body: fileBuffer,
        ContentType: contentType
    }, function( err ) {
        if ( err ) {
            helper.err( err );
            process.exit( 1 );
        } else {
            if ( bar ) {
                bar.tick( 1 );    
                if ( len ) {
                    console.log();
                    console.log( '\n%s files uploaded to %s', len, bucket );
                }
            } else {
		// exit because not being called recurisvely
		//process.exit( 0 );
	    }
        }
    });
}

function getRelativeFile( fileName, path ) {
    return fileName.replace( path, '' ).replace( /\\/g, '/');
}

function getContentType( fileName ) {
    var type = 'application/octet-stream';
    //var fn = fileName.toLowerCase();
    
    // todo: add list of types here from fn above

    return type;
}

module.exports = S3;