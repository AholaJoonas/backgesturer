function backGesturer(elems, options) {
	"use strict";
	options = options || {};

	this.elems =  typeof elems === "string" ? document.querySelectorAll(elems) : elems;
	
	if(!this.elems || !this.elems.length) {
		return false;
	}

	this.bodyStyles = document.body.style; //Cache styles

	this.options = {
		button1Callback: function(evt) {
			evt.stopPropagation();
			console.log("button1 pressed");
		},
		button2Callback: function(evt) {
			evt.stopPropagation();
			console.log("button2 pressed");
		},
		touchEnabled: "ontouchstart" in window,
		pointersEnabled: navigator.msPointerEnabled
	};

	for(var x in options) {
		this.options[x] = options[x];
	}

	this.startEvents = ["mousedown"];
	this.moveEvents = ["mousemove"];
	this.stopEvents = ["mouseup"];

	if (this.options.touchEnabled) {
		this.startEvents.push("touchstart");
		this.moveEvents.push("touchmove");
		this.stopEvents.push("touchend");
	}
	if(this.options.pointersEnabled) {
		this.startEvents.push("MSPointerDown");
		this.moveEvents.push("MSPointerMove");
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

	this.init();
	window.backGesturer = this;
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
		var i = 0, l = this.elems.length;

		for(;i<l;i++) {
			var e = this.elems[i];
			if(this.correctTransform !== "left") {
				e.style[this.correctTransform] === "translateZ(0)";
			}
		}
	},

	attachToElems: function() {
		var i = 0, l = this.elems.length;

		for(;i<l;i++) {
			this.bindStartEvent(this.elems[i]);
		}
	},

	bindButtonCallbacks: function() {
		var button1 = this.currentElement.querySelector(".backgesture-button1"),
			button2 = this.currentElement.querySelector(".backgesture-button2");

		this.bindEvents(button1, ["click"], this.button1Clicked, true);
		this.bindEvents(button2, ["click"], this.button2Clicked, true);
	},

	unbindButtons: function() {
		var button1 = this.currentElement.querySelector(".backgesture-button1"),
			button2 = this.currentElement.querySelector(".backgesture-button2");

		this.unbindEvents(button1, ["click"], this.button1Clicked, true);
		this.unbindEvents(button2, ["click"], this.button2Clicked, true);
	},

	bindEvents: function(elem, events, callback, capture) {
		var elems = elem ? elem : this.elems;

		console.dir(events);

		events.forEach(function(event){
			elems.addEventListener(event, callback, capture);
		});
	},

	unbindEvents: function(elem, events, callback, capture) {
		var elems = elem ? elem : this.elems;

		events.forEach(function(event){
			elems.removeEventListener(event, callback, capture);
		});
	},

	bindStartEvent: function(elem) {
		console.log("binding events");
		this.bindEvents(elem, this.startEvents, this.onStartEvent, false);
	},

	button1Clicked: function(evt) {
		evt.stopPropagation();
		window.backGesturer.options.button1Callback.apply(this, [evt]);
	},

	button2Clicked: function(evt) {
		evt.stopPropagation();
		window.backGesturer.options.button2Callback.apply(this, [evt]);
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
			}
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
			e.appendChild(contentWrapper)
		}else {
			e.appendChild(contentWrapper);
		}

	},

	determineWhichSnap: function() {
		console.log("determineWhichSnap");

		var	contentWrapper = this.querySelector(".backgesture-content-wrapper"),
			context = window.backGesturer,
			currentAmount = context.getCurrentMoveAmount.apply(contentWrapper, []),
			buttonWrapperWidth = this.querySelector(".backgesture-button-wrapper").clientWidth,
			snapTo = -currentAmount > (buttonWrapperWidth/2) ? (-buttonWrapperWidth-1) : 0;

		context.snapToCoordinates.apply(contentWrapper, [snapTo, currentAmount]);
	},

	getCurrentMoveAmount: function() {
		if(window.backGesturer.correctTransform !== "left") {
			return this.style[window.backGesturer.correctTransform] ? 
				parseInt(this.style[window.backGesturer.correctTransform].split("(")[1].split(",")[0], 10)
				:
				0;

		}else {
			return  this.style[window.backGesturer.correctTransform] ? 
						parseInt(this.style[window.backGesturer.correctTransform].split("p")[0], 10)
						:
						0;
		}
	},

	init: function() {
		this.addContentWrapper();
		this.addButtons();
		this.attachToElems();
	},

	moveContentWrapper: function(elem, amount) {

		var prefixedTransform = this.correctTransform,
			context = window.backGesturer,
			amount = parseInt(amount, 10),
			contentWrapper = elem.querySelector(".backgesture-content-wrapper"),
			buttonWrapperWidth = elem.querySelector(".backgesture-button-wrapper").clientWidth,
			curAmount = context.getCurrentMoveAmount.apply(contentWrapper, []),
			correctAmount = curAmount + amount;

		//If user is dragging to the left
	    if(curAmount >= 0 && correctAmount >= 0) {
	    	contentWrapper.style[prefixedTransform] = "translate(0,0)"+context.hwTrans;
	    	return;
	    }

		if(prefixedTransform !== "left") {
			contentWrapper.style[prefixedTransform] = "translate("+correctAmount+"px,0)"+context.hwTrans;
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

	onStartEvent: function(evt) {
		var startX = evt.pageX,
			startY = evt.pageY,
			context = window.backGesturer,
			that = this;

		//If element is "snapping"
		if(context.isTranslating) {
			return;
		}

		//An element is already translated, reset it first
		//But not if it is the current node, ie. if user is clicking the buttons
		if(context.currentX && context.currentX !== 0 && !this.isEqualNode(context.currentElement)) {
			evt.preventDefault();
			console.log("resetting currentElement first, currentX: "+context.currentX);
			return context.resetCurrentElement();
		}

		//Save a reference to this DOM-element
		context.currentElement = this;

		context.setCoords(startX, startY);
		context.setCoords(startX, startY, true);
		context.stStamp = evt.timeStamp;

		context.bindButtonCallbacks();
		context.bindEvents(this, context.moveEvents, context.onMove, false);
		context.bindEvents(document, context.stopEvents, context.onMoveEnd, false);

	},

	onMove: function(evt) {

		var context = window.backGesturer,
			startX = context.currentX,
			startY = context.currentY,
			origX = context.startX,
			origY = context.startY,
			currentX = evt.pageX,
			currentY = evt.pageY,
			amountMoved = Math.abs(startX - currentX),
			correctDir = Math.abs(origY - currentY) < 25,
			isClick = evt.timeStamp - context.stStamp < 150 && Math.abs(origX - currentX) < 5,
			dirPrefix = startX - currentX > 0 ? "-" : "";
			amountMoved = dirPrefix+amountMoved;

		if(correctDir && !isClick) {
			evt.preventDefault();
			context.moveContentWrapper(this, amountMoved);
			context.setCoords(currentX, currentY);
		}

	},

	onMoveEnd: function(evt) {
		console.log("onMoveEnd");
		var context = window.backGesturer,
			isClick = evt.timeStamp - context.stStamp < 150 && Math.abs(context.startX - evt.pageX) < 5;

	    context.unbindEvents(context.currentElement, context.moveEvents, context.onMove, false);
	    context.unbindEvents(document, context.stopEvents, context.onMoveEnd, false);
		if(!isClick) {
			context.determineWhichSnap.apply(context.currentElement, []);
			return;
		}
	},

	resetCurrentElement: function() {
		console.log("resetCurrentElement");
		var currentElemContentWrapper = this.currentElement.querySelector(".backgesture-content-wrapper"),
			currentX = this.getCurrentMoveAmount.apply(currentElemContentWrapper);

		this.snapToCoordinates.apply(currentElemContentWrapper, [0, currentX]);
	},

	resetState: function() {
		this.setCoords(0,0);
		this.setCoords(0,0, true);
		this.unbindButtons();
	},

	setCoords: function(x, y, start) {
		if(!start) {
			console.log("setting current coordinates: "+x+", "+y);
			this.currentX = x;
			this.currentY = y;
		}else {
			console.log("setting start coordinates: "+x+", "+y);
			this.startX = x;
			this.startY = y;
		}
	},

	snapToCoordinates: function(targetX, currentX) {
		var that = this,
			context = window.backGesturer;

		console.log("snapping to: "+targetX);

		function snapTo() {
			var amountRemaining = Math.abs(currentX - targetX),
				moveAmount = amountRemaining >= 20 ? Math.floor(amountRemaining/5) : 
						     amountRemaining >= 10 ? 3 : 1;

			if(currentX > targetX) {
				currentX = currentX - moveAmount;
			}else if(currentX < targetX) {
				currentX = currentX + moveAmount;
			}else {
				context.isTranslating = 0;
				//Reset the current and start coordinates if snapping to default position
				if(targetX === 0) {
					console.log("targetX === 0, resetting coords");
					context.resetState();
				}else {
					context.setCoords(targetX, context.currentY);
				}
				return;
			}
			if(context.correctTransform !== "left") {
				that.style[context.correctTransform] = "translate("+currentX+"px, 0)"+context.hwTrans;
			}else {
				that.style[context.correctTransform] = currentX+"px";
			}
			window.backGesturer.rFrame.call(window, snapTo);
		};
		window.backGesturer.rFrame.call(window, snapTo);
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
