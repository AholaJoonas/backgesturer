function backGesturer(elems, options) {
    "use strict";
    var thisRef = this;
    options = options || {};

    this.elems =  typeof elems === "string" ? document.querySelectorAll(elems) : elems;
    
    if(!this.elems || !this.elems.length) {
        this.disabled = true;
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
    
    this.startEvents = [];
    this.moveEvents = [];
    this.moveCancelEvents = [];
    this.stopEvents = [];
    
    if(!this.options.touchEnabled) {
        this.startEvents = ["mousedown"];
        this.moveEvents = ["mousemove"];
        this.moveCancelEvents = [];
        this.stopEvents = ["mouseup"];
    }

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
    this.rFrame = this.normalizeAnimationFrame(),
    this.correctClickEvent = this.options.touchEnabled ? "touchend" :
                             this.options.pointersEnabled ? "MSPointerUp" : "click";

    //coordinates
    this.startX = 0,
    this.startY = 0;
    this.currentX = 0;
    this.currentY = 0;

    //Need to be bound here to preserve context of this backgesturer-instance
    //TODO: think of a way to get these to prototype functions?
    this.eventHandlers = {

        onMoveStart: function(evt) {
            evt.preventDefault();
            var context = thisRef,
                startX = context.getCoordinatesFromEvent(evt, "x"),
                startY = context.getCoordinatesFromEvent(evt, "y"),
                currentAmount = context.currentElement ? context.getCurrentMoveAmount(context.currentElement) : 0;
                
            //If element is "snapping"
            if(context.isTranslating) {
                return;
            }
            
            //An element is already translated, reset it first
            //But not if it is the current node, ie. if user is clicking the buttons
            if(context.currentX && context.currentX !== 0 && (!this.isEqualNode(context.currentElement) && currentAmount !== 0) ) {
                return context.resetCurrentElement();
            }
            
            //Launch the onBeforeMove-callback if present
            if(context.options.onBeforeMove) {
                if(!context.options.onBeforeMove.call(this)) {
                    return console.log("onBeforeMove returned false, not proceeding");
                }
            }
            //Set a flag indicating that this is an element that had it's buttons already exposed
            if(currentAmount) {
                context.draggedElement = true;
            }
            //Save a reference to this DOM-element
            context.currentElement = this;

            context.setCoords(startX, startY);
            context.setCoords(startX, startY, true);
            context.stStamp = evt.timeStamp;

            context.bindEvents(window, context.moveEvents, context.eventHandlers.onMove, false);
            if(context.moveCancelEvents.length) {
                context.bindEvents(this, context.moveCancelEvents, context.eventHandlers.onMoveCancel, false);
            }
            context.bindEvents(window, context.stopEvents, context.eventHandlers.onMoveEnd, false);

        },

        onMove: function(evt) {
             
            evt.preventDefault();
            
            var context = thisRef;
            
            if(context.isLocked) {
                return;
            }
            
            var startX = context.currentX,
                startY = context.currentY,
                origX = context.startX,
                origY = context.startY,
                currentX = context.getCoordinatesFromEvent(evt, "x"),
                currentY = context.getCoordinatesFromEvent(evt, "y"),
                amountMoved = Math.abs(startX - currentX),
                correctDir = Math.abs(origY - currentY) < Math.abs(origX - currentX),
                isClick = Math.abs(origX - currentX) < 15,
                dirPrefix = startX - currentX > 0 ? "-" : "";
                amountMoved = dirPrefix+amountMoved;
                
            //If user has moved on Y-axel too much, lock down until the end-event   
            if(evt.timeStamp - context.stStamp < 100 && !correctDir && isClick){
                //console.log("locking transitions, too much Y");
                return context.isLocked = 1;

            }
            if(context.startX - currentX < 0 && !context.draggedElement) {
                var curAmount = context.getCurrentMoveAmount(context.currentElement);
                console.log("user swiping wrong direction, locking");
                if(curAmount !== 0) {
                    return context.snapToPosition(context.currentElement, 0, curAmount, function(elementResetted) {
                        
                            //context.launchOnMoveResetCallback();
                        
                    })
                }
                return context.isLocked = 1;
            }
            
            if(!isClick && !context.isTranslating && Math.abs(amountMoved) > 0) {
                context.launchOnMoveStartCallback();
                context.moveContentWrapper(amountMoved);
                context.setCoords(currentX, currentY);
            }

        },

        onMoveCancel: function(evt) {
            thisRef.determineWhichSnap();
        },

        onMoveEnd: function(evt) {
            console.log("onMoveEnd");
            var context = thisRef,
                isClick = evt.timeStamp - context.stStamp < 150 && Math.abs(context.startX - context.getCoordinatesFromEvent(evt, "x")) < 5;
                
            context.unbindEvents(window, context.moveEvents, context.eventHandlers.onMove, false);
            if(context.moveCancelEvents.length) {
                context.unbindEvents(context.currentElement, context.moveCancelEvents, context.eventHandlers.onMoveCancel, false);
            }
            context.unbindEvents(window, context.stopEvents, context.eventHandlers.onMoveEnd, false);
            
            //Reset flags
            context.draggedElement = 0;
            if(context.isLocked) {
                context.isLocked = 0;
            }
            if(!isClick) {
                context.determineWhichSnap();
                return;
            }
            
        },

        button1Clicked: function(evt) { 
            evt.stopPropagation();
            evt.preventDefault();
            if(thisRef.correctClickEvent === "touchend") {
                var e = document.elementFromPoint(evt.changedTouches[0].pageX, evt.changedTouches[0].pageY);
                if(thisRef.determineIfStillOnButton(e) === "1") {
                    thisRef.options.button1Callback.apply(this, [evt]);
                }
            }else {
                thisRef.options.button1Callback.apply(this, [evt]);
            }
        },

        button2Clicked: function(evt) {
            evt.stopPropagation();
            evt.preventDefault();
            if(thisRef.correctClickEvent === "touchend") {
                var e = document.elementFromPoint(evt.changedTouches[0].pageX, evt.changedTouches[0].pageY);
                if(thisRef.determineIfStillOnButton(e) === "2") {
                    thisRef.options.button2Callback.apply(this, [evt]);
                }
            }else {
                thisRef.options.button2Callback.apply(this, [evt]);
            }
        },

        onWindowScroll: function(evt) {
            //console.log("onWindowScroll");
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
            },
            buttonWrapperStyles = {
                width: this.options.buttonWrapperWidth+"px"
            };

        for(;i<l;i++) {
            var e = this.elems[i],
                bWrapper = e.querySelector(".backgesture-button-wrapper");
                
            for(var s in wrapperStyles) {
                e.style[s] = wrapperStyles[s];
            }
            for(var s in buttonWrapperStyles) {
                bWrapper.style[s] = buttonWrapperStyles[s];
            }
        }
    },

    afterSingleElementSnapped: function(elemResetted) {
        //Reset the current and start coordinates if snapping to default position
        //Else bind the buttons
        if(elemResetted) {
            this.resetState();
        }else {
            this.bindButtons();
        }
        this.launchOnMoveEndCallback();
    },

    attachToElems: function() {
        var i = 0, l = this.elems.length;

        for(;i<l;i++) {
            var e = this.elems[i].querySelector(".backgesture-content-wrapper");
            this.bindEvents(e, this.startEvents, this.eventHandlers.onMoveStart, false);
        }
    },

    bindButtons: function(elems) {
        console.log("bindButtons");
        if(this.buttonsBound) {
            console.log("buttons already bound, not binding again");
            return false;
        }
        var elementsToBind = !elems ? [this.currentElement] : elems,
            context = this;

        elementsToBind.forEach( function(elem) {
            console.log("Binding clickevents to ");
            console.dir(elem);
            var button1 = elem.parentElement.querySelector(".backgesture-button1"),
                button2 = elem.parentElement.querySelector(".backgesture-button2");

            console.log(button1);
            
            context.bindEvents(button1, [context.correctClickEvent], context.eventHandlers.button1Clicked, false);
            context.bindEvents(button2, [context.correctClickEvent], context.eventHandlers.button2Clicked, false);
        });
        
        
        this.buttonsBound = 1;
        
        
    },

    unbindButtons: function(elems) {
        console.log("unbindButtons");
       
        var elementsToBind = !elems ? [this.currentElement] : elems,
            context = this;

        elementsToBind.forEach( function(elem) {
            var button1 = elem.parentElement.querySelector(".backgesture-button1"),
                button2 = elem.parentElement.querySelector(".backgesture-button2");
            
            context.unbindEvents(button1, [context.correctClickEvent], context.eventHandlers.button1Clicked, false);
            context.unbindEvents(button2, [context.correctClickEvent], context.eventHandlers.button2Clicked, false);
        });
        
        this.buttonsBound = 0;
    },

    bindEvents: function(elem, events, callback, capture) {
        events.forEach(function(anEvent){
            //console.log("binding: "+anevent+" to "+elem.className);
            elem.addEventListener(anEvent, callback, capture);
        });
    },

    bindScrollEvent: function() {
        if(this.options.resetOnWindowScroll) {
          window.addEventListener("scroll", this.eventHandlers.onWindowScroll, false);
        }
    },

    unbindEvents: function(elem, events, callback, capture) {
        events.forEach(function(anEvent){
            elem.removeEventListener(anEvent, callback, capture);
        });
    },

    createButtonsWrapper: function() {
        var buttons = document.createElement("div"),
            button1 = document.createElement("div"),
            button2 = document.createElement("div"),
            button1Text = this.options.button1Text,
            button2Text = this.options.button2Text;

        if(!button1Text || !button2Text) {
            /*
            throw {
                name: "ButtonError",
                message: "No text for button 1 or 2",
                toString: function(){return this.name + ": " + this.message;}
            };
            */
           
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
    
    deattachFromButtons: function() {
        _c.dir(this);
        var i = 0, l = this.elems.length;
        
        if(this.disabled) {
            return true;
        }

        for(;i<l;i++) {
            var e = this.elems[i].querySelector(".backgesture-content-wrapper");
            //if it doesn't exist, its probably removed from the DOM
            if(e) {
                this.unbindEvents(e, this.startEvents, this.eventHandlers.onMoveStart, false);
            }
            
        }
        //If currentelement is set, remove its handlers
        if(this.currentElement) {
            this.unbindButtons();
            this.unbindEvents(this.currentElement, this.moveEvents, this.eventHandlers.onMove, false);
            if(this.moveCancelEvents.length) {
                this.unbindEvents(this.currentElement, this.moveCancelEvents, this.eventHandlers.onMoveCancel, false);
            }
            this.unbindEvents(document, this.stopEvents, this.eventHandlers.onMoveEnd, false);
        }
        if(this.options && this.options.resetOnWindowScroll) {
            window.removeEventListener("scroll", this.eventHandlers.onWindowScroll, false);
        }
    },
    
    destroy: function() {
        var that = this;
        this.resetCurrentElement(function destroyAfterTranslating() {
            that.deattachFromButtons();
        });
    },
    
    determineIfStillOnButton: function(e) {
        //console.log("determineIfStillOnButton");
        //console.log(e);
        var isButton = e.className.indexOf("backgesture-button") !== -1;
        
        if(isButton) {
            //console.log("still on button!");
            return e.className.indexOf("backgesture-button1") !== -1 ? "1" : "2";
        }
        while(e.parentElement) {
            e = e.parentElement;
            //console.log(e);
            if(e.className.indexOf("backgesture-button") !== -1) {
                return e.className.indexOf("backgesture-button1") !== -1 ? "1" : "2";
            }
        }
        return false;
    },

    determineWhichSnap: function() {
        var contentWrapper = this.currentElement,
            currentAmount = this.getCurrentMoveAmount(contentWrapper),
            buttonWrapperWidth = this.currentElement.parentElement.querySelector(".backgesture-button-wrapper").clientWidth,
            snapTo = -currentAmount > (buttonWrapperWidth/2) ? (-buttonWrapperWidth-1) : 0;

        this.snapToPosition(contentWrapper, snapTo, currentAmount, this.afterSingleElementSnapped);
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
        this.addContentWrapper();
        this.addButtons();
        this.determineButtonWrapperWidth();
        this.addStyles();
        this.attachToElems();
    },
    
    launchOnMoveEndCallback: function() {
        //console.log("onMoveEndCallback");
        if(this.options.onMoveEnd) {
            this.options.onMoveEnd.call(this.currentElement.parentElement);
        }
    },
    
    launchOnMoveStartCallback: function() {
        if(!this.onMoveStartCalled) {
            if(this.options.onMoveStart) {
                this.options.onMoveStart.call(this.currentElement.parentElement);
            }
            this.onMoveStartCalled = 1;
        }
    },
    
    launchOnMoveResetCallback: function() {
        //console.log("onMoveResetCallback");
        if(this.options.onMoveReset) {    
            this.options.onMoveReset.call(this.currentElement.parentElement);
        }
    },
    
    determineButtonWrapperWidth: function() {
        var width = this.measureTextWidthForButtons()*2 + 20,
            elemWidth = this.elems[0].clientWidth;
            
        this.options.buttonWrapperWidth = width < 150 ? 150 :  width < elemWidth ? width : elemWidth - 60;
    },
    
    measureTextWidthForButtons: function() {
        var button1Text = this.options.button1Text || this.elems[0].querySelector(".backgesture-button1").innerHTML,
            button2Text = this.options.button2Text || this.elems[0].querySelector(".backgesture-button2").innerHTML,
            text = button1Text.length > button2Text.length ? button1Text : button2Text,
            styles = window.getComputedStyle(this.elems[0].querySelector(".backgesture-button span")),
            testElem = document.createElement("div"),
            width;
            
            testElem.style.visibility = "hidden";
            testElem.style.position = "absolute";
            testElem.style.fontSize = styles.fontSize;
            testElem.style.textTransform = styles.textTransform;
            testElem.style.letterSpacing = styles.letterSpacing;
                
            testElem.innerHTML = text;
            
            document.body.appendChild(testElem);
            
            width = testElem.clientWidth;
            
            document.body.removeChild(testElem);
            return width;
    },
    
    moveContentWrapper: function(amount) {
        var prefixedTransform = this.correctTransform,
            amount = parseInt(amount, 10),
            contentWrapper = this.currentElement,
            curAmount = this.getCurrentMoveAmount(contentWrapper),
            correctAmount = curAmount + (Math.abs(amount) > 5 ? amount/1.3 : amount);
        
        if(Math.abs(amount) > 70 && correctAmount < 0) {
            this.snapToPosition(contentWrapper, correctAmount, curAmount, this.afterSingleElementSnapped);
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
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame  ||
            window.mozRequestAnimationFrame     ||
            window.oRequestAnimationFrame       ||
            window.msRequestAnimationFrame      ||
            function (callback) { window.setTimeout(callback, 1000 / 60); };
    },

    resetCurrentElement: function(callback) {
        if(this.currentElement) {
            var currentElemContentWrapper = this.currentElement,
            currentX = this.getCurrentMoveAmount(currentElemContentWrapper),
            context = this;
            this.snapToPosition(currentElemContentWrapper, 0, currentX, function afterCurrentElementSnapped(elementReset){
                context.afterSingleElementSnapped(elementReset);
                if(callback) {
                    callback.call();
                }
            });
        }else {
            if (callback) {
                callback.call();
            }
        }
    },

    resetState: function() {
        _c.log("resetState");
        this.setCoords(0,0);
        this.setCoords(0,0, true);
        this.unbindButtons();
        
        this.onMoveStartCalled = 0;
        this.launchOnMoveResetCallback();
    },

    animElements: function(action, index, type, callback) {
                    //no arguments, reveal all
        var elems = !index ? this.elems :
                    //single index
                    typeof index === "number" ? [this.elems[index]] : 
                    //Array of indexes
                    typeof index === "object" ? index : false,
                    context = this,
                    waveInterval,
                    contentWrappers = [];

        if(!elems) {
            return console.error("erroneous arguments for backGesturer.animElements");
        }
        //Array of indexes from the elements
        if(typeof index === "object") {
            elems = [];
            for(var idx in index) {
                elems.push(this.elems[index[idx]]);
            }
        }

        //Convert to array
        elems = Array.prototype.slice.call(elems);

        elems.forEach(function(elem) {
            contentWrappers.push(elem.querySelector(".backgesture-content-wrapper"));
        });

        //Bind buttons
        if(action === "reveal") {
            context.bindButtons(contentWrappers); 
        }else {
            context.unbindButtons(contentWrappers); 
        }
        

        var snapElement = function() {
            var elem = contentWrappers.length ? contentWrappers.shift() : false,
                snapCallback;
            //No more elems
            if(!elem) {
                return callback ? callback.call() : true;
            }

            console.dir(elem);
            var targetX = action === "reveal" ? elem.parentElement.querySelector(".backgesture-button-wrapper").clientWidth :
                                                0,
                currentPosition = context.getCurrentMoveAmount(elem);
            if(!type) {
                snapCallback = snapElement;
            }
            context.snapToPosition(elem, -targetX, currentPosition, snapCallback);
            
        };
        snapElement();


        if(type === "wave") {
            if(!waveInterval) {
                waveInterval = window.setInterval( function next() {
                    if(contentWrappers.length) {
                       snapElement(); 
                    }else {
                        window.clearInterval(waveInterval);
                        if(callback) {
                            callback.call();
                        }

                    }
                }, 75);
            }
        }
        

    },

    revealElements: function(index, type, callback) {
        this.animElements("reveal", index, type, callback);

    },

    unrevealElements: function(index, type, callback) {
        this.animElements("unreveal", index, type, callback);
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

    snapToPosition: function(elem, targetX, currentX, callback) {
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
                
                if(callback) {
                    callback.apply(context, [(targetX === 0)]);
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
