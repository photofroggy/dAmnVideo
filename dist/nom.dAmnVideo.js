
var dVideo = {};
dVideo.VERSION = '0.4.10';
dVideo.STATE = 'alpha';
dVideo.REVISION = '0.4.10';
dVideo.APPNAME = 'dAmnVideo';
dVideo.APPVERSION = 1;
dVideo.bots = [ 'botdom', 'damnphone' ];
dVideo.peer_options = {
    iceServers: [
        { url: 'stun:stun.l.google.com:19302' }
    ]
};
dVideo.phone = null;
dVideo.signal = null;
dVideo.local = {};
dVideo.local.stream = null;
dVideo.local.url = null;
dVideo.remote = {};
dVideo.remote._empty = {
    video: null,
    audio: null,
    conn: null
};
dVideo.chan = {};
dVideo.chan.group = false;
dVideo.chan.calls = [];
dVideo.extension = function( client ) {
    if( !wsc.dAmn.BDS.Peer.RTC.PeerConnection )
        return;
    var init = function (  ) {
        client.bds.provides.push( 'PEER' );
        dVideo.create_phone( client );
        'peer.request', function( event ) { dVideo.phone.signal.request( event ); } );
        'BDS.PEER.ACK', function( event ) { dVideo.phone.signal.ack( event ); } );
        'BDS.PEER.REJECT', function( event ) { dVideo.phone.signal.reject( event ); } );
        client.bind( 'peer.accept', function( event ) { dVideo.phone.signal.accept( event ); } );
        'BDS.PEER.OPEN', function( event ) { dVideo.phone.signal.open( event ); } );
        'BDS.PEER.END', function( event ) { dVideo.phone.signal.end( event ); } );
        'peer.offer', function( event ) { dVideo.phone.signal.offer( event ); } );
        'peer.answer', function( event ) { dVideo.phone.signal.answer( event ); } );
        client.bind( 'peer.close', function( event ) { dVideo.phone.signal.close( event ); } );
        'recv_part', function( event ) { handle.recv_part( event ); } );
        client.ui.control.add_button({
            label: '',
            icon: 'iphone',
            title: 'Start a video call.',
            href: '#call',
            handler: function(  ) {
                var cui = client.ui.chatbook.current;
                '#' ) {
                    'Group calls not implemented yet! If you want group calls, let photofroggy know.' );
                    return;
                }
                var ns = cui.raw;
                var user = cui.namespace.substr(1);
                var title = 'Private Call';
                if( client.channel( ns ).get_usernames(  ).indexOf( user ) == -1 ) {
                    alert( 'Other user must be in the channel before calling.' );
                    return;
                }
                dVideo.phone.dial( ns, ns + ':' + title, cui.namespace, title, user );
            }
        });
    };
    var cmds = {
    };
    var handle = {
        recv_part: function( event ) {
            var call = dVideo.phone.call;
            if( !call )
                return;
            if( event.ns != call.ns )
                return;
            dVideo.phone.hangup( call );
        }
    };
    init();
};
dVideo.create_phone = function( client ) {
    if( dVideo.phone )
        return;
    dVideo.phone = new dVideo.Phone( client );
};
dVideo.Phone = function( client ) {
    '<div class="phone"></div>');
    this.view = this.client.ui.view.find('div.phone');
};
dVideo.Phone.prototype.get_media = function( success, err ) {
    var stub = function(  ) {};
    success = success || stub;
    err = err || stub;
    this.client.ui.get_user_media(
        { video: true, audio: true },
        function( stream ) {
            dVideo.phone.got_media( stream );
            success( stream );
        },
        function( error ) {
            err( error );
        }
    );
};
dVideo.Phone.prototype.got_media = function( stream ) {
    this.url = URL.createObjectURL( stream );
    this.stream = stream;
};
dVideo.Phone.prototype.dial = function( bds, pns, ns, title, user ) {
    if( this.call != null )
        return this.call;
    if( ns[0] != '@' )
        return;
    var call = client.bds.peer.open( bds, pns, user, dVideo.APPNAME, dVideo.APPVERSION );
    var peer = call.new_peer( user );
    call.onclose = function(  ) {
        dVideo.phone.call = null;
        client.ui.chatbook.channel( call.ns ).server_message( 'Call Ended' );
    };
    peer.onclose = function(  ) {
        console.log('> peer connection closed.' );
        call.close();
    };
    var done = function(  ) {
        call.signal.request( );
    };
    this.viewport( call, peer );
    this.get_media(
        function(  ) {
            'ref': 'call-' + peer.user,
            'icon': '<img src="' + wsc.dAmn.avatar.src(peer.user,
                client.channel(call.ns).info.members[peer.user].usericon) + '" />',
            'heading': 'Incoming Call',
            'content': peer.user + ' is calling you.',
            'buttons': {
                'answer': {
                    'ref': 'answer',
                    'target': 'answer',
                    'label': 'Answer',
                    'title': 'Answer the call',
                    'click': function(  ) {
                        client.ui.pager.remove_notice( pnotice );
                        dVideo.phone.answer( call, peer );
                        return false;
                    }
                },
                'reject': {
                    'ref': 'reject',
                    'target': 'reject',
                    'label': 'Reject',
                    'title': 'Reject the call',
                    'click': function(  ) {
                        call.signal.reject( peer.user );
                        client.ui.pager.remove_notice( pnotice );
                        return false;
                    }
                }
            }
        }, true );
        pnotice.onclose = function(  ) {
            call.signal.reject( peer.user );
            pnotice = null;
        };
        peer.onclose = function(  ) {
            console.log('> close',peer);
            call.close( );
            if( !pnotice )
                return;
            client.ui.pager.remove_notice( pnotice );
        };
        call.onclose = function(  ) {
            dVideo.phone.call = null;
            client.ui.chatbook.channel( call.ns ).server_message( 'Call Ended' );
        };
        return;
    }
    if( !this.call.group )
        return;
    '> finished ice.');
    };
    peer.onlocaldescription = function(  ) {
        call.signal.offer( peer );
    };
    peer.onremotedescription = function(  ) {
        client.ui.chatbook.channel( call.ns ).server_message( 'Call Started' );
        peer.persist();
    };
    peer.onclose = function(  ) {
        console.log('> close',peer);
        call.close( );
        if( !pnotice )
            return;
        client.ui.pager.remove_notice( pnotice );
    };
    call.onclose = function(  ) {
        dVideo.phone.call = null;
        client.ui.chatbook.channel( call.ns ).server_message( 'Call Ended' );
    };
    peer.create_offer();
};
dVideo.Phone.prototype.answer = function( call, peer ) {
    this.call = call;
    if( call.group )
        return;
    var done = function(  ) {
        if( call.localstream )
            peer.set_local_stream( call.localstream );
        call.signal.accept( peer.user );
    };
    this.viewport( call, peer );
    this.get_media(
        function(  ) {
            '<div class="phone private">\
            <div class="title">\
                <h2>' + call.title + '</h2>\
            </div>\
            <div class="viewport remote">\
                <div class="video">\
                    <video autoplay></video>\
                </div>\
                <div class="label">\
                    <span class="label">' + peer.user + '</span>\
                    <ul class="control">\
                        <li><a href="#pause" title="Pause webcam" class="toggle pause remote">Pause</a></li>\
                        <li><a href="#mute" title="Mute webcam" class="toggle mute remote">Mute</a></li>\
                    </ul>\
                </div>\
            </div>\
            <div class="viewport local">\
                <div class="video">\
                    <video autoplay muted></video>\
                </div>\
                <div class="label">\
                    <span class="label">You</span>\
                    <ul class="control">\
                        <li><a href="#pause" title="Pause your webcam" class="toggle pause">Pause</a></li>\
                        <li><a href="#mute" title="Mute your microphone" class="toggle mute">Mute</a></li>\
                    </ul>\
                </div>\
            </div>\
            <div class="control">\
                <ul>\
                    <li><a href="#hangup" title="End the call" class="button hangup">Hang Up</a></li>\
                </u>\
            </div>\
        </div>'
    );
    var pui = cui.el.m.find( 'div.phone' );
    pui.height( height );
    pui.find('.control .hangup').click(
        function(  ) {
            dVideo.phone.hangup( call, peer );
            return false;
        }
    );
    var rvid = pui.find('.viewport.remote video');
    var lvid = pui.find('.viewport.local video');
    if( this.url )
        lvid[0].src = this.url;
    var toggle_logic = function( options ) {
        options = Object.extend( {
            mic: false,
            text: {
                pause: 'Play',
                play: 'Pause'
            }
        }, ( options || {} ) );
        return function(  ) {
            var button = pui.find( this );
            var remote = button.hasClass('remote');
            if( button.hasClass( 'paused' ) ) {
                play( options.mic, remote );
                button.text( options.text.play );
                button.removeClass( 'paused' );
                return false;
            }
            pause( options.mic, remote );
            button.text( options.text.pause );
            button.addClass( 'paused' );
            return false;
        };
    }
    pui.find( '.label .control .toggle.pause' ).click( toggle_logic() );
    pui.find( '.label .control .toggle.mute' ).click(
        toggle_logic({
            mic: true,
            text: {
                pause: 'Unmute',
                play: 'Mute'
            }
        })
    );
    var pause = function( mic, remote ) {
        var tracks = [];
        var l = 0;
        if( mic ) {
            if( remote )
                tracks = peer.remotemic;
            else
                tracks = call.localmic;
        } else {
            if( remote )
                tracks = peer.remotevideo;
            else
                tracks = call.localvideo;
        }
        l = tracks.length;
        if( l == 0 )
            return;
        for( var i = 0; i < l; i++ ) {
            tracks[ i ].enabled = false;
        };
    };
    var play = function( mic, remote ) {
        var tracks = [];
        var l = 0;
        if( mic ) {
            if( remote )
                tracks = peer.remotemic;
            else
                tracks = call.localmic;
        } else {
            if( remote )
                tracks = peer.remotevideo;
            else
                tracks = call.localvideo;
        }
        l = tracks.length;
        if( l == 0 )
            return;
        for( var i = 0; i < l; i++ ) {
            tracks[ i ].enabled = true;
        };
    };
    call.localmic = [];
    call.localvideo = [];
    call.onlocalstream = function(  ) {
        lvid[0].src = call.localurl;
        call.localmic = call.localstream.getAudioTracks();
        call.localvideo = call.localstream.getVideoTracks();
    };
    peer.vp = rvid[0];
    peer.remotemic = [];
    peer.remotevideo = [];
    peer.onremotestream = function(  ) {
        rvid[0].src = URL.createObjectURL( peer.remote_stream );
        peer.remotemic = peer.remote_stream.getAudioTracks();
        peer.remotevideo = peer.remote_stream.getVideoTracks();
        console.log( rvid[0].src );
    };
};
dVideo.Phone.prototype.hangup = function( call, peer ) {
    this.destroy_call( call );
    if( call.group ) {
        'div.phone').remove();
    cui.ulbuf-= 250;
    cui.resize();
    this.call = null;
};
dVideo.SignalHandler = function( phone, client ) {
    this.phone = phone;
    this.client = client;
};
'You have been blocked' );
        return false;
    }
    if( this.client.away.on ) {
        call.signal.reject( peer.user, 'Away; ' + client.away.reason );
        return false;
    }
    if( phone.call != null ) {
        if( phone.call != call || !call.group ) {
            call.signal.reject( peer.user, 'Already in a call' );
            return false;
        }
    }
    peer.onicecompleted = function(  ) {
        console.log('> finished ice.');
    };
    peer.onremotedescription = function(  ) {
        peer.create_answer();
    };
    peer.onlocaldescription = function(  ) {
        call.signal.answer( peer );
        dVideo.phone.client.ui.chatbook.channel( call.ns ).server_message( 'Call Started' );
        peer.persist();
    };
    peer.onclose = function(  ) {
        call.close( );
        phone.client.client.ui.pager.remove_notice( pnotice );
    };
    phone.incoming( call, peer );
},
dVideo.SignalHandler.prototype.ack = function( event ) {};
dVideo.SignalHandler.prototype.reject = function( event ) {
    '> finished ice.');
        if( peer.remote_stream != null )
            return;
        var streams = peer.pc.getRemoteStreams();
        if( streams.length == 0 )
            return;
        console.log('> got a stream');
        peer.remote_stream = streams[0];
        peer.vp.src = URL.createObjectURL( peer.remote_stream );
    };
    peer.onlocaldescription = function(  ) {
        call.signal.offer( peer );
    };
    peer.onremotedescription = function(  ) {
        'Call Started' );
        peer.persist();
    };
    peer.onclose = function(  ) {
        call.close( );
        phone.client.client.ui.pager.remove_notice( pnotice );
    };
    peer.create_offer();
};
dVideo.SignalHandler.prototype.open = function( event ) {};
dVideo.SignalHandler.prototype.end = function( event ) {};
dVideo.SignalHandler.prototype.offer = function( event ) {
    if( dVideo.APPNAME != event.call.app )
        return;
    var call = event.call;
    var peer = event.peer;
    var offer = event.offer;
    peer.onremotedescription = function( ) {
        peer.answer();
    };
    peer.ready(
        function(  ) {
            call.signal.answer( peer );
            console.log('> connected to new peer', peer.user);
        },
        offer
    );
};
dVideo.SignalHandler.prototype.answer = function( event ) {
    if( dVideo.APPNAME != event.call.app )
        return;
    var call = event.call;
    var peer = event.peer;
    var peer = call.peer( peer.user );
    if( !peer )
        return;
    peer.open(
        function(  ) {
            console.log('> connected to new peer ', peer.user);
        },
        event.answer
    );
};
dVideo.SignalHandler.prototype.candidate = function( event ) {
    var call = phone.call;
    var pns = event.param[0];
    var user = event.param[1];
    var target = event.param[2];
    console.log(event.param.slice(3));
    var candidate = new dVideo.RTC.SessionDescription( JSON.parse( event.param.slice(3).join(',') ) );
    if( target.toLowerCase() != client.settings.username.toLowerCase() )
        return;
    var peer = call.peer( user );
    if( !peer )
        return;
    peer.conn.candidate( candidate );
};
dVideo.SignalHandler.prototype.close = function( event ) {};