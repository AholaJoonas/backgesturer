(function loadbackGesturer() {
	console.log("loading backGesturer");
	backgest = new backGesturer(".back-gesturized", {
		button1Text: "<b>Yay</b>",
		button2Text: "Wobble",
		button1Callback: function(evt) {alert("I'm button 1 and this is my favourite button in the citadel")},
		button2Callback: function(evt) {alert("I'm button 2 and this is my favourite button in the citadel")}
	});	
	backgest2 = new backGesturer(".back-gesturized-too",{
		button1Text: "Yeppety",
		button2Text: "Wobble2",
		button1Callback: function(evt) {alert("I'm the real button 1 and this is my favourite button in the citadel")},
		button2Callback: function(evt) {alert("I'm he real button 2 and this is my favourite button in the citadel")}
	});
	scroll = new iScroll("iscroll-wrapper");
	backgest3 = new backGesturer(".back-gesturized-three",{
        button1Text: "Yeppety",
        button2Text: "Wobble2",
        button1Callback: function(evt) {alert("I'm the real button 1 and this is my favourite button in the citadel")},
        button2Callback: function(evt) {alert("I'm he real button 2 and this is my favourite button in the citadel")},
        onMoveStart: function() {scroll.disable();},
        onMoveEnd: function() {scroll.enable();}
    });
}() );