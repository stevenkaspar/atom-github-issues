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
        try{
          if(target.dataset.path)
              return target.dataset.path;
          else
              return target.childNodes[0].dataset.path;
        }
        catch(e){
            var editor = atom.workspace.getActivePaneItem();
            try {
              if(editor.buffer)
                  file_path = editor.buffer.file.path;
              return file_path;
            }
            catch(e){
              throw 'Unable to locate path: please log issue and indicate where source click came from. Thanks!';
            }
        }
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
