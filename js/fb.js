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

		return success(r);
	}

	if (!!!data || !!!data.idToken) {
		data = !!!data ? {} : data;
		data.idToken = firebase.auth().currentUser ? (await firebase.auth().currentUser.getIdToken()) : undefined;
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

Timeline.flex.login = function (idToken) {
	$('.main.ui').dimmer('show');
	$('.main.ui > .dimmer>.loader').html('Authenticating');

	Timeline.flex.request('flex/login/', {'idToken': idToken}, 
		function (s) {
			if ('error' in s) {
				if ('email.verify' in s.error) {
					console.error("[Timeline] Email verification pending.")
					$('.verify-email').text(firebase.auth().currentUser.email);
					$('.dim-load').fadeIn().transition('slide up');
					$('.verify-mail').fadeOut().transition('slide up').transition('jiggle');

					$('.verify-mail-resend').off('click').on('click', function () {
						$('.verify-mail-resend').addClass('disabled');
						$('.verify-mail-resend').off('click');
						$('.verify-mail-resend').text("Verification Email Sent");

						firebase.auth().currentUser.sendEmailVerification();
						console.info("[Timeline] Verification Email sent.");
					});
					var verifiedCheck = setInterval(function() {
						firebase.auth().currentUser.reload().then(function(){
							if (firebase.auth().currentUser.emailVerified) {
								clearInterval(verifiedCheck);

								$('.main.ui > .dimmer>.loader').html('Email verified. Logging in.');
								console.info("[Timeline] Email verified. Trying to relogin.");
							    $('.main.ui').dimmer('show');
							    $('.dim-load').transition('show');
							    $('.verify-mail, .nickname-setup, .error-alert').transition('hide');

							    firebase.auth().currentUser.getIdToken(true).then(function(idToken) {
							  		Timeline.flex.login(idToken);	
								}).catch(function(error) {
									console.error("[Timeline] Unable to login session.");
									console.error(error);
									!!firebase.auth().currentUser ? firebase.auth().signOut() : undefined;
									setTimeout(function(){showAlert('Unable to login. Please relogin.')}, 1000);
									$('.main.ui').dimmer('hide');
									$('.verify-mail').transition('hide');
								});
							}
						});
					}, 1000);
				} else if ('nickname.setup' in s.error) {
					console.error("[Timeline] Nickname setup pending.");
					var nicknameKey = s.error['nickname.setup'];

					$('.dim-load').transition('hide');
					$('.verify-mail, .error-alert').transition('hide');
					$('.nick-txt').attr('value', !!firebase.auth().currentUser.displayName ? firebase.auth().currentUser.displayName : '');
					$('.nickname-setup').transition('hide').transition('jiggle');

					var nicknameClick = function () {
						$('.nickname-set').off('click');

						console.info("[Timeline] Setting nickname.");
					    $('.main.ui').dimmer('show');
					    $('.main.ui > .dimmer>.loader').html('Setting nickname');
					    $('.dim-load').transition('show');
					    $('.verify-mail, .nickname-setup, .error-alert').transition('hide');

					    var nik = $('.nick-txt').val();

						Timeline.flex.request('flex/nickname/set/' + nicknameKey, {nickname:nik}, function(e) {
							if (e.error && 'key.expired' in e.error) {
								firebase.auth().currentUser.getIdToken(true).then(function(idToken) {
									console.info('[Timeline] Nickname key expired. Trying again.');
							  		Timeline.flex.login(idToken);	
								}).catch(function(error) {
									console.error("[Timeline] Unable to login session.");
									console.error(error);
									!!firebase.auth().currentUser ? firebase.auth().signOut() : undefined;
									setTimeout(function(){showAlert('Unable to login. Please relogin.')}, 1000);
									$('.main.ui').dimmer('hide');
									$('.verify-mail, .error-alert').transition('hide');
								});

								return;
							}

							if (e.success) {
								console.info('[Timeline] Nickname set successfully');
								$('.main.ui > .dimmer>.loader').html('Nickname set. Logging in');

								firebase.auth().currentUser.getIdToken(true).then(function(idToken) {
							  		Timeline.flex.login(idToken);	
								}).catch(function(error) {
									console.error("[Timeline] Unable to login session.");
									console.error(error);
									!!firebase.auth().currentUser ? firebase.auth().signOut() : undefined;
									setTimeout(function(){showAlert('Unable to login. Please relogin.')}, 1000);
									$('.main.ui').dimmer('hide');
									$('.verify-mail, .error-alert').transition('hide');
								});
							} else {
								console.error("[Timeline] Unable to set nickname.");
								console.error(e.error);
								showAlert('Please check your nickname. Fix the errors (in right bottom corner) and try again.');
								$('.close-alert-txt').text('Fix errors');
								$('.close-alert').off('click').on('click', function() {$('.error-alert').transition('hide')});

								$('.main.ui').dimmer('show');
							    $('.dim-load').transition('hide');
							    $('.verify-mail').transition('hide');
							    $('.nickname-setup').transition('show');

							    $('.nickname-set').off('click').on('click', nicknameClick);
							}
						},
						function (e) {
							console.error("[Timeline] Unable to initiate nickname change.");
							console.error(e);
							!!firebase.auth().currentUser ? firebase.auth().signOut() : undefined;
							setTimeout(function(){showAlert('Unable to login. Please relogin.')}, 1000);
							$('.main.ui').dimmer('hide');
							$('.main.ui').dimmer('show');
						    $('.dim-load').transition('show');
						    $('.verify-mail, .nickname-setup').transition('hide');
						});
					};

					$('.nickname-set').off('click').on('click', nicknameClick);

				} else {
					// auth failed / integrity error
				}
			} else {
				console.info("[Timeline] Authenticated. Logged in.");
				$('.main.ui > .dimmer>.loader').html('Login successful. Redirecting.');

				window.location.href = "/member/dashboard";
			}
		},

		function (e) {
			console.error("[Timeline] Unable to initiate login.");
			console.error(e);
			$('.main.ui').dimmer('hide');
			$('.main.ui').dimmer('show');
		    $('.dim-load').transition('show');
		    $('.verify-mail, .nickname-setup, .error-alert').transition('hide');
		    !!firebase.auth().currentUser ? firebase.auth().signOut() : undefined;
		    setTimeout(function(){showAlert('Unable to login. Please relogin.')}, 1000);
		}
	);

}

firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);

