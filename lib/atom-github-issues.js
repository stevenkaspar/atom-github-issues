'use babel';

import { CompositeDisposable } from 'atom';

var GithubView = require('./github-view');


export default {

    subscriptions: null,

    activate(state) {
        // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
        this.subscriptions = new CompositeDisposable();

        // Register command that toggles this view
        this.subscriptions.add(atom.commands.add('atom-workspace', {
            'atom-github-issues:open': (e) => atom.workspace.open( 'atom-github-issues:' + this.getSelectedPath(e.target) )
        }));

        // if(atom.project.getRepositories().length){
            atom.workspace.addOpener( opener.bind(this) );
        // }

        console.log('--- load atom-github-issues ---');
    },

    deactivate() {
        this.subscriptions.dispose();
    },

    serialize() {},
    getSelectedPath(target){
        if(target.dataset.path)
            return target.dataset.path;
        else
            return target.childNodes[0].dataset.path;
    },

};



function opener(uri){

    function cleanWorkspaceOpenPath(path){
        return path.split('atom-github-issues:').slice(-1)[0];
    }

    if(uri.includes('atom-github-issues:')){
        uri = cleanWorkspaceOpenPath(uri);
        return new GithubView(uri);
    }
}
