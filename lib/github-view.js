'use babel';

var github = require('./github');

var marked = require('marked');
var React  = require('react');
var ReactDOM = require('react-dom');

var repo_path           = null; // path of the click event
var gc                  = {};
var type                = 'auth'; // no_auth or auth
var is_collaborator     = false; // no_auth or auth
var labels              = null;
var available_assignees = null; // list of available assignees
var api_base            = null; // https://api.github.com/repos/:owner/:repo
var api_users_base       = 'https://api.github.com/user'; // https://api.github.com/user
var github_repo         = null; // api returned github repo
var atom_git_repo       = null; // Atom GitRepository
var parent_elem         = null; // parent DOM element
var github_user         = null;

import TetherComponent from 'react-tether';

export default class GithubView {

    constructor(path) {
        repo_path          = path;
        atom_git_repo      = this.getGitRepository(repo_path); // get Atom's GitRepository object
        api_base           = 'https://api.github.com/repos/' + this.getOwnerRepo( atom_git_repo.getOriginURL() );


        gc = this.githubCredentials(atom_git_repo);
        console.log(gc);
        if(gc.username && gc.token){
            github['auth'].get(gc, api_users_base).then((function(api_response){
                console.log(api_response);

                if(api_response.message){
                    type = 'no_auth';
                    atom.notifications.addError(api_response.message, {dismissable: true});
                }

                else if(api_response.login){
                    github_user = api_response;
                    if(api_response.login === gc.username){
                        atom.notifications.addSuccess('Active Github account: ' + gc.username, {dismissable: false});
                    }
                    else {
                        atom.notifications.addWarning('Github Access Token is for user ' + api_response.login + '. While your git config.name is ' + gc.username + '. Your activity in Github will be credited to ' + api_response.login, {dismissable: true});
                    }
                }
                this.initConnection();

            }).bind(this))
        }
        else{
            type = 'no_auth';

            atom.notifications.addWarning('No Github Access Token found. To view Private repositories or to post comments, please add your Github Access Token with \'git config user.accesstoken "GITHUB_ACCESS_TOKEN"\'', {dismissable: true});

            this.initConnection();
        }

        // github.get(gc, 'https://api.github.com/rate_limit').then(log);

        // Create root element
        parent_elem = document.createElement('div');
        parent_elem.className = 'atom-github-issues';


    }
    initConnection(){
        // if name and token use it

        // if no token, alert to notifications and continue on with everything inactive
        var init_promises = [
            github[type].get(gc, api_base),
            github[type].get(gc, api_base + '/labels'),
            github[type].get(gc, api_base + '/assignees')
        ];
        return Promise.all(init_promises).then((function(api_responses){
            if(api_responses[0].message === 'Not Found'){
                alertAccessTokenNeeded('This repository is "Not Found". If this is a Private repository, add a Github Access Token by running \'git config user.accesstoken "GITHUB_ACCESS_TOKEN"\' and retry');
                return;
            }
            if(api_responses[0].message === 'Bad credentials'){
                // repo was not found but access token is not set so alert them to 'git config user.accesstoken "GITHUB_ACCESS_TOKEN"' and retry
                alertAccessTokenNeeded('"Bad Credentials". Make sure that your config.name and config.accesstoken are correct');
                return;
            }

            github_repo            = api_responses[0];
            labels                 = api_responses[1];
            available_assignees    = api_responses[2];

            this.renderView();

        }).bind(this))
    }
    // Tear down any state and detach
    destroy() {
        parent_elem.remove();
    }

    getElement() {
        return parent_elem;
    }

    getTitle(){
        return 'Github: ' + this.getRepo( atom_git_repo.getOriginURL() );
    }
    // get github credentials from the config
    githubCredentials(repo){
        return {
            username: repo.getConfigValue('user.name'),
            token: repo.getConfigValue('user.accesstoken')
        }
    }

    // get the GitRepository object for path
    getGitRepository(path){
    	try{
            var repos = atom.project.getRepositories();

            for(var i in repos){
                var repo_path_minus_dot_git = repos[i].path.split('/').slice(-2)[0];
                var path_parts = path.split('/');
                for(var x in path_parts){
                    if(repo_path_minus_dot_git === path_parts[x])
                        return repos[i];
                }
            }
            return repos[0];
    	} catch(e){
    		throw 'Repo not found for: ' + path;
    		return false;
    	 }

    }
    // takes in the originURL()
    // removes https://github.com/:owner/---.git from https://github.com/:owner/:repo.git
    // returns {String} of form :repo
     getRepo(url){
        var removed_api_url = url.split('/').slice(-1)[0];
        return removed_api_url.substring(0, removed_api_url.length - '.git'.length);
    }
    // takes in the originURL()
    // removes https://github.com/---.git from https://github.com/:owner/:repo.git
    // returns {String} of form :owner/:repo
    getOwnerRepo(url){
        var removed_api_url = url.split('/').slice(-2).join('/').split(':').slice(-1)[0];
        var return_val = removed_api_url.substring(0, removed_api_url.length - '.git'.length);
        return return_val;
    }
    renderView(){
        var container = document.createElement('div');
        ReactDOM.render(
            <Issues />,
            container
        );
        parent_elem.appendChild(container);
    }
}

