#backgesturer


iOS-styled back-gestures to elements

Usage:

    new backGesturer( (<DOM nodelist> || css-selector), paramsObject{})

	example:
	var backgest = new backGesturer(".back-gesturized", {
		bttn1Callback: function(evt) {alert("I'm button 1 and this is my favourite button in the citadel")},
		bttn2Callback: function(evt) {alert("I'm button 2 and this is my favourite button in the citadel")}
	});	
    
Possible values for the paramsObject:

1. "button1Callback" && "button2Callback" : function - _required_ 
   > callback-functions for when pressing the buttons, they receive the event as a parameter and their context is the DOM-node of the pressed button.

2. "button1Text" && "button2Text": string - _required if you are generating the buttons with backGesturer_
    >Text-labels for the buttons, the string is wrapped in a span-element, can be HTML.

3. "hwAcceleration": true || false,  _default: true_
    > If you set this to false, The CSS-property "left" will be used instead of detecting transitions.
    > If you're on a browser that doesn't support transitions, left will also be used
    
    ##Info
    For best performance, use the following structure in the elements you use backgesture on:

        wrapper
            .backgesture-content-wrapper (contains the actual visible content of the element)
            .backgesture-button-wrapper
                .backgesture-button.backgesture-button1
                    span "buttontitle"
                .backgesture-button..backgesture-button2
                    span "buttontitle
                    
        for example:
        <li class="back-gesturized">
		    <div class="backgesture-content-wrapper">
                Lorem ipsum asd asd
            </div>
			<div class="backgesture-button-wrapper">
                <div class="backgesture-button backgesture-button1">
                    <span>Button 1</span>
                </div>
                <div class="backgesture-button2 backgesture-button">
                    <span>Delete</span>
                </div>
            </div>
		</li>

In case you use backgesturer on an element with no .backgesture-content-wrapper or .backgesture-button-wrapper, it will be generated, but the performance will be poor. Especially in a large node-collection.

##TODO:
1. Solve the context-problem (More than one instance of backgesturer --> explosions)
2. Move all the styles to the JS so no additional CSS-files required (necessary?)
3. Improve the code-quality...
    
    
    
    
    
