(function loadbackGesturer() {
	console.log("loading backGesturer");
	backgest = new backGesturer(".back-gesturized", {
		button1Text: "<b>Yay</b>",
		button2Text: "Wobble",
		button1Callback: function(evt) {
		      console.log("I'm button 1 and this is my favourite button in the citadel");
		},
		button2Callback: function(evt) {console.log("I'm button 2 and this is my favourite button in the citadel");
		},
		hwAcceleration: false
	});	
	
	backgest2 = new backGesturer(".back-gesturized-too",{
		button1Text: "Yepyepyepyepyepyepyep",
		button2Text: "Intergalactic wibble wobble",
		button1Callback: function(evt) {console.log("I'm the real button 1 and this is my favourite button in the citadel");
		},
		button2Callback: function(evt) {console.log("I'm he real button 2 and this is my favourite button in the citadel");
		}
	});
	
	scroll = new iScroll("iscroll-wrapper");
	backgest3 = new backGesturer(".back-gesturized-three",{
        button1Callback: function(evt) {console.log("I'm the real button 1 and this is my favourite button in the citadel");
        },
        button2Callback: function(evt) {console.log("I'm he real button 2 and this is my favourite button in the citadel");
        },
        onMoveStart: function() {scroll.disable();},
        onMoveEnd: function() {scroll.enable();}
    });
    var buttons = document.querySelectorAll(".test-reveal"),
    	handleButtonClick = function(evt) {
    		evt.preventDefault();
    		console.log(this);
    		if(this.className.match("reveal-unreveal-wave")) {
    			backgest.revealElements(false, "wave", function(){ backgest.unrevealElements(false, "wave") });
    		}else if(this.className.match("reveal-unreveal1")) {
    			backgest.revealElements(false, false, function(){ backgest.unrevealElements(false) });
    		}else if(this.className.match("reveal1")) {
    			backgest.revealElements(false);
    		}else if(this.className.match("reveal-wave")) {
    			backgest.revealElements(false, "wave");
    		}
    	}
    for(var i = 0; i < buttons.length; i++) {
    	buttons[i].addEventListener("touchend", handleButtonClick);
    	buttons[i].addEventListener("click", handleButtonClick);
    }
}() );