function backGesturer(elems, options) {
	"use strict";
	var thisRef = this;
	options = options || {};

	this.elems =  typeof elems === "string" ? document.querySelectorAll(elems) : elems;
	
	if(!this.elems || !this.elems.length) {
	    alert("returning false");
		return false;
	}

	this.bodyStyles = document.body.style; //Cache styles

	this.options = {
		button1Callback: function(evt) {
			evt.stopPropagation();
		},
		button2Callback: function(evt) {
			evt.stopPropagation();
		},
		touchEnabled: "ontouchstart" in window,
		pointersEnabled: navigator.msPointerEnabled,
		isAndroid: navigator.userAgent.match(/Android/i)
	};

	for(var x in options) {
		this.options[x] = options[x];
	}

	this.startEvents = ["mousedown"];
	this.moveEvents = ["mousemove"];
	this.moveCancelEvents = [];
	this.stopEvents = ["mouseup"];

	if (this.options.touchEnabled) {
		this.startEvents.push("touchstart");
		this.moveEvents.push("touchmove");
		this.moveCancelEvents.push("touchcancel");
		this.stopEvents.push("touchend");
	}
	if(this.options.pointersEnabled) {
		this.startEvents.push("MSPointerDown");
		this.moveEvents.push("MSPointerMove");
		this.moveCancelEvents.push("MSPointerCancel");
		this.stopEvents.push("MSPointerUp");
	}

	this.correctTransform = options.hwAcceleration === false ? "left" : this.useTransforms() || "left";
	this.hwTrans = options.hwAcceleration === false ? "" : this.use3dTransforms() ?  " translateZ(0)" : "";
	this.rFrame = this.normalizeAnimationFrame();

	//coordinates
	this.startX = 0,
	this.startY = 0;
	this.currentX = 0;
	this.currentY = 0;

	//Need to be bound here to preserve context of this backgesturer-instance
	//TODO: think of a way to get these to prototype functions?
	this.eventHandlers = {

		onMoveStart: function(evt) {
			var context = thisRef,
			    startX = context.getCoordinatesFromEvent(evt, "x"),
                startY = context.getCoordinatesFromEvent(evt, "y"),
				that = this;

			//If element is "snapping"
			if(context.isTranslating) {
				return;
			}

			//An element is already translated, reset it first
			//But not if it is the current node, ie. if user is clicking the buttons
			if(context.currentX && context.currentX !== 0 && !this.isEqualNode(context.currentElement)) {
				evt.preventDefault();
				return context.resetCurrentElement();
			}

			//Save a reference to this DOM-element
			context.currentElement = this;

			context.setCoords(startX, startY);
			context.setCoords(startX, startY, true);
			context.stStamp = evt.timeStamp;

			context.bindButtonCallbacks();
			context.bindEvents(this, context.moveEvents, context.eventHandlers.onMove, false);
			if(context.moveCancelEvents.length) {
				context.bindEvents(this, context.moveCancelEvents, context.eventHandlers.onMoveCancel, false);
			}
			context.bindEvents(document, context.stopEvents, context.eventHandlers.onMoveEnd, false);

		},

		onMove: function(evt) {
		    if( thisRef.options.isAndroid ) {
		      evt.preventDefault();
		    }
			var context = thisRef;
			
			if(context.isLocked) {
                return;
            }
			
			var	startX = context.currentX,
				startY = context.currentY,
				origX = context.startX,
				origY = context.startY,
				currentX = context.getCoordinatesFromEvent(evt, "x"),
				currentY = context.getCoordinatesFromEvent(evt, "y"),
				amountMoved = Math.abs(startX - currentX),
				correctDir = Math.abs(origY - currentY) < Math.abs(origX - currentX),
				isClick = evt.timeStamp - context.stStamp < 150 && Math.abs(origX - currentX) < 5,
				dirPrefix = startX - currentX > 0 ? "-" : "";
				amountMoved = dirPrefix+amountMoved;
				
			//If user has moved on Y-axel too much, lock down until the end-event	
		    if(evt.timeStamp - context.stStamp < 100 && !correctDir) {
		        console.log("locking transitions, too much Y");
		        context.isLocked = 1;
		    }
            
			if(!isClick && !context.isTranslating && Math.abs(amountMoved) > 0) {
				evt.preventDefault();
				context.launchOnMoveStartCallback();
				context.moveContentWrapper(amountMoved);
				context.setCoords(currentX, currentY);
			}

		},

		onMoveCancel: function(evt) {
			thisRef.determineWhichSnap();
		},

		onMoveEnd: function(evt) {
			var context = thisRef,
				isClick = evt.timeStamp - context.stStamp < 150 && Math.abs(context.startX - context.getCoordinatesFromEvent(evt)) < 5;
				
		    context.unbindEvents(context.currentElement, context.moveEvents, context.eventHandlers.onMove, false);
		    if(context.moveCancelEvents.length) {
		    	context.unbindEvents(context.currentElement, context.moveCancelEvents, context.eventHandlers.onMoveCancel, false);
		    }
		    context.unbindEvents(document, context.stopEvents, context.eventHandlers.onMoveEnd, false);
		    
		    if(context.isLocked) {
		        context.isLocked = 0;
		        return;
		    }
			if(!isClick) {
				context.determineWhichSnap();
				return;
			}
			
		},

		button1Clicked: function(evt) {
			evt.stopPropagation();
			thisRef.options.button1Callback.apply(this, [evt]);
		},

		button2Clicked: function(evt) {
			evt.stopPropagation();
			thisRef.options.button2Callback.apply(this, [evt]);
		},

		onWindowScroll: function(evt) {
			if(thisRef.isTranslating || thisRef.currentX !== 0) {
				evt.preventDefault();
				thisRef.resetCurrentElement();
			}
		}

	};

	this.init();
	return this;
};

