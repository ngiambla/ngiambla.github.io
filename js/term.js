var term;
var allfunctions=[];

$(function() {
	var signature = `
⠈⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠁⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠈⣿⣿⣿⣿⣿⣿⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⣿⣿⣿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠸⣿⣿⣿⣿⣿⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠹⣿⣿⣿⣿⣿⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⣿⣿⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠹⣿⣿⣿⣿⣿⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⣿⣿⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠹⣿⣿⣿⣿⣿⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⠏⠀⠀Nicholas Giamblanco,
⠀⠀⠀⠀⠀⠀⢻⣿⣿⣿⣿⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⣿⡟⠀⠀⠀⠀  Computer Engineer
⠀⠀⠀⠀⠀⠀⠈⢿⣿⣿⣿⣿⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⡿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠈⢿⣿⣿⣿⣿⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⡿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠈⢿⣿⣿⣿⣿⣧⠀⠀⠀⠀⠀⠀⠀⣼⣿⡿⠁⠀⠀⠀⠀⠀Bachelor of Engineering,
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣿⣿⣿⣿⣿⣆⠀⠀⠀⠀⠀⢸⣿⣿⠁⠀⠀⠀⠀⠀⠀   Ryerson University
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⣿⣿⣿⣿⣿⡄⠀⠀⠀⢠⣿⣿⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣿⣿⣿⣿⣿⡀⠀⢀⣿⣿⠏⠀⠀⠀⠀⠀⠀⠀⠀Master's of Applied Science
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣿⣿⣿⣿⣷⣀⣾⣿⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀   University of Toronto
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣿⣿⣿⣿⣿⣿⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣿⣿⣿⣿⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⣿⣿⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
`;
	var scanlines = $('.scanlines');
	var tv = $('.tv');
	term = $('#term').terminal(function(command, term) {
		if (command !== '') {
	        try {
				var fnstring = "term_"+command;
				var fn = window[fnstring];

				// is object a function?
				if (typeof fn === "function") {
					fn();
				} else if(typeof fn === "object") {
					tree(result);
				} else {
					term.error((new String(fn)) + command);	
				}
	        	// command +="()";
	         //    var result = window.eval(command);
	         //    if (result) {
	         //        term.echo('<#jQuery>');
	         //    } else if (result && typeof result === 'object') {
	         //        tree(result);
	         //    } else if (result !== undefined) {
	         //        term.echo(new String(result));
	         //    }
	        } catch(e) {
	            term.error(new String(e));
	        }
	    }
	}, {
		greetings: '',
		exit: false,
	    onInit: function() {
	    	populate_termfunctions();
	        set_size();
			this.echo(signature, {finalize: a11y_hide, formatters: false});

			this.echo('Type [[b;#fff;]help] to see all options.')
	        this.echo('Type [[b;#fff;]exit] to ...');
	    },
	    onClear: function() {
	    },
	    prompt: '[[b;#66FF66;]ngiambla@toronto][[b;#fff;]:][[b;#1E90FF;]~][[b;#fff;]$] '
	});
	// for codepen preview
	if (!term.enabled()) {
	    term.find('.cursor').addClass('blink');
	}
	function set_size() {
	    // for window height of 170 it should be 2s
	    var height = $(window).height();
	    var width = $(window).width()
	    var time = (height * 2) / 170;
	    scanlines[0].style.setProperty("--time", time);
	    tv[0].style.setProperty("--width", width);
	    tv[0].style.setProperty("--height", height);
	}

	// Functions for each command

	function tree(obj) {
	    term.echo(treeify.asTree(obj, true, true));
	}

    // -----------------------------------------------------------------------
    // :: hide elements from screen readers
    // -----------------------------------------------------------------------


});

function a11y_hide(element) {
    element.attr({
        role: 'presentation',
        'aria-hidden': 'true'
    });
}

function term_clear() {
    term.clear();
	
}

function term_whoami() {
	term.clear();
	term.echo("yoyo, itsa me.");
	//term.echo("yoyo, itsa me.");
}

function term_exit() {
    $('.tv').addClass('collapse');
    term.disable();
}	

function term_help() {
	term.echo("Available Commands: ");
	for(var fun in allfunctions) {
		term.echo(allfunctions[fun]);
	}
}


function populate_termfunctions(){ 
	for (var i in window) {
		if( (typeof window[i]).toString() == "function"){
			fn_name = window[i].name;
			if(fn_name.substring(0, Math.min(5, fn_name.length-1)) === "term_")
	    		allfunctions.push(new String(fn_name));
	  	}
	}
	console.log(allfunctions)
}