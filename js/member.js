// Initialize Firebase
	  var config = {
	    apiKey: "AIzaSyAZ-aRSrRKHBXDuV0I2A2tdBvtcsTg2qMk",
	    authDomain: "timeline-0002.firebaseapp.com",
	    projectId: "timeline-0002"
	  };
	  firebase.initializeApp(config);

var actionCodeSettings = {
  // URL you want to redirect back to. The domain (www.example.com) for this
  // URL must be whitelisted in the Firebase Console.
  url: 'http://play.localhost/member',
  // This must be true.
  handleCodeInApp: true,
};

window.Timeline = $.Timeline = {flex : {}};
var Timeline = window.Timeline;

function showAlert(txt) {
	$('.main.ui').dimmer('show');
    $('.verify-mail, .nickname-setup, .dim-load').transition('hide');

    $('.alert-txt').text(txt);
    $('.close-alert-txt').text('Close');

    $('.close-alert').off('click').on('click', function(){
    	$('.main.ui').dimmer('hide');
    	$('.alert-txt').transition('hide');
    	$('.close-alert').off('click');
    });
    $('.signin-status').text(!!firebase.auth().currentUser ? 'Signed-in' : 'Signed-Out');
    $('.error-alert').transition('hide').transition('shake');
}

Timeline.flex.notify = function (title, txt, icon) {
	if (Notification && Notification.permission == 'granted') {
		new Notification( "Timeline - " + Title, {
	      icon: icon,
	      body: txt,
	    });
	}
}

Timeline.flex.request = async function (url, data, success, error) {
	var _s = function (r) {
		$('.error-list').html('');
		if ('error' in r) {
			for (var er in r.error) {
				e = $('<div class="ui segment red secondary"><div class="ui header"></div><div class="content"></div></div>"');
				e.find('.header').text(er);
				e.find('.content').text(r.error[er]);

				$('.error-list').append(e);
			}
		}

		return (success || Object)(r);
	}

	if (!!!data || !!!data.idToken) {
		data = !!!data ? {} : data;
		Timeline.flex.CurrentSignature = data.idToken = data.signature = firebase.auth().currentUser ? (await firebase.auth().currentUser.getIdToken()) : undefined;
	}

	request = {
		url: "http://localhost:2086/" + url,
		type: 'post',
		xhrFields: {withCredentials: true },
		data: JSON.stringify({'fuckme':'null'}),
		success: _s,
		error: error
	};

	request.data = !!data ? JSON.stringify(data) : undefined;
	request.contentType = request.type == 'post' ? 'application/json' : undefined;

	return $.ajax(request);
}

Timeline.flex.requestUser = async function (url, data, success, error, swid) {
	swid = swid || Timeline.ActiveUser.claims.swid;
	return await Timeline.flex.request(('flex/user/' + swid + '/' + url), data, success, error);
}

Timeline.flex.get = async function (url, data, success, error) {
	var _s = function (r) {
		if ('error' in r) {
			$('.error-list').html('');
			for (var er in r.error) {
				e = $('<div class="ui segment red secondary"><div class="ui header"></div><div class="content"></div></div>"');
				e.find('.header').text(er);
				e.find('.content').text(r.error[er]);

				$('.error-list').append(e);
			}
		}

		return success(r);
	}

	request = {
		url: "http://localhost:2086/" + url,
		type: 'get',
		xhrFields: {withCredentials: true },
		data: JSON.stringify({'fuckme':'null'}),
		success: _s,
		error: error
	};

	request.data = data

	return $.ajax(request);
}

