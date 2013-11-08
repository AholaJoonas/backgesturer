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
}() );