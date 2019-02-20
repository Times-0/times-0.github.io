/*
HTML - FRIENDS LIST : AS3, TIMELINE.
WRITTEN BY DOTE. VISIT: ...
*/

var TimelineFriends = {
    clientSelector : null,
    cpClient : null,
    
    friendList : null,
    friendLoader : null,
    friendListBody : null,
    friendsSearch : null,
    friendRequests: null,
    
    searching_for_friend : false,
    
    friends : [],
    requests: [],
    
    defaultFriendTemplate : '<div id="p{id}" class="avatar" style="background-image: url(\'//cdn.avatar.clubpenguin.com:80/{swid}/cp?size=88\'), url(\'img/avatar.png\'); background-size: 88px 88px;"><span id="bff-stripe" class="no-bff"></span><span class="avatar-nick"><b>{name}</b></span><span id="status" class="avatar-status">Offline</span></div>',
    defaultSearchResultTemplate : '<div class="f-search-result-box"><div id="s{swid}" class="avatar" style="height: 60px; width: 60px; background-image: url("//cdn.avatar.clubpenguin.com:80/{swid}/cp?size=60"), url("img/avatar.png"); background-size: 60px 60px; top: 4px; left: -5px;"> </div> <span style="position:relative; display: inline-flex; color: white; font-size: 14px; top: -100px; left: 140px; text-align: center"><b>{name}</b></span> <div class="f-search-button" style="top:-90px; width:150px; left: 100px;"><b style="position:relative; display: inline-flex; color: white; font-size: 14px; top: 0px; left: 0px; text-align: center;">Send friend request!</b></div></div>',
    defaultRequestTemplate : '<div class="f-search-result-box"><div id="rs{swid}" class="avatar" style="height: 60px; width: 60px; background-image: url(\'//cdn.avatar.clubpenguin.com:80/{swid}/cp?size=60\'), url(\'img/avatar.png\'); background-size: 60px 60px; top: 4px; left: -15px;"> </div> <span style="position:relative; display: inline-flex; color: white; font-size: 14px; top: -100px; left: 160px; text-align: center"><b>{name}</b></span><div id="f-accept-button" class="f-search-button" style="top:-90px; width: 100px; left: 80px;"><b style="position:relative; display: inline-flex; color: white; font-size: 12px; top: 1px; left: 0px; text-align: center;">+Accept Request</b></div><div id="f-reject-button" class="f-search-button" style="top:-114px; width: 100px; left: 210px;"><b style="position:relative; display: inline-flex; color: white; font-size: 12px; top: 1px; left: 0px; text-align: center;">Reject Request</b></div></div>',
    
    init : function (friendList, client) {
        this.friendList = friendList;
        this.clientSelector = client;

        this.cpClient = function () {
            return $($.Timeline.Friends.clientSelector);
        };
        
        this.friendLoader = this.friendList.find("#f-loader");
        this.friendListBody = this.friendList.find('#f-body');
        this.friendsSearch = this.friendList.find("#f-search-box");
        this.friendRequests = this.friendList.find("#f-requests");
        
        this.friendsSearch.animate({top: '500px', display:'none'}, function() {$(this).fadeOut();})
        
        // set dragger?
        this.friendList.draggable({containment: 'window'});
        
        $('#f-close').on('click', function () {
            $.Timeline.Friends.friendList.fadeOut(500);
        });
        
        this.friendsSearch.find(".f-s-pmd-bar").on('click', function (){
            $.Timeline.Friends.friendsSearch.animate({top: '500px', display:'none'}, function() {$(this).fadeOut();})
            $.Timeline.Friends.friendsSearch.find('.f-s-result').html('');
            
            $.Timeline.Friends.searching_for_friend = false;
            $.Timeline.Friends.friendList.find("#f-search-input").attr('disabled', false);
            $.Timeline.Friends.friendList.find(".f-search-button").css({'cursor' : 'pointer'});
        });
        
        $("#f-search .f-search-button").on('click', function(){
            if ($.Timeline.Friends.searching_for_friend) return;
            
            $.Timeline.Friends.searching_for_friend = true;
            var search_penguin_name = $.Timeline.Friends.friendList.find("#f-search-input").val();
            if (search_penguin_name == '') return ($.Timeline.Friends.searching_for_friend = false);
            
            $.Timeline.Friends.friendList.find("#f-search-input").attr('disabled', true);
            $.Timeline.Friends.searchPenguin(search_penguin_name);
            
            $.Timeline.Friends.friendsSearch.find('.f-s-result').html('');
            $(this).css({'cursor' : 'default'});

            $.Timeline.Friends.cpClient().ASCall('searchForPlayer', search_penguin_name);
        });
        
        $("#open-f-r").on('click', function( ){
            if (!$.Timeline.Friends.friendRequests.is(':visible')) 
                $.Timeline.Friends.friendRequests.fadeIn(1000);
        });
        
        $("#close-f-r").on('click', function(){
            $.Timeline.Friends.friendRequests.fadeOut(1000);
        });
        
        this.friendRequests.find('.f-s-pmd-bar').on('click', function(){
             $.Timeline.Friends.friendRequests.fadeOut(500);
        });
        
        this.friendLoader.fadeOut('slow', function () {$.Timeline.Friends.friendListBody.fadeIn('slow');});
        this.friendRequests.fadeOut(500, function() {$.Timeline.Friends.friendRequests.find('.f-loader').fadeOut();});
    },
    
    searchPenguin : function (peng) {
        this.friendsSearch.fadeIn(20, function(){$(this).animate({top: '287px'})});
        this.friendsSearch.find('.f-loader').fadeIn(10);
    },
    
    newFriendRequest : function ()
    {
        var request = $(this);
        var _request;
        
        var swid = '{' + $(this).parent().find('.avatar').attr('id').substr(1) + '}';

        if ((_request = $.Timeline.Friends.getRequest(undefined, swid)) != null) {
            // accept friendship
            $.Timeline.Friends.acceptFriendship(swid);
        } else {
            // send new request!
            $.Timeline.Friends.cpClient().ASCall('outgoingFriendRequest', swid);
        }
    },
    
    appendRequest : function (swid, name) {
        var request;
        if ((request = this.getRequest(undefined, swid)) != null)
            return;
        
        var requestBOX = this.friendRequests.find('.f-s-request');
        requestBOX.append(this.defaultRequestTemplate.supplant({swid:swid.slice(1, -1), name:name}));
        var request = requestBOX.find('#rs{}'.format(swid.slice(1, -1)));
        request.attr('style', "height: 60px; width: 60px; background-image: url('//cdn.avatar.clubpenguin.com:80/{swid}/cp?size=60'), url('img/avatar.png'); background-size: 60px 60px; top: 4px; left: -15px;".supplant({swid: swid}));
        
        var p = request.parent();
        
        p.find('#f-accept-button').on('click', $.Timeline.Friends.acceptFriendship);
        p.find('#f-reject-button').on('click', $.Timeline.Friends.rejectFriendship);
        
        p.id = undefined;
        p.swid = swid;
        p.name = name;
        
        this.requests.push(p);

        if (!$.Timeline.Friends.friendRequests.is(':visible')) $.Timeline.Friends.friendRequests.fadeIn(1000);
    },
    
    acceptFriendship : function () {
        var request;
        var swid = '{' + $(this).parent().find('.avatar').attr('id').substr(2) + '}';

        if ((request = $.Timeline.Friends.getRequest(undefined, swid)) == null) return;
        
        request.remove();
        $.Timeline.Friends.requests.splice($.Timeline.Friends.requests.indexOf(request), 1);

        $.Timeline.Friends.cpClient().ASCall('incomingRequestResponse', swid, 1);
        
    },
    
    rejectFriendship : function () {
        var request;
        var swid = '{' + $(this).parent().find('.avatar').attr('id').substr(3) + '}';
        
        if ((request = $.Timeline.Friends.getRequest(undefined, swid)) == null) return;
        request.remove();
        $.Timeline.Friends.requests.splice($.Timeline.Friends.requests.indexOf(request), 1);

        $.Timeline.Friends.cpClient().ASCall('incomingRequestResponse', swid, 0);
    },
    
    searchResults : function (result) {
        if (!this.searching_for_friend)
            return;
        
        this.searching_for_friend = false;
        
        var resultDOM = this.friendsSearch.find('.f-s-result');
        resultDOM.html('');
        
        try {
            var jsonDATA = $.parseJSON(result);
            
            for(var i = 0; i < jsonDATA.length; i++) {
                var peng = jsonDATA[i];
                var swid = !!peng['swid'] ? peng['swid'].slice(1, -1) : 'mod-{}'.format(peng['nickname'].replace(/ /g, '-'));
                var name = peng['nickname'];
                
                console.info(name);
                console.info("swid: {}, name: {}".format(swid, name));
                
                resultDOM.append(this.defaultSearchResultTemplate.supplant({swid:swid, name:name}));
                var request = resultDOM.find('#s{}'.format(swid));
                request.attr('style', 'height: 60px; width: 60px; background-image: url("//cdn.avatar.clubpenguin.com:80/{swid}/cp?size=60"), url("img/avatar.png"); background-size: 60px 60px; top: 4px; left: -5px;'.supplant({swid: swid}));
                
                var p = request.parent();
                
                if (!peng['swid']) {
                    var span = $(p.children()[1]);
                    var msg = $(p.find('.f-search-button'));
                    var b = $(p.find('b')[1]);
                    
                    console.log([span, msg, b]);
                    console.log(request.children());
                    
                    b.attr('style', 'position:relative; display: inline-flex; color: white; font-size: 11px; top: 0px; left: 0px; text-align: center;');
                    msg.attr('style', 'top: -105px; width: 210px; left: 100px; cursor: default; height: 50px;');
                    span.attr('style', 'position:relative; display: inline-flex; color: white; font-size: 14px; top: -110px; left: 100px; text-align: center');
                    
                    b.html(peng['msg']);
                } else {
                    p.find('.f-search-button').on('click', $.Timeline.Friends.newFriendRequest);
                }
            }
            
        } catch (e) {
            resultDOM.text("Oops! An error occured while searching. Please try again or contact support. E:" + e);
        }
        
        this.friendsSearch.find('.f-loader').fadeOut(100); resultDOM.fadeIn(50);
        
        $.Timeline.Friends.friendList.find("#f-search-input").attr('disabled', false);
        $("#f-search .f-search-button").css({'cursor' : 'pointer'});
    },
    
    append : function (name, swid, id, isOnline, isBFF, invalidate) {
        var exists = this.get(id, swid) != null;
        if (exists)
            return this.changeOnline(exists.swid, isOnline);
        
        var friendHTML = this.defaultFriendTemplate.supplant({id : id, swid: swid, name: name});
        this.friendListBody.append(friendHTML);
        
        var friend = this.friendListBody.find("#p{}".format(id));
        this.friends.push(friend);
        
        friend.attr('style', 'background-image: url("//cdn.avatar.clubpenguin.com:80/{}/cp?size=88"), url("img/avatar.png"); background-size: 88px 88px;'.format(swid));
        
        console.log("Friend # " + name);
        
        friend.id = id;
        friend.swid = swid;
        friend.attr('swid', swid);
        friend.attr('p-name', name);

        friend.name = name;
        friend.isOnline = isOnline;
        friend.isBFF = Number(isBFF);

        invalidate ? this.invalidate() : undefined;
    },
    
    invalidate : function () {
        this.friendListBody.fadeOut('fast');
        this.friendLoader.fadeIn('fast');
        
        var _friends = this.friends.slice();
        var _data = {
            _online: [],
            _offline: [],
            _o_bff: [], 
            _o_no_bff: [], 
            _bff: [], 
            _no_bff: []
        };
        
        for (var i = 0; i < _friends.length; i++) {
            var f = _friends[i];
            var _x = (f.isOnline ? '' : '_o') + '_' + (f.isBFF ? '' : 'no_') + 'bff';
            
            _data[_x].push(f);            
            
            f.find("#bff-stripe").attr('class', (f.isBFF ? '' : 'no-') + 'bff');  
            f.attr('class', (f.isOnline ? 'avatar' : 'avatar offline'));
            
            f.remove();
        }
        
        _data._online = _data._bff.concat(_data._no_bff);
        _data._offline = _data._o_bff.concat(_data._o_no_bff);
        
        _friends = _data._online.concat(_data._offline);
        
        this.friends = _friends;
        $.each(this.friends, function(i, f) {
           $.Timeline.Friends.friendListBody.append(f);
        });
        
        $('#f-count').text(this.friends.length.toLocaleString(undefined, {minimumIntegerDigits: 2}));
        $("#bff-stripe").off('click').on('click', function() {
            var isBFF = $(this).attr('class').indexOf('no-') == -1;
            var swid = $(this).parent().attr('swid');

            $.Timeline.Friends.cpClient().ASCall('changeBFFStatus', swid, !isBFF);
        });

        $('.avatar').off('click').on('click', function(){
            $.Timeline.Friends.cpClient().ASCall('openPlayerCard', $(this).attr('id').substr(1), $(this).attr('p-name'));
        });
        
        this.friendLoader.fadeOut('slow', function () {$.Timeline.Friends.friendListBody.fadeIn('slow');});
    },
    
    remove : function (swid) {
        var friend;
        
        if ((friend = this.get(undefined, swid)) == null)
            return;
        
        friend.remove();
        this.friends.splice(this.friends.indexOf(friend), 1);
        this.invalidate();
    },
    
    changeOnline : function (swid, isOnline, status) {
        var friend;
        
        if ((friend = this.get(undefined, swid)) == null)
            return;
        
        friend.isOnline = isOnline;
        friend.find("#status").html(isOnline ? status : 'Offline');
        
        this.invalidate();
    },
    
    changeBFF : function (swid, isBFF) {
        var friend;
        
        if ((friend = this.get(undefined, swid)) == null)        
            return;
        
        friend.isBFF = Number(isBFF);
        this.invalidate();
    },
    
    get : function (id, swid) {
        var _id = !!id;
        var _swid = !!swid;
        
        for (var i = 0; i < this.friends.length; i++) {
            var friend = this.friends[i];
            if ((_id && id == friend.id) || (_swid && swid == friend.swid))
                return friend;
        }
        
        return null;
    },
    
    getRequest : function (id, swid) {
        var _id = !!id;
        var _swid = !!swid;
        
        for (var i = 0; i < this.requests.length; i++) {
            var _request = this.requests[i];
            if ((_id && id == _request.id) || (_swid && swid == _request.swid))
                return _request;
        }
        
        return null;
    }
};

$(document).ready( function () {
    var flist = $('#friends-list');
    ($.Timeline = window.Timeline = {'Friends': TimelineFriends}).Friends.init(flist, "#club_penguin");
});

String.prototype.format = function () {
  var i = 0, args = arguments;
  return this.replace(/{}/g, function () {
    return typeof args[i] != 'undefined' ? args[i++] : '';
  });
};

String.prototype.supplant = function (o) {
    return this.replace(/{([^{}]*)}/g,
        function (a, b) {
            var r = o[b];
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        }
    );
};

(function ($) {
    $.fn.ASCall = function() {
        var func = arguments[0];
        var args = Array.prototype.slice.call(arguments, 1);
        return $(this)[0][func].apply(null, args);
    };
})(jQuery);