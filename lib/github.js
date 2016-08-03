
var request = require('request');

(function(module) {

	"use strict";

	module.exports = (function() {

		return {
            get: get,
            post: post,
            delete: del
		};

	})();

})(module);


function get(username, token, url){
	var auth_buffer = new Buffer(username + ':' + token).toString('base64');
	var headers = {};
	if(!username && !token){
		headers = {'user-agent': 'node.js'};
	}
	else {
		headers = {
			'Authorization': 'Basic ' + auth_buffer,
			'user-agent': 'node.js'
		};
	}
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
function post(username, token, url, data){
	var auth_buffer = new Buffer(username + ':' + token).toString('base64');
	var headers = {};
	if(!username && !token){
		headers = {'user-agent': 'node.js'};
	}
	else {
		headers = {
			'Authorization': 'Basic ' + auth_buffer,
			'user-agent': 'node.js'
		};
	}
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
function del(username, token, url, data){
	var auth_buffer = new Buffer(username + ':' + token).toString('base64');
	var headers = {};
	if(!username && !token){
		headers = {'user-agent': 'node.js'};
	}
	else {
		headers = {
			'Authorization': 'Basic ' + auth_buffer,
			'user-agent': 'node.js'
		};
	}
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