class Issues extends React.Component {
    constructor() {
        super();
        this.loadIssues = this.loadIssues.bind(this);
        this.state = {
            loading_issues: false
        }
    }
    getInitialState() {
        return {issues: []};
    }
    componentDidMount(){
        this.loadIssues();
    }
    loadIssues(){
        this.setState({loading_issues: true});
        github[type].get(gc, api_base + '/issues').then((function(issues){
            this.setState({
                issues: issues,
                loading_issues: false
            });
        }).bind(this))
    }
    render() {
        // if we haven't fetched the issues then set loading message
        if(!this.state.issues)
            return <div>Loading issues from Github...</div>;

        var issues = this.state.issues;

        // if there is a message then we need to show that instead
        if(issues.message)
            return <div>{issues.message}</div>;

        // this will add a spin class to the button if it is loading
        var load_btn_class = 'icon icon-sync';
        if(this.state.loading_issues)
             load_btn_class += ' spin';

        return (
            <div>
                <div className='row'>
                    <span className='secondary'>
                        Github URL: <a href={github_repo.html_url}>{github_repo.html_url}</a>
                    </span>
                    <button className='float-right btn' onClick={this.loadIssues}>
                        <span className={load_btn_class}></span>
                    </button>
                </div>
                {issues.length ? issues.map(function(issue){
                    return <Issue issue={issue} />;
                }) :
                <span>
                    No Issues
                    <span className='icon icon-squirrel'></span>
                </span>}
            </div>
        );
    }
};
class Issue extends React.Component {
    constructor() {
        // can't access this.props in constructor
        super();
        this.toggleComments = this.toggleComments.bind(this);
        this.reloadIssue = this.reloadIssue.bind(this);
        this.state = {
            show_comments: false
        }

    }
    reloadIssue(){
        github[type].get(gc, this.props.issue.url).then((function(issue){
            this.setState({issue: issue});
        }).bind(this))
    }
    toggleComments() {
        this.setState({show_comments: !this.state.show_comments});
    }
    render() {
        var issue = this.props.issue;
        var comments_style = {display: 'none'};

        if(this.state.issue)
            issue = this.state.issue;

        if(this.state.show_comments)
            comments_style.display = 'block';

        return (
            <div className="github-issue-container">
                <div>
                    <Assignees issue={issue} reloadIssue={this.reloadIssue}/>
                    <h2 onClick={this.toggleComments}  className="github-issue-title cursor-default">{issue.title}</h2>
                    <span onClick={this.toggleComments} className='cursor-default'>comments: {issue.comments}</span>
                    <a href={issue.html_url}><span className="icon icon-link-external"></span></a>
                    <Labels labels={issue.labels} issue={issue} />
                    <div style={comments_style}>
                        <Comment comment={issue} />
                        <Comments issue={issue} />
                        <NewComment issue={issue} reloadIssue={this.reloadIssue}/>
                    </div>
                </div>
            </div>
        );
    }
};

class Assignees extends React.Component {
    constructor() {
        super();
        this.destroyModal = this.destroyModal.bind(this);
        this.state = {
            modal_open: false
        };
    }
    routeAssignee(){
        var assignees = this.props.issue.assignees;
        var html_string = '<span class="icon icon-gist-secret"></span>';

        if(assignees.length === 1)
            html_string = '<img src="'+assignees[0].avatar_url+'"/>';

        else if(assignees.length === 2){
            html_string = '<div class="assignee-2" style="background-image: url('+assignees[0].avatar_url+');"></div>';
            html_string += '<div class="assignee-2" style="background-image: url('+assignees[1].avatar_url+');"></div>';
        }

        else if(assignees.length >= 3){
            html_string = '<div class="assignee-4" style="background-image: url('+assignees[0].avatar_url+');"></div>';
            html_string += '<div class="assignee-4" style="background-image: url('+assignees[1].avatar_url+');"></div>';
            html_string += '<div class="assignee-4" style="background-image: url('+assignees[2].avatar_url+');"></div>';
            if(assignees.length === 4){
                html_string += '<div class="assignee-4" style="background-image: url('+assignees[3].avatar_url+');"></div>';
            }
        }

        return {__html: html_string};
    }