firebase.auth().onAuthStateChanged(async function(user) {
	$('.main.ui > .dimmer>.loader').html('User session changed');
     $('.main.ui, .main2').dimmer('show');
    $('.dim-load').fadeIn();
    $('.verify-mail, .nickname-setup, .error-alert').transition('hide');

    $('.error-list').html('');

  if (user) {
  	console.info('[Timeline] User session found.');
  	console.log(user);

  	if (!!Timeline.ActiveUser) {
  		console.info("[Timeline] User changed. Redirecting to login page");
  		$('.main.ui > .dimmer>.loader').html('Active account changed. Redirecting to login page.');

  		window.location.href = "/member";
  		return;
  	}

  	$('.main.ui > .dimmer>.loader').html('Loading account');
  	// set login provider

  	var idTokenResult = await firebase.auth().currentUser.getIdTokenResult();
  	var loginProvider = idTokenResult.signInProvider;
  	if (loginProvider == 'password') {
  		$('.login-provider').html('<i class="lock icon"></i>Password');
  		$('.login-provider').attr('class', 'ui label labelled small login-provider green');
  	} else if (loginProvider == 'google.com') {
  		$('.login-provider').attr('class', 'ui label labelled small login-provider red');
  		$('.login-provider').html('<i class="google icon"></i>Google');
  	} else if (loginProvider == 'twitter.com') {
  		$('.login-provider').attr('class', 'ui label labelled small login-provider blue');
  		$('.login-provider').html('<i class="twitter icon"></i>Twitter');
  	} else if (loginProvider == 'github.com') {
  		$('.login-provider').attr('class', 'ui label labelled small login-provider black');
  		$('.login-provider').html('<i class="github icon"></i>GitHub');
  	}

  	// check login
  	Timeline.flex.request('flex/login/status', {}, async function(r){
  		if (!!r.error) {
  			console.error("[Timeline] Unable to verify login.");
			console.error(r.error);
			$('.main.ui').dimmer('hide');
			$('.main.ui').dimmer('show');
		    $('.main.ui > .dimmer>.loader').html('Unable to verify login. Redirecting.');
		    !!firebase.auth().currentUser ? firebase.auth().signOut() : undefined;
		    var x = function() {
    		window.location.href = "/member";
		    	return
		    }
		    Timeline.flex.request('flex/user/signout', undefined, x, x);

		    return;		    
  		}

  		$('.profile-join').text((new Date(firebase.auth().currentUser.metadata.creationTime)).toLocaleDateString('en-EN', {year:'numeric', month:'long', day:'numeric'}));
  		$('.profile-mail-notification, .profile-member').popup();

  		Timeline.ActiveUser = idTokenResult;
  		Timeline.FirstTime = Timeline.FirstTimeFriend = true;
  	}, 
  	function(e){
  		console.error("[Timeline] Unable to verify login.");
		console.error(e);
		$('.main.ui').dimmer('hide');
		$('.main.ui').dimmer('show');
	    $('.main.ui > .dimmer>.loader').html('Unable to verify login. Redirecting.');
	    !!firebase.auth().currentUser ? firebase.auth().signOut() : undefined;
	    var x = function() {
    	window.location.href = "/member";
	    	return
	    }
	    Timeline.flex.request('flex/user/signout', undefined, x, x);
  	});


  } else {
  	console.info('[Timeline] Session state: User signed out.');
  	console.info("[Timeline] Announcing to server, and loging out.");

  	$('.main.ui > .dimmer>.loader').html('Signing out');
    $('.main.ui, .main2').dimmer('show');

    var x = function() {
    	window.location.href = "/member";
    	return
    }
    Timeline.flex.request('flex/user/signout', undefined, x, x);
  }
});

Timeline.flex.getCurrentSignature = function () {
	return Timeline.flex.CurrentSignature;
}

Timeline.flex.getLoginServer = function () {
	return {ip: "127.0.0.1", port: 6112};
}

Timeline.flex.getWorldServer = function () {
	return {
		100: {name:"TimeFlex", ip: "127.0.0.1", is_safe: false, port: 9875, id:100}
	}
}


Timeline.forceRefreshPlay = function () {
	var html = $('.play.ui').html();
	$('.play.ui').html('');
	$('.play.ui').html(html);
	$('.refresh-forced').off('click').on('click', Timeline.forceRefreshPlay);
}