backGesturer.prototype = {

	addButtons: function() {
		var i = 0, l = this.elems.length;

		for(;i<l;i++) {
			var e = this.elems[i];
			if(!e.querySelectorAll(".backgesture-button-wrapper").length) {
				e.appendChild(this.createButtonsWrapper());
			}
		}
	},

	addContentWrapper: function() {
		var i = 0, l = this.elems.length;

		for(;i<l;i++) {
			var e = this.elems[i];
			if(!e.querySelectorAll(".backgesture-content-wrapper").length) {
				this.createContentWrapper(e);
			}
		}
	},

	addStyles: function() {
		var i = 0, 
			l = this.elems.length,
			wrapperStyles = {
				overflow: "hidden",
				position: "relative"
			};

		for(;i<l;i++) {
			var e = this.elems[i];
			if(this.correctTransform !== "left") {
				for(var s in wrapperStyles) {
					e.style[s] = wrapperStyles[s];
				}
			}
		}
	},

	attachToElems: function() {
		var i = 0, l = this.elems.length;

		for(;i<l;i++) {
			this.bindEvents(this.elems[i], this.startEvents, this.eventHandlers.onMoveStart, false);
		}
	},

	bindButtonCallbacks: function() {
		var button1 = this.currentElement.querySelector(".backgesture-button1"),
			button2 = this.currentElement.querySelector(".backgesture-button2");

		this.bindEvents(button1, ["click"], this.eventHandlers.button1Clicked, true);
		this.bindEvents(button2, ["click"], this.eventHandlers.button2Clicked, true);
	},

	unbindButtons: function() {
		var button1 = this.currentElement.querySelector(".backgesture-button1"),
			button2 = this.currentElement.querySelector(".backgesture-button2");

		this.unbindEvents(button1, ["click"], this.eventHandlers.button1Clicked, true);
		this.unbindEvents(button2, ["click"], this.eventHandlers.button2Clicked, true);

	},

	bindEvents: function(elem, events, callback, capture) {
		var elems = elem ? elem : this.elems;

		events.forEach(function(aevent){
			elems.addEventListener(aevent, callback, capture);
		});
	},

	bindScrollEvent: function() {
		window.addEventListener("scroll", this.eventHandlers.onWindowScroll, false);
	},

	unbindEvents: function(elem, events, callback, capture) {
		var elems = elem ? elem : this.elems;
		
		events.forEach(function(aevent){
			elems.removeEventListener(aevent, callback, capture);
		});
	},

	createButtonsWrapper: function() {
		var buttons = document.createElement("div"),
			button1 = document.createElement("div"),
			button2 = document.createElement("div"),
			button1Text = this.options.button1Text,
			button2Text = this.options.button2Text;

		if(!button1Text || !button2Text) {
			throw {
				name: "ButtonError",
				message: "No text for button 1 or 2",
				toString: function(){return this.name + ": " + this.message} 
			};
		}

		buttons.className += " backgesture-button-wrapper";

		button1.className += " backgesture-button backgesture-button1";
		button1.innerHTML = "<span>"+this.options.button1Text+"</span>";

		button2.className += " backgesture-button backgesture-button2";
		button2.innerHTML = "<span>"+ this.options.button2Text +"</span>";

		buttons.appendChild(button1);
		buttons.appendChild(button2);

		return buttons;
	},

	createContentWrapper: function(e) {
		var eContent = e.children,
			contentWrapper = document.createElement("div");

		contentWrapper.className += " backgesture-content-wrapper";
		if(eContent.length) {
			while(eContent.length) {
				contentWrapper.appendChild(eContent[0]);
			}
			e.appendChild(contentWrapper);
		}else {
			e.appendChild(contentWrapper);
		}

	},

	determineWhichSnap: function() {
		var	contentWrapper = this.currentElement.querySelector(".backgesture-content-wrapper"),
			currentAmount = this.getCurrentMoveAmount(contentWrapper),
			buttonWrapperWidth = this.currentElement.querySelector(".backgesture-button-wrapper").clientWidth,
			snapTo = -currentAmount > (buttonWrapperWidth/2) ? (-buttonWrapperWidth-1) : 0;

		this.snapToCoordinates(contentWrapper, snapTo, currentAmount);
	},

	getCurrentMoveAmount: function(elem) {
		if(this.correctTransform !== "left") {
			return elem.style[this.correctTransform] ? 
				parseInt(elem.style[this.correctTransform].split("(")[1].split(",")[0], 10)
				:
				0;

		}else {
			return  elem.style[this.correctTransform] ? 
						parseInt(elem.style[this.correctTransform].split("p")[0], 10)
						:
						0;
		}
	},
	
	getCoordinatesFromEvent: function(evt, which) {
	    var coord = which === "x" ? "pageX" : "pageY",
	        properCell =  evt.touches && evt.touches.length ? evt.touches[0] : evt.changedTouches ? evt.changedTouches[0] : evt;
	    
	    return this.options.touchEnabled ? properCell[coord] : properCell[coord];
	},
	
	init: function() {
		this.bindScrollEvent();
		this.addStyles();
		this.addContentWrapper();
		this.addButtons();
		this.attachToElems();
	},
	
	launchOnMoveEndCallback: function() {
        if(this.options.onMoveEnd) {
            console.log("onMoveEnd");
            this.options.onMoveEnd.call();
        }
    },
	
	launchOnMoveStartCallback: function() {
	    if(this.options.onMoveStart && !this.onMoveStartCalled) {
	        console.log("onMoveStart");
	        this.options.onMoveStart.call();
	        this.onMoveStartCalled = 1;
	    }
	},
	
	moveContentWrapper: function(amount) {
		var prefixedTransform = this.correctTransform,
			amount = parseInt(amount, 10),
			elem = this.currentElement,
			contentWrapper = elem.querySelector(".backgesture-content-wrapper"),
			curAmount = this.getCurrentMoveAmount(contentWrapper),
			correctAmount = curAmount + (Math.abs(amount) > 5 ? amount/1.3 : amount);
		
	    if(Math.abs(amount) > 70 && correctAmount < 0) {
			this.snapToCoordinates(contentWrapper, correctAmount, curAmount);
		}	
		//If user is dragging to the left
	    if(curAmount >= 0 && correctAmount >= 0) {
	    	contentWrapper.style[prefixedTransform] = "translate(0,0)"+this.hwTrans;
	    	return;
	    }

		if(prefixedTransform !== "left") {
			contentWrapper.style[prefixedTransform] = "translate("+correctAmount+"px,0)"+this.hwTrans;
		}else {
			contentWrapper.style[prefixedTransform] = correctAmount+"px";
		}
		

	},

	normalizeAnimationFrame: function() {
		return window.requestAnimationFrame	||
			window.webkitRequestAnimationFrame	||
			window.mozRequestAnimationFrame		||
			window.oRequestAnimationFrame		||
			window.msRequestAnimationFrame		||
			function (callback) { window.setTimeout(callback, 1000 / 60); };
	},

	resetCurrentElement: function() {
		var currentElemContentWrapper = this.currentElement.querySelector(".backgesture-content-wrapper"),
			currentX = this.getCurrentMoveAmount(currentElemContentWrapper);

		this.snapToCoordinates(currentElemContentWrapper, 0, currentX);
	},

	resetState: function() {
		this.setCoords(0,0);
		this.setCoords(0,0, true);
		this.unbindButtons();
		
		
		this.onMoveStartCalled = 0;
		this.launchOnMoveEndCallback();
	},

	setCoords: function(x, y, start) {
		if(!start) {
			this.currentX = x;
			this.currentY = y;
		}else {
			this.startX = x;
			this.startY = y;
		}
	},

	snapToCoordinates: function(elem, targetX, currentX) {
		var that = elem,
			context = this;

		function snapTo() {
			var amountRemaining = Math.abs(currentX - targetX),
				moveAmount = amountRemaining >= 20 ? Math.floor(amountRemaining/5) : 
						     amountRemaining >= 10 ? 3 : 
						     //Last one is needed because sometimes this can be < 0, so we need to then move the exact amount
						     amountRemaining < 1 ? amountRemaining : 1;

			if(currentX > targetX) {
				currentX = currentX - moveAmount;
			}else if(currentX < targetX) {
				currentX = currentX + moveAmount;
			}else {
			    //Will attach eventlisteners again
			    context.isTranslating = 0;
				//Reset the current and start coordinates if snapping to default position
				if(targetX === 0) {
					context.resetState();
				}
				return;
			}
			if(context.correctTransform !== "left") {
				that.style[context.correctTransform] = "translate("+currentX+"px, 0)"+context.hwTrans;
			}else {
				that.style[context.correctTransform] = currentX+"px";
			}
			context.rFrame.call(window, snapTo);
		};
		context.rFrame.call(window, snapTo);
		context.isTranslating = 1;

	},

	useTransforms: function() {
		var transforms = {
            "webkitTransform": "-webkit-transform",
            "msTransform": "-ms-transform",
            "MozTransform": "-moz-transform",
            "transform": "transform"
    	};
		return this.testStyles(transforms);
	},

	use3dTransforms: function() {
		var transforms = {
            "webkitPerspective": "-webkit-perspective",
            "msPerspective": "-ms-perspective",
            "MozPerspective": "-moz-perspective",
            "perspective": "perspective"
    	};
		return this.testStyles(transforms);
	},

	testStyles: function(styles) {
		for(var x in styles) {
			if (this.bodyStyles[x] !== undefined) {
				return x;
			}
		}
		return false;
	}
};