    destroyModal(){
        this.setState({modal_open: !this.state.modal_open});
    }
    render() {

        const modal_open = this.state.modal_open;

        return (
            <TetherComponent
                attachment="top right"
                constraints={[{
                    to: 'scrollParent',
                    attachment: 'together'
                }]}
            >
            { /* First child: This is what the item will be tethered to */ }
            <div className='github-assignee-square' dangerouslySetInnerHTML={this.routeAssignee()} onClick={() => {this.setState({modal_open: !modal_open})}} />
            { /* Second child: If present, this item will be tethered to the the first child */ }
            {
                modal_open &&
                <div>
                    <AssigneeModal issue={this.props.issue} destroyModal={this.destroyModal} reloadIssue={this.props.reloadIssue}/>
                </div>
            }
            </TetherComponent>

        );
    }
};
class AssigneeModal extends React.Component {
    constructor() {
        super();
        this.handleChange = this.handleChange.bind(this);
    }
    isAssignee(assignee_id){ // passes in the available_assignees ids
        for(var i in this.props.issue.assignees){
            if(this.props.issue.assignees[i].id === assignee_id)
                return true;
        }
        return false;
    }
    handleChange(e){
        e.stopPropagation();

        if(!github_repo.permissions.push){
            e.target.checked = !e.target.checked;
            return atom.notifications.addWarning('You do not have push access to this repository');
        }

        var action = 'post';
        if(e.target.checked === false)
            action = 'delete';
        var endpoint = api_base + '/issues/' + this.props.issue.number + '/assignees';
        var data = {
            assignees: [e.target.dataset.login]
        };
        github[type].post(gc, endpoint, data).then((function(response_body){
            this.props.reloadIssue();
        }).bind(this))
    }
    render() {
        var issue = this.props.issue;

        return (
            <div className='relative'>
                <span className='icon icon-x' onClick={this.props.destroyModal}></span>
                {available_assignees.map((function(assignee){
                    if(this.isAssignee(assignee.id))
                        return <div><input type='checkbox' onChange={this.handleChange} data-login={assignee.login} checked/>{assignee.login}</div>

                    return <div><input type='checkbox' onChange={this.handleChange} data-login={assignee.login} />{assignee.login}</div>
                }).bind(this))}
            </div>
        );
    }
};

class Labels extends React.Component {
    constructor() {
        super();
        this.toggleLabel = this.toggleLabel.bind(this);
    }
    activeLabel(label){
        for(var i in this.props.labels){
            if(this.props.labels[i].name === label)
                return true;
        }
        return false;
    }
    toggleLabel(e){
        if(!github_repo.permissions.push)
            return atom.notifications.addWarning('You do not have push access to this repository');
        var elem = e.target;
        if(elem.classList.contains('off')){
            github[type].post(gc, api_base + '/issues/' + this.props.issue.number + '/labels', [elem.innerHTML] ).then(function(response_body){
                elem.classList.toggle('off');
            }).catch(alertAccessTokenNeeded)
        }
        else {
            var endpoint = api_base + '/issues/' + this.props.issue.number + '/labels/' + elem.innerHTML;
            github[type].delete(gc, endpoint).then(function(response_body){
                elem.classList.toggle('off');
            }).catch(alertAccessTokenNeeded)
        }
    }
    render() {

        return (
            <div>
            {labels.map((function(label) {
                var span_style = {
                    backgroundColor: '#'+label.color,
                    borderBottomColor: adjustColor('#'+label.color, -0.2)
                }
                var class_name = 'label cursor-default';

                if(!this.activeLabel(label.name)){
                    class_name += ' off';
                }

                return <span onClick={this.toggleLabel} className={class_name} style={span_style}>{label.name}</span>;

            }).bind(this))}
            </div>
        );
    }
};
class Comments extends React.Component {
    constructor() {
        super();
        this.loadComments = this.loadComments.bind(this);
    }
    getInitialState() {
        return {comments: []};
    }
    componentDidMount(){
        this.loadComments();
    }
    componentWillReceiveProps(){
        this.loadComments();
    }
    loadComments(){
        github[type].get(gc, this.props.issue.comments_url).then((function(comments){
            this.setState({comments: comments});
        }).bind(this))
    }
    render() {

        if(!this.state)
            return <div>loading comments from Github...</div>;

        var comments = this.state.comments;

        return (
            <div>
                {comments.map(function(comment){
                    return <Comment comment={comment} />;
                })}
            </div>
        );
    }
};
class Comment extends React.Component {
    constructor() {
        super();
    }
    render() {
        var comment = this.props.comment;
        return (
            <div className="github-comment-container">
                <h5>
                    <img className="avatar" src={comment.user.avatar_url} />
                    {comment.user.login}
                </h5>
                <div className="github-comment-body" dangerouslySetInnerHTML={createMarkup(comment.body)} />
            </div>
        );
    }
};

