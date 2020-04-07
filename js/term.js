var term;
var allfunctions=[];
var completion_list = [];
var game_play = false;
var delay = 50;
var timeoutid; 

$(function() {
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
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣿⣿⣿⣿⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⣿⣿⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
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
	    onClear: function() {

	    },
        keypress: function(e, term) {
			// console.log(e);
			// console.log(term);
			// if (e.which == 100 && e.ctrlKey) {
			// 	game_play = false;
			// 	clearTimeout(timeoutid);
			// 	console.log("clear...");				
			// 	term.resume();
			// 	term.clear();
			// 	return;
			// }

		 //    switch(e.which) {
		 //        case 119: // left
		 //        console.log("up");
		 //        break;

		 //        case 97: // up
		 //        console.log("left");
		 //        break;

		 //        case 115: // right
		 //        console.log("down");
		 //        break;

		 //        case 100: // down
		 //        console.log("right");
		 //        break;

		 //        default: return; // exit this handler for other keys
		 //    }
   //  e.preventDefault(); // prevent the default action (scroll / move caret)
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
		//game_play = true;
		//term.pause();
		//console.log("???\n");
        //display();		
		return "";
	}
}

function display() {
    if (game_play== true) {
    	term.echo("-->");
        timeoutid=setTimeout(display, delay);
    } else {
    	console.log("Why am I not here...\n");
    }
}




function term_whoami(showHelp=false) {
 var  message =`
Hi, I'm [[b;#66FF66;]Nicholas Giamblanco].
I'm a computer engineer, focused on compilers for hardware-accelerators.
My expertise is in the [[b;#FFF;]research] and [[b;#FFF;]design] of compilers for hardware-accelerators.
My training focused on compilation methods for high-level synthesis (HLS) [[!;]http://legup.eecg.utoronto.ca/]. 


Some facts:

I'm from Arnprior, Ontario.
I live in Toronto.
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