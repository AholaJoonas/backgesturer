(function loadbackGesturer() {
	console.log("loading backGesturer");
	var backgest = new backGesturer(".back-gesturized", {
		bttn1Callback: function(evt) {alert("I'm button 1 and this is my favourite button in the citadel")},
		bttn2Callback: function(evt) {alert("I'm button 2 and this is my favourite button in the citadel")}
	});	
}() );