class NewComment extends React.Component {
    constructor() {
        // can't access this.props in constructor
        super();
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.triggerFileUpload = this.triggerFileUpload.bind(this);

        this.state = {
            comment: '',
            dangerous_preview: {
                __html: ''
            }
        };
    }

    handleChange(e){
        var update = [];
        update[e.target.name] = e.target.value; // will be comment
        this.setState(update);
    }
    handleSubmit(e) {
        var form = e.target;

        var api_endpoint = this.props.issue.repository_url + '/issues' + '/' + this.props.issue.number + '/comments';

        github[type].post(gc, api_endpoint, {body: form.comment.value}).then((function(response_body){
            this.setState({comment: ''});
            this.props.reloadIssue();
        }).bind(this)).catch(alertAccessTokenNeeded)
    }
    handleBlobUploadResponse(file_data){
        this.setState({comment: this.state.comment + '!['+file_data.file_name+'](' + file_data.data + ')'});
    }
    fileChange(change_event){
        var input_node = change_event.target;
        var files = change_event.target.files;
        // Loop through the FileList and render image files as thumbnails.
        for (var i = 0, f; f = files[i]; i++) {
            if (!f.type.match('image.*')) {
                atom.notifications.addWarning('Only images allowed.. Sorry');
                continue;
            }
            var reader = new FileReader();
            // Closure to capture the file information.
            reader.onload = ((function(theFile) {
                var file_name = theFile.name;
                return function(e) {
                    var result = e.target.result;
                    this.handleBlobUploadResponse({
                        file_name: file_name,
                        data: result
                    });
                };
            })(f)).bind(this);

            // Read in the image file as a data URL.
            reader.readAsDataURL(f);
        }

        input_node.parentNode.removeChild(input_node);
    }
    triggerFileUpload(){
        var input = document.createElement('input');
        input.type = 'file';
        input.addEventListener('change', this.fileChange.bind(this));
        parent_elem.appendChild(input);
        input.click();

    }
    render() {
        var preview_comment = {
            body: this.state.comment,
            user: github_user
        };
        return (
            <div className="github-new-comment">
                <div>
                {(this.state.comment.length) ? <Comment comment={preview_comment}/> : null}
                </div>
                <form onSubmit={this.handleSubmit}>
                    <textarea className='native-key-bindings' name='comment' placeholder='add comment' value={this.state.comment} onChange={this.handleChange} rows='4'></textarea>

                    <div className='github-file-dropzone'>
                        <button onClick={this.triggerFileUpload} type='button'>upload image</button>
                    </div>

                    <div className='row'>
                        <button className='float-right' type='submit'>Comment</button>
                    </div>
                </form>
            </div>
        );
    }
};
function createMarkup(markdown){
    var returned_html = marked(markdown);
    if(returned_html.length === 0)
        returned_html = '<span>No description</span>';
    return {
        __html: returned_html
    }
}
function adjustColor(hex, lum) {

	// validate hex string
	hex = String(hex).replace(/[^0-9a-f]/gi, '');
	if (hex.length < 6) {
		hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
	}
	lum = lum || 0;

	// convert to decimal and change luminosity
	var rgb = "#", c, i;
	for (i = 0; i < 3; i++) {
		c = parseInt(hex.substr(i*2,2), 16);
		c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
		rgb += ("00"+c).substr(c.length);
	}

	return rgb;
}

function on(node, type, callback) {

	// create event
	node.addEventListener(type, function(e) {
		// call handler
		return callback(e);
	});

}
// create a one-time event
function once(node, type, callback) {

	// create event
	node.addEventListener(type, function(e) {
		// remove event
		e.target.removeEventListener(e.type, arguments.callee);
		// call handler
		return callback(e);
	});

}
function log(a){ console.log(a); }
function alertAccessTokenNeeded(message){
    message = message || 'Add a Github Access Token by running \'git config user.accesstoken "GITHUB_ACCESS_TOKEN"\' and retry';
    atom.notifications.addError(message, {dismissable: true});

}
