
var request = require('request');

(function(module) {

	"use strict";

	module.exports = (function() {

		return {
			auth: {
	            get: getAuth,
	            post: postAuth,
	            delete: delAuth
			},
			no_auth: {
	            get: get,
	            post: post,
	            delete: del
			}
		};

	})();

})(module);


function getAuth(github_credentials, url){
	var auth_buffer = new Buffer(github_credentials.username + ':' + github_credentials.token).toString('base64');
	var headers = {};
	if(!github_credentials.username && !github_credentials.token){
		headers = {'user-agent': 'node.js'};
	}
	else {
		headers = {
			'Authorization': 'Basic ' + auth_buffer,
			'user-agent': 'node.js'
		};
	}
	console.log(url);
    return new Promise(function(resolve, reject){
        request.get({
            url: url,
            headers: headers
        }, function (err, response, body) {
            if (err) {
                return resolve({code: 1, error_msg: 'Something went wrong', response: err});
            }
            resolve( JSON.parse(body) );
        })
    })
}
function postAuth(github_credentials, url, data){
	var auth_buffer = new Buffer(github_credentials.username + ':' + github_credentials.token).toString('base64');
	var headers = {
		'Authorization': 'Basic ' + auth_buffer,
		'user-agent': 'node.js'
	};
    return new Promise(function(resolve, reject){
        request.post({
            url: url,
            headers: headers,
            body: JSON.stringify(data)
        }, function (err, response, body) {
            if (err) {
                return resolve({code: 1, error_msg: 'Something went wrong', response: err});
            }
            resolve( JSON.parse(body) );
        })
    })
}
function delAuth(github_credentials, url, data){
	var auth_buffer = new Buffer(github_credentials.username + ':' + github_credentials.token).toString('base64');
	var headers = {
		'Authorization': 'Basic ' + auth_buffer,
		'user-agent': 'node.js'
	};
    return new Promise(function(resolve, reject){
        request.del({
            url: url,
            headers: headers,
            body: JSON.stringify(data)
        }, function (err, response, body) {
            if (err) {
                return resolve({code: 1, error_msg: 'Something went wrong', response: err});
            }
            resolve( JSON.parse(body) );
        })
    })
}

// no_auth
function get(gc, url){
	console.log(url);
    return new Promise(function(resolve, reject){
        request.get({
            url: url,
            headers: {'user-agent': 'node.js'}
        }, function (err, response, body) {
            if (err) {
                return resolve({code: 1, error_msg: 'Something went wrong', response: err});
            }
            resolve( JSON.parse(body) );
        })
    })
}
function post(){
    return new Promise(function(resolve, reject){
		reject();
	})
}
function del(){
    return new Promise(function(resolve, reject){
		reject();
	})
}
