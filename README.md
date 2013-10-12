backgesturer
============

iOS-styled back-gestures to elements

Usage:
	new backGesturer( (<DOM nodelist> || css-selector), paramsObject{})

	example:

	var backgest = new backGesturer(".back-gesturized", {
		bttn1Callback: function(evt) {alert("I'm button 1 and this is my favourite button in the citadel")},
		bttn2Callback: function(evt) {alert("I'm button 2 and this is my favourite button in the citadel")}
	});	