function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

var leup = function () {
	$('.submit').off('click');
			$('.main.ui').dimmer('show');
			$('.main.ui > .dimmer>.loader').html('Signing in');

			var _u = $('.login-user').val(), _p = $('.login-pass').val();

			if (validateEmail(_u)) {
				firebase.auth().signInWithEmailAndPassword(_u, _p);
			} else {
				$('.main.ui > .dimmer>.loader').html('Fetching email');
				Timeline.flex.request('flex/login/username', {username:btoa(_u), password:btoa(_p)}, function(r) {
					if (r.error) {
						console.error("[Timeline] Unable to login via password");
						console.error(r.error);

						if (r.error['login.integration']) {
							showAlert('Email linked with this user, is already linked to another account :-< Contact support, or login with email instead');
						} else {
							showAlert('Unable to log you in. Look up at left-bottom corner for error details.');
						}

						return;
					}

					email = r['login.email'];
					$('.main.ui > .dimmer>.loader').html('Signing in');
					firebase.auth().signInWithEmailAndPassword(email, _p);
				}, function(e){
					console.error("[Timeline] Unable to login via password");
					console.error(e);
					showAlert('Unable to inititate login process. Try again.');
				});
			}
}

firebase.auth().getRedirectResult().then(function(result) {
  // ¯\_(ツ)_/¯
}).catch(function(error) {
	console.error("[Timeline] Error sign-in via redirect.");
	console.error(error);
	console.log(error.code == 'auth/account-exists-with-different-credential');
	setTimeout(function(){
		if (error.code == 'auth/account-exists-with-different-credential') {
			showAlert('The email - ' + error.email + ' is alreay linked to another account. You can login to that account and "Link Account" instead, once linked you can login using this provider.');
		}

		$('.error-list').html('');
		e = $('<div class="ui segment red secondary"><div class="ui header"></div><div class="content"></div></div>"');
		e.find('.header').text(error.code);
		e.find('.content').text(error.message);

		$('.error-list').append(e);
	}, 1000);
});

