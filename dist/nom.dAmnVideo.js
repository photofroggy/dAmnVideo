
var dVideo = {};
dVideo.VERSION = '0.1.4';
dVideo.STATE = 'alpha';
dVideo.REVISION = '0.1.4';
dVideo.APPNAME = 'dAmnVideo 0';
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
        client.ui.control.add_button({
            label: '',
            icon: 'iphone',
            title: 'Start a video call.',
            href: '#call',
            handler: function(  ) {
                var cui = client.ui.chatbook.current;
                '#' ) {
                    'private-call';
                dVideo.phone.dial( ns, ns + ':' + title, cui.namespace, title, user );
            }
        });
    };
    var cmds = {
    };
    var handle = {
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
    var call = client.bds.peer.open( bds, pns, user, dVideo.APPNAME );
    var peer = call.new_peer( user );
    var done = function(  ) {
        call.signal.request( );
    };
    this.viewport( call, peer );
    this.get_media(
        function(  ) {
            'ref': 'call-' + peer.user,
            'icon': '<img src="' + wsc.dAmn.avatar.src(peer.user,
                client.channel(call.ns).info.members[peer.user].usericon) + '" />',
            'heading': peer.user + ' calling...',
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
        '<div class="phone private">\
            <div class="viewport remote">\
                <div class="video">\
                    <video autoplay></video>\
                </div>\
                <div class="label">' + peer.user + '</div>\
            </div>\
            <div class="viewport local">\
                <div class="video">\
                    <video autoplay></video>\
                </div>\
                <div class="label">you</div>\
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
    '.control .hangup').click(
        function(  ) {
            dVideo.phone.hangup( call, peer );
            return false;
        }
    );
    var rvid = pui.find('.viewport.remote video');
    var lvid = pui.find('.viewport.local video');
    if( this.url )
        lvid[0].src = this.url;
    call.onlocalstream = function(  ) {
        lvid[0].src = call.localurl;
    };
    peer.onremotestream = function(  ) {
        rvid[0].src = URL.createObjectURL( peer.remote_stream );
    };
};
dVideo.Phone.prototype.hangup = function( call, peer ) {
    this.destroy_call( call );
    if( call.group ) {
        'div.phone').remove();
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
        console.log( peer.pc.getRemoteStreams() );
    };
    peer.onremotedescription = function(  ) {
        peer.create_answer();
    };
    peer.onlocaldescription = function(  ) {
        call.signal.answer( peer );
    };
    peer.onclose = function(  ) {
        dVideo.phone.destroy_call( call );
    };
    '> finished ice.');
        console.log( peer.pc.getRemoteStreams() );
    };
    peer.onlocaldescription = function(  ) {
        call.signal.offer( peer );
    };
    peer.onremotedescription = function(  ) {
        '> connected to new peer', peer.user);
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