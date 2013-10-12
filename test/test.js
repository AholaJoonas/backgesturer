(function loadbackGesturer() {
	console.log("loading backGesturer");
	var backgest = new backGesturer(".back-gesturized", {
		button1Text: "<b>Yay</b>",
		button2Text: "Wobble",
		button1Callback: function(evt) {alert("I'm button 1 and this is my favourite button in the citadel")},
		button2Callback: function(evt) {alert("I'm button 2 and this is my favourite button in the citadel")}
	});	
}() );