firebase.auth().onAuthStateChanged(function(user) {
	$('.main.ui > .dimmer>.loader').html('User session changed');
     $('.main.ui').dimmer('show');
    $('.dim-load').fadeIn();
    $('.verify-mail, .nickname-setup, .error-alert').transition('hide');

    $('.error-list').html('');

    var GoogleAuth = new firebase.auth.GoogleAuthProvider();
	var TwitterAuth = new firebase.auth.TwitterAuthProvider();
	var GitHubAuth = new firebase.auth.GithubAuthProvider();

	
	$('.social-google').off('click').on('click', function(){
		$('.social-google').off('click');
		firebase.auth().signInWithRedirect(GoogleAuth);
	});
	$('.social-twitter').off('click').on('click', function(){
		$('.social-twitter').off('click');
		firebase.auth().signInWithRedirect(TwitterAuth);
	});
	$('.social-github').off('click').on('click', function(){
		$('.social-github').off('click');
		firebase.auth().signInWithRedirect(GitHubAuth);
	});

  if (user) {
  	console.info('[Timeline] Auth state changed: User signed in.');
  	$('.main.ui > .dimmer>.loader').html('User found. Fetching login key.');
  	console.log(user);

  	firebase.auth().currentUser.getIdToken(true).then(function(idToken) {
  		Timeline.flex.login(idToken);	
	}).catch(function(error) {
		console.error("[Timeline] Unable to login session.");
		console.error(error);
		!!firebase.auth().currentUser ? firebase.auth().signOut() : undefined;
		setTimeout(function(){showAlert('Unable to login. Please relogin.')}, 1000);
		$('.main.ui').dimmer('hide');

		$('.login-email-username-password').off('click').on('click', function() {
			leup()
		});
		$('.login-email-auth').off('click').on('click', function() {
			$('.submit').off('click');
			var _u = $('.login-user').val();

			$('.main.ui').dimmer('show');
			loginViaEmailAuth(_u);
			$('.verify-email').text(_u);
			$('.dim-load, .verify-mail, .nickname-setup, .error-alert').transition('hide');
			$('.verify-mail').transition('slide up').transition('jiggle');

			$('.verify-mail-resend').off('click').on('click', function () {
				$('.verify-mail-resend').addClass('disabled');
				$('.verify-mail-resend').off('click');
				$('.verify-mail-resend').text("Verification Email Sent");

				firebase.auth().sendSignInLinkToEmail(_u, actionCodeSettings)
				console.info("[Timeline] Verification Email sent.");
			});
		});

	});

  } else {
  	console.info('[Timeline] Auth state changed: No user found.');
  	$('.main.ui').dimmer('hide');
    // No user is signed in.
    $('.login-email-username-password').off('click').on('click', function() {
    	leup();
		});
		$('.login-email-auth').off('click').on('click', function() {
			$('.submit').off('click');
			var _u = $('.login-user').val();
			
			$('.main.ui').dimmer('show');
			Timeline.loginViaEmailAuth(_u);
			$('.verify-email').text(_u);
			$('.dim-load, .verify-mail, .nickname-setup, .error-alert').transition('hide');
			$('.verify-mail').transition('slide up').transition('jiggle');

			$('.verify-mail-resend').off('click').on('click', function () {
				$('.verify-mail-resend').addClass('disabled');
				$('.verify-mail-resend').off('click');
				$('.verify-mail-resend').text("Verification Email Sent");

				firebase.auth().sendSignInLinkToEmail(_u, actionCodeSettings)
				console.info("[Timeline] Verification Email sent.");
			});
		});
  }
});

Timeline.loginViaEmailAuth = function (email) {
	console.info('[Timeline] Login via Email Authentication initiated.');
	firebase.auth().sendSignInLinkToEmail(email, actionCodeSettings)
	  .then(function() {
	    // The link was successfully sent. Inform the user.
	    // Save the email locally so you don't need to ask the user for it again
	    // if they open the link on the same device.
	    window.localStorage.setItem('signinAuthData', btoa(JSON.stringify({type:'emailAuth', data:{email:email}})));
	    $('.main.ui > .dimmer>.loader').html('<b>Email Authentication link sent to <label class="ui label">'+email+'</label> <br>Follow link in the email to sign-in</b>');
	    $('.main.ui').dimmer('show');
	  })
	  .catch(function(error) {
	    // Some error occurred, you can inspect the code: error.code
	    console.error(error);
	  });
}

Timeline.checkForEmailAuth = function () {
	console.info('[Timeline] Checking for Email Authentication.');
	if (firebase.auth().isSignInWithEmailLink(window.location.href)) {
		console.info('[Timeline] Found Email Authentication.');

		var signInData = $.parseJSON(atob(window.localStorage.getItem('signinAuthData') || btoa('null')));
		if (!signInData || signInData.type != 'emailAuth') {
			console.info('[Timeline] Attack, no Email Authentication initiated.');
			return;
		}

		var email = signInData['data'].email;

		if (!email) {
			console.info('[Timeline] Attack, no Email Authentication initiated.');
			return;
		}

		console.info('[Timeline] Email Authentication - ' + email);
		firebase.auth().signInWithEmailLink(email, window.location.href)
			.then(function(result) {
				console.info('[Timeline] User logged in via Email Authentication.');
				console.info('[Timeline] Checking detail and trying to login.');
				console.log(result);
				// Clear email from storage.
				window.localStorage.removeItem('signinAuthData');
				console.log('[Timeline] Cleared auth data from cache.');
			})
			.catch(function(error) {
				console.error('[Timeline] Email Authentication failed.');
				console.error(error);

			});
	}

	$('.main.ui > .dimmer>.loader').html('Checking for user session.');
}

$(function(){ Timeline.checkForEmailAuth(); });