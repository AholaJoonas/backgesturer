#backgesturer

iOS-styled back-gestures to elements, aimed for webapps

Usage:

    new backGesturer( (<DOM nodelist> || css-selector), paramsObject{})

	example:
	var backgest = new backGesturer(".back-gesturized", {
		bttn1Callback: function(evt) {alert("I'm button 1 and this is my favourite button on the citadel")},
		bttn2Callback: function(evt) {alert("I'm button 2 and this is my favourite button on the citadel")}
	});	
    
Possible values for the paramsObject:

1. "button1Callback" && "button2Callback" : function - _required_ 
   > callback-functions for when pressing the buttons, they receive the event as a parameter and their context is the DOM-node of the pressed button.

2. "button1Text" && "button2Text": string - _required if you are generating the buttons with backGesturer_
    >Text-labels for the buttons, the string is wrapped in a span-element, can be HTML.

3. "hwAcceleration": true || false,  _default: true_
    > If you set this to false, The CSS-property "left" will be used instead of detecting transitions.
    > If you're on a browser that doesn't support transitions, left will also be used

4. "onMoveStart": function - _optional_
    > callback-function for when an element's contentwrapper first starts being translated,
    
    > Usage examples:
    
    > disable the rest of the UI when the buttons are exposed
    
    > If you use a content-scroller like iScroll, disable it when backgesturer activates on an element
    
5. "onMoveReset": function - _optional_
    > callback-function for when an element's contentwrapper is back at its original position (0,0)
    
    > Usage examples:
    
    > enable the rest of the UI when the buttons are covered
    
    > If you use a content-scroller like iScroll and disabled it on onMoveStart, enable it back.

6. "onMoveEnd": function - _optional_
    > callback-function for when an element's contentwrapper is back at its original position (0,0) or the buttons are exposed


7. "resetOnWindowScroll": true || false _optional, default: false_  
    > setting this to _true_ will reset currently translated elements when the window scrolls
    
8. "onBeforeMoveStart": function _optional_, must return a truthy or a falsy value
    > This function, if present, is launched when determining if the element can be dragged
    > So you can have your own custom check to decide if the element can be dragged
    > context of the function is the element that the user is pressing
    
    ##Info
    For best performance, use the following structure in the elements you use backgesture on:

        wrapper
            .backgesture-content-wrapper (contains the actual visible content of the element)
            .backgesture-button-wrapper
                .backgesture-button.backgesture-button1
                    span "buttontitle"
                .backgesture-button.backgesture-button2
                    span "buttontitle
                    
        for example:
        <li class="back-gesturized">
		    <div class="backgesture-content-wrapper">
                <span>Lorem ipsum asd asd</span>
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

In case you use backgesturer on an element with no .backgesture-content-wrapper or .backgesture-button-wrapper, they will be generated, but the performance will be poor. Especially in a large node-collection.

##Browser support
Should work on all modern browsers, but please note that I made this primarily for mobile-webapps.
###Tested on

1. iPad 3 and iPhone 5 with iOS 7
2. latest Chrome, 30.0
3. Latest Firefox, 24.0
4. Opera 12.16 and 17.0
5. IE 9, but has some minor bugs, like buttons not always working

##TODO:
1. Solve the context-problem (More than one instance of backgesturer --> explosions) -- Should be fixed
2. Move all the styles to the JS so no additional CSS-files required (necessary?)
3. Improve the code-quality...
    
    
    
    
    