Timeline.flex.randomWorld = function () {
	var worlds = Timeline.flex.getWorldServer();
    var keys = Object.keys(worlds)

    return worlds[keys[ keys.length * Math.random() << 0]];
}

var DOIT;
$(function(){
	var accountRefreshInterval = 30, friendRefreshInterval = 10;
	var iA = 0, iF = 0;
	$('.sign-out-btn').off('click').on('click', function(){
		!!firebase.auth().currentUser ? firebase.auth().signOut() : undefined;
	});

	$('.home-btn').off('click').on('click', function(){
		if ($('.home-btn').hasClass('active')) return;

		$('.main.ui').transition('show');
		$('.play.ui').transition('hide');

		$('.action-btn').removeClass('active').removeClass('teal');
		$('.home-btn').addClass('active').addClass('teal');
	});

	$('.play-btn').off('click').on('click', function(){
		if ($('.play-btn').hasClass('active')) return;

		$('.home-btn').off('click').on('click', function(){
			$('.main.ui').modal("show");
		});

		Timeline.flex.request('flex/login/');

		$('.main.ui').transition('hide');
		$('.play.ui').transition('show');

		$('.action-btn').removeClass('active').removeClass('teal');
		$('.play-btn').addClass('active').addClass('teal');

		if ($('.play.ui > object').length < 1) {
			var login_object = '<div class="ui black label large button refresh-forced"><i class="sync alternate icon"></i>Relogin the game</div><object id="club_penguin" name="club_penguin" data="http://media1.localhost/play/v2/client/club_penguin.swf" width="100%" style="height: 100% !important;"> <param name="menu" value="false"> <param name="quality" value="high"> <param name="allowscriptaccess" value="always"> <param name="flashvars" value="play=http://media1.localhost/play/&amp;nau={USER_LOGIN_DATA}&amp;client=http://media1.localhost/play/v2/client/&amp;content=http://media1.localhost/play/v2/content/&amp;games=http://media1.localhost/play/v2/games/&amp;connectionID=cp22479&amp;lang=en&amp;a=0&amp;p=1&phrasechat=http://media1.localhost/social/autocomplete/v2/search/suggestions/"> </object>';
			login_object = login_object.replace("{USER_LOGIN_DATA}", "Woof");
			$('.play.ui').html(login_object);
			$('.refresh-forced').off('click').on('click', Timeline.forceRefreshPlay);

		}
	});

	DOIT = setInterval(
		async function () {
			if (!!Timeline.ActiveUser) {
				if (! (iA++ % accountRefreshInterval)) {
					console.log("[Timeline reload] Refreshing account data");
					await firebase.auth().currentUser.reload();
					$('.user-display-name').text(firebase.auth().currentUser.displayName);

					getDataUri('//localhost:5050/' + encodeURI(Timeline.ActiveUser.claims.swid) + '/cp?cache='+Date.now(), function(img){
						$('.user-avatar').attr('src', img);
					});

					getDataUri('//localhost:5050/' + encodeURI(Timeline.ActiveUser.claims.swid) + '/cp?size=300&cache='+Date.now(), function(img){
						$('.profile-img').attr('src', img);
					});
					$('.profile-email').text(firebase.auth().currentUser.email);
					// get data, refresh local content
					Timeline.flex.requestUser('detail', {}, function (r) {
						console.log(r);
						if (!!!r.error) {
							var member = r['member.data'];
							expire = new Date(member.expire || firebase.auth().currentUser.metadata.creationTime);
							since = new Date(member.since || firebase.auth().currentUser.metadata.creationTime);
							if (expire < Date.now()) {
								$('.profile-member-stats').text("Expired on " + expire.toLocaleDateString('en-EN', {year:'numeric', month:'long', day:'numeric'}));
								$('.profile-member').attr('data-title', 'Non-member');
								$('.profile-member').attr('data-content', 'Membership expired');
								$('.profile-member').attr('class', 'ui right corner label profile-member');
							} else {
								$('.profile-member-stats').text("Expires on " + expire.toLocaleDateString('en-EN', {year:'numeric', month:'long', day:'numeric'}));
								$('.profile-member').attr('data-title', 'Member');
								$('.profile-member').attr('data-content', 'Member since ' + since.toLocaleDateString('en-EN', {year:'numeric', month:'long', day:'numeric'}));
								$('.profile-member').attr('class', 'ui right corner label yellow profile-member');
							}

							$('.profile-coin').text(r['coins.count']);

							var postcount = r['mail.count'];
							if (postcount > 0) {
								$('.profile-mail-notification').text(postcount);
								$('.profile-mail-notification').hasClass('hidden') ? $('.profile-mail-notification').transition('slide right') : undefined;
							} else {
								$('.profile-mail-notification').text(postcount);
								$('.profile-mail-notification').hasClass('hidden') ? undefined : $('.profile-mail-notification').transition('slide right');
							}
							if (!!r['moderator.data']) {
								$('.profile-moderator').hasClass('hidden') ? $('.profile-moderator').transition('slide right') : undefined;
								$('.profile-moderator').text(r['moderator.data'].meta || 'Moderator');
							}
						}

						if (Timeline.FirstTime) {
							Timeline.FirstTime = undefined;
							$('.main.ui, .main2').dimmer('hide');
							$('.timeline-modal')
						        .modal({blurring: true})
						        .modal('setting', 'transition', 'horizontal flip')
								.modal('attach events', '.link-account-btn', 'show').modal('hide');
						}
					}, function (e){
						console.error("[Timeline] Unable to fetch data.");
						console.error(e);
						if ($('.custom-msg-err').length == 0) {
							e = $('<div class="ui segment red secondary custom-msg-err"><div class="ui header"></div><div class="content"></div></div>"');
							$('.error-list').append(e);
						}
						else 
							e = $('.custom-msg-err');

						e.find('.header').text('Error fetching user data');
						e.find('.content').text(e);					

					});

					Timeline.flex.requestUser('coins', {}, function(r){
						console.log(r);
						if (!!!r.error) {
							Timeline.CoinHistory = !!Timeline.CoinHistory ? Timeline.CoinHistory : {};
							for (var tid in r['coins.data']) {
								if (!!!Timeline.CoinHistory[tid]) {
									Timeline.CoinHistory[tid] = r['coins.data'][tid];

									var coinTransaction = $('<tr><td class="transaction-txt">Pet Puffle Adoption. Puffle: 1007</td><td class="coin-amt">-800</td></tr>');
									coinTransaction.find('.transaction-txt').text(r['coins.data'][tid].comment);
									coinTransaction.find('.coin-amt').text((r['coins.data'][tid].transaction < 0 ? '' : '+') + r['coins.data'][tid].transaction);
									coinTransaction.addClass(r['coins.data'][tid].transaction < 0 ? 'negative' : 'positive');

									$('.coin-history').prepend(coinTransaction);
								}
							}

							$('.coin-hi').hasClass('loading') ? $('.coin-hi').removeClass('loading') : undefined;
						}
					}, function(e){
						console.error("[Timeline] Unable to fetch coins data.");
						console.error(e);
						if ($('.custom-msg-err').length == 0) {
							e = $('<div class="ui segment red secondary custom-msg-err"><div class="ui header"></div><div class="content"></div></div>"');
							$('.error-list').append(e);
						}
						else 
							e = $('.custom-msg-err');

						e.find('.header').text('Error fetching user data');
						e.find('.content').text(e);	
					});

					Timeline.flex.requestUser('bans', {}, function(r){
						console.log(r);
						if (!!!r.error) {
							Timeline.BanHistory = !!Timeline.BanHistory ? Timeline.BanHistory : {};
							for (var tid in r['bans.data']) {
								if (!!!Timeline.BanHistory[tid]) {
									Timeline.BanHistory[tid] = r['bans.data'][tid];

									var coinTransaction = $('<tr> <td class="collapsing mod-txt"> Rockhopper </td> <td class="comment-txt">Bad word</td> <td class="expire-txt">12 Feb 2013</td> <td class="right aligned collapsing since-txt">12 Feb 2015</td> </tr>');
									coinTransaction.find('.mod-txt').text(r['bans.data'][tid].moderator);
									coinTransaction.find('.comment-txt').text(r['bans.data'][tid].comment);
									coinTransaction.find('.expire-txt').text(r['bans.data'][tid].expire);
									coinTransaction.find('.since-txt').text(r['bans.data'][tid].since);

									$('.ban-history').prepend(coinTransaction);
								}
							}

							!$('.ban-dim').hasClass('hidden') ? $('.ban-dim').addClass('transition hidden') : undefined;
						}
					}, function(e){
						console.error("[Timeline] Unable to fetch coins data.");
						console.error(e);
						if ($('.custom-msg-err').length == 0) {
							e = $('<div class="ui segment red secondary custom-msg-err"><div class="ui header"></div><div class="content"></div></div>"');
							$('.error-list').append(e);
						}
						else 
							e = $('.custom-msg-err');

						e.find('.header').text('Error fetching user data');
						e.find('.content').text(e);	
					});

					var LinkProviderRefresh = function () {
						var GoogleAuth = new firebase.auth.GoogleAuthProvider();
						var TwitterAuth = new firebase.auth.TwitterAuthProvider();
						var GitHubAuth = new firebase.auth.GithubAuthProvider();

						var providers = {};

						for (var authProvider in firebase.auth().currentUser.providerData) {
							authProvider = firebase.auth().currentUser.providerData[authProvider];
							var id = authProvider.providerId;
							providers[id] = authProvider;
						}

						console.log(providers);
						var linkWithAuth = function(AuthProvider) { 
							console.info("[Timeline] Account linking inititated - " + AuthProvider.providerId);
							$('.timeline-modal').modal('hide');
							$('.main.ui > .dimmer>.loader').html('Link account');
							$('.main.ui').dimmer('show');

							firebase.auth().currentUser.linkWithPopup(AuthProvider).then(function(result) {
							  // Accounts successfully linked.
							  var credential = result.credential;
							  var user = result.user;
							  console.info("[Timeline] Account linking success");
							  Timeline.showModal = true;
							  LinkProviderRefresh();
							}).catch(function(error) {
								console.error("[Timeline] Account linking failed");
								console.error(error);
								showAlert("Unable to link account.");
								$('.close-alert').on('click', function() {
									$('.timeline-modal').modal('show');
								})

								$('.error-list').html('');
								e = $('<div class="ui segment red secondary"><div class="ui header"></div><div class="content"></div></div>"');
								e.find('.header').text(error.code);
								e.find('.content').text(error.message);

								$('.error-list').append(e);
							});
						};

						var unlinkProvider = function(AuthProvider) {
							console.info("[Timeline] Account unlinking inititated - " + AuthProvider.providerId);
							$('.timeline-modal').modal('hide');
							$('.main.ui > .dimmer>.loader').html('Unlink account');
							$('.main.ui').dimmer('show');

							firebase.auth().currentUser.unlink(AuthProvider.providerId).then(function() {
								console.info("[Timeline] Account unlinking success");
								if (AuthProvider.providerId == Timeline.ActiveUser.signInProvider) {
									showAlert("You chose to unlink provider you currently signed in with. You will no longer be able to signin using this provider once signed out.");
									$('.close-alert').on('click', function(){
										$('.timeline-modal').modal('show');
									});
								} else
							  		Timeline.showModal = true;
							  LinkProviderRefresh();
							}).catch(function(error) {
								$('.main.ui').dimmer('hide');
								console.error("[Timeline] Account unlinking failed");
								console.error(error);
							  showAlert("Unable to unlink account.");
								$('.close-alert').on('click', function() {
									$('.timeline-modal').modal('show');
								})

								$('.error-list').html('');
								e = $('<div class="ui segment red secondary"><div class="ui header"></div><div class="content"></div></div>"');
								e.find('.header').text(error.code);
								e.find('.content').text(error.message);

								$('.error-list').append(e);
							});
						}

						if (providers['google.com']) {
							$('.google-link-txt').html('Linked to <label class="ui label">'+providers['google.com'].email+'</label>');
							$('.google-link-btn').html('<i class="chain broken icon"></i> Unlink</button>');
							$('.google-link-btn').off('click').on('click', function() {
								unlinkProvider(GoogleAuth);
							});
						} else {
							$('.google-link-txt').html('- Not linked -');
							$('.google-link-btn').html('<i class="chain icon"></i> Link</button>');
							$('.google-link-btn').off('click').on('click', function() {
								linkWithAuth(GoogleAuth);
							});
						}

						if (providers['twitter.com']) {
							$('.twitter-link-txt').html('Linked to <label class="ui label">'+providers['twitter.com'].email+'</label>');
							$('.twitter-link-btn').html('<i class="chain broken icon"></i> Unlink</button>');
							$('.twitter-link-btn').off('click').on('click', function() {
								unlinkProvider(TwitterAuth);
							});
						} else {
							$('.twitter-link-txt').html('- Not linked -');
							$('.twitter-link-btn').html('<i class="chain icon"></i> Link</button>');
							$('.twitter-link-btn').off('click').on('click', function() {
								linkWithAuth(TwitterAuth);
							});
						}

						if (providers['github.com']) {
							$('.github-link-txt').html('Linked to <label class="ui label">'+providers['github.com'].email+'</label>');
							$('.github-link-btn').html('<i class="chain broken icon"></i> Unlink</button>');
							$('.github-link-btn').off('click').on('click', function() {
								unlinkProvider(GitHubAuth);
							});
						} else {
							$('.github-link-txt').html('- Not linked -');
							$('.github-link-btn').html('<i class="chain icon"></i> Link</button>');
							$('.github-link-btn').off('click').on('click', function() {
								linkWithAuth(GitHubAuth);
							});
						}

						if (Timeline.showModal) {
							$('.timeline-modal').modal('show');
							$('.main.ui').dimmer('hide');
							Timeline.showModal = undefined;
						}
					}

					LinkProviderRefresh();

						/*auth.currentUser.linkWithPopup(provider).then(function(result) {
					  // Accounts successfully linked.
					  var credential = result.credential;
					  var user = result.user;
					  // ...
					}).catch(function(error) {
					  // Handle Errors here.
					  // ...
					});*/
					
					iA = 1;
				}

				if (! (iF++ % friendRefreshInterval)) {
					// get and set friends data
					Timeline.flex.requestUser('friends', {}, function (r) {
						console.log(r);
						if (!!!r.error) {
							$('.profile-friends-count').text(r['friend.count']);

							if (Timeline.FirstTimeFriend) ; // Show request count, don't show individual request popup
						}

					}, function (e){
						console.error("[Timeline] Unable to fetch friend data.");
						console.error(e);
						if ($('.custom-msg-err').length == 0) {
							e = $('<div class="ui segment red secondary custom-msg-err"><div class="ui header"></div><div class="content"></div></div>"');
							$('.error-list').append(e);
						}
						else 
							e = $('.custom-msg-err');

						e.find('.header').text('Error fetching user data');
						e.find('.content').text(e);					

					});
					iF = 1;
				}
			}
		}
	, 1000);
});


function getDataUri(url, callback) {
    var image = new Image();
    image.crossOrigin = '*'

    image.onload = function () {
        var canvas = document.createElement('canvas');
        canvas.width = this.naturalWidth; // or 'width' if you want a special/scaled size
        canvas.height = this.naturalHeight; // or 'height' if you want a special/scaled size

        canvas.getContext('2d').drawImage(this, 0, 0);

        // Get raw image data
        //callback(canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, ''));

        // ... or get as Data URI
        callback(canvas.toDataURL('image/png'));
        delete canvas;
    };

    image.src = url;
}