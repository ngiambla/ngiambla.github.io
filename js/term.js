var term;
var allfunctions=[];
var wrongcommands = 0;
var completion_list = [];
var game_play = false;
var delay = 50;
var timeoutid; 

$(function() {

	//Hide the game 
	$("#game").hide();	

	//Make sure to populate all the term-functions.
	populate_termfunctions();

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
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣿⣿⣿⣿⣿⡀⠀⢀⣿⣿⠏⠀⠀⠀⠀⠀⠀⠀⠀Master's of Applied Science,
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣿⣿⣿⣿⣷⣀⣾⣿⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀   University of Toronto
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣿⣿⣿⣿⣿⣿⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣿⣿⣿⣿⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀Doctor of Philosophy @ U of T,
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⣿⣿⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀Computer Engineering & Neuroscience, 
`;
	var scanlines = $('.scanlines');
	var tv = $('.tv');
	term = $('#term').terminal(function(command, term) {
		if (command !== '') {
	        try {
				var fnstring = "term_"+command.trim();
				var fn = window[fnstring];

				// is object a function?
				if (typeof fn === "function") {
					fn();
				} else if(typeof fn === "object") {
					tree(result);
				} else {
					term.error((new String(fn)) + ": " + command);
					wrongcommands++;	
					if(wrongcommands == 4) {
						term.error("Everything okay? You've made a few terminal mistakes.")	
						wrongcommands=0;
					}

				}
	        } catch(e) {
	            term.error(new String(e));
	        }
	    }
	}, {
		greetings: '',
		exit: false,
	    autocompleteMenu: true,	
	    completion: completion_list,	
	    onInit: function() {
	        set_size();
			this.echo(signature, {finalize: a11y_hide, formatters: false});
			this.echo('Type [[b;#fff;]help] to see all options.')
	    },
	    prompt: '[[b;#66FF66;]ngiambla@toronto][[b;#fff;]:][[b;#1E90FF;]~][[b;#fff;]$] '
	});

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
});



// -----------------------------------------------------------------------
// :: hide elements from screen readers
// -----------------------------------------------------------------------

function a11y_hide(element) {
    element.attr({
        role: 'presentation',
        'aria-hidden': 'true'
    });
}


// -----------------------------------------------------------------------
// :: Terminal Commands
// -----------------------------------------------------------------------
function term_clear(showHelp=false) {
	if(showHelp == true) {
		return "Clears the terminal.";
	} else {
	    term.clear();
	    return "";
	}	
}

function term_getcv(showHelp=false) {
	if(showHelp) {
		return "Downloads my C.V.";
	} else {
		var link = document.createElement('a');
		link.href = "data/cv.pdf";
		link.download = 'nicholas_giamblanco_cv.pdf';
		link.dispatchEvent(new MouseEvent('click'));
		return "";
	}
}


function term_game(showHelp=false) {
	if(showHelp) {
		return "A mini game to play ;) ";
	} else {
    	initializeGame();
    	term.disable().hide();
	}
}


function term_whoami(showHelp=false) {
 var  message =`
Hi, I'm [[b;#66FF66;]Nicholas Giamblanco].
I'm a computer engineer, focused on compilers for hardware-accelerators.

My expertise is in the [[b;#FFF;]research] and [[b;#FFF;]design] in this field.
My training focused on compilation methods for high-level synthesis (HLS) [[b;!;]legup.eecg.utoronto.ca]. 

You can find some of my projects at [[b;!;]github.com/ngiambla]

Some facts:

I'm from Arnprior, Ontario.
I live in Toronto, Ontario.

`;

	if(showHelp) {
		return "Provides information about who I am.";
	} else {
		term.echo(message);
		return "";
	}
}

function term_exit(showHelp=false) {
	if(showHelp) {
		return "Exits the terminal";
	} else {
	    $('.tv').addClass('collapse');
	    term.disable();
		window.location.href = 'https://github.com/ngiambla';	    	    
	    return "";
	}
}

// NetBSD source code style guide example:
// Usage: program [-aDde] [-f | -g] [-n number] [-b b_arg | -c c_arg] req1 req2 [opt1 [opt2]]
// "program" should be called with:

// options without operands: a, D, d, e (any of which may be omitted). Note that in this case some parameters are case-sensitive
// exclusive options: f, g (denoted by the vertical bar)
// options with operands: n
// exclusive options with operands: b, c
// required arguments: req1, req2
// optional argument opt1, which may be used with or without opt2 (marked optional within the group by using another set of square brackets)
// optional argument opt2, which requires opt1
function term_nc(showHelp=false) {
	var helpstring = "\tNC Compiler: Compile Python to NC-Intermediate Language."
	if(showHelp) {
		return helpstring;
	} else {
		helpstring += "\nUsage: nc program.py"
		term.echo(helpstring+"\n\t[[b;#66FF66;]Coming soon...]\n");
	    return "";
	}
}	


function term_help(showHelp=false) {
	if(showHelp) {
		return "Displays this."
	} else {
		term.echo("Available Commands: ");
		for(var fun in allfunctions) {
			var fn_name = allfunctions[fun].name;
			term.echo("\t[[b;#FFF;]"+fn_name.substring(5, fn_name.length)+"]:\t\t"+allfunctions[fun](true));
		}
		return "";
	}
}


//== Utility Function :P
function populate_termfunctions(){ 
	for (var i in window) {
		if( (typeof window[i]).toString() == "function"){
			fn_name = window[i].name;
			if(fn_name.substring(0, Math.min(5, fn_name.length-1)) === "term_") {
	    		allfunctions.push(window[i]);
	    		completion_list.push(fn_name.substring(5, fn_name.length))
			}
	  	}
	}
}


