/*
  magic-slider ... Version 0.1.0
  https://github.com/orangenwerk/magic-slider   /   http://orangenwerk.github.com/magic-slider/
  **************************************************************************************************
  based on jQuery Coda-Slider v2.0 / Coda-Slider v2.1 / moutardeSlider
  Coda-Slider v2.0 - http://www.ndoherty.biz/coda-slider
  Coda-Slider v2.1 - https://github.com/jgillman/Coda-Slider-2.1
  moutardeSlider - https://github.com/fstephany/moutardeSlider
  MIT license.
  **************************************************************************************************
  improvenments by Austin Strange
*/

$.fn.magicSlider = function(settings) {

	settings = $.extend({
		autoHeight: true,
		autoHeightEaseDuration: 1000,
		autoHeightEaseFunction: "swing",
		autoSlide: false,
		autoCycle: false,
		autoSlideInterval: 7000,
		autoSlideStopWhenClicked: true,
		crossLinking: false,
		dynamicArrows: true,
		dynamicArrowLeftText: "&#171;",
		dynamicArrowRightText: "&#187;",
		dynamicTabs: true,
		dynamicTabsAlign: "center",
		dynamicTabsPosition: "top",
		dynamicTabsContent: "title",		// "title" / "count"
		externalTriggerSelector: "a.xtrig",
		highlightExternalTrigger: false,
		firstPanelToLoad: 1,
		panelTitleSelector: "h2.title",
		slideEaseDuration: 1000,
		slideEaseFunction: "swing",
		slideDirection: "horizontal", // "horizontal" / "vertical"
		carousel: false,
		changeSliderHeadline: false,
		sliderHeadlineSelector: "#magic_slider_head",	// Selector for headline
		lightBoxOpenSelector: "lbOverlay",  // lightbox overlay div
		observeLightBoxOpen: false,
		pauseOnMouseEnter: false   // affects autoSlide
	}, settings);

	return this.each(function(){

		var mouseEvent = false, slider = $(this), sliderID = slider.attr('id');

		// If Headlineanimation wanted
		if ( settings.changeSliderHeadline == true ){ var panelHeadlines = new Array(); };
		
		var panelsHeights = new Array();

		// N E W .. no more need for panel-class
		slider.children().each( function(index) {
			$(this).addClass( sliderID + '_panel' );
			panelsHeights[ index ] = $(this).height();
			if ( settings.changeSliderHeadline == true ){
				if ( $(this).find(settings.panelTitleSelector).length > 0 ){
					panelHeadlines[ index ] = $(this).find(settings.panelTitleSelector).html(); 
				} else {
					panelHeadlines[ index ] = index;
				};
			};
		});
		
		var biggestPanel = Array_max( panelsHeights );

		// If we need arrows
		if (settings.dynamicArrows) {
			slider.parent().addClass("arrows");
			slider.before('<div class="magic-nav-left" id="magic-nav-left-' + sliderID + '"><a href="#">' + settings.dynamicArrowLeftText + '</a></div>');
			slider.after('<div class="magic-nav-right" id="magic-nav-right-' + sliderID + '"><a href="#">' + settings.dynamicArrowRightText + '</a></div>');
		};

		// Slider vars
		var 	panelWidth = slider.find('.' + sliderID + '_panel').width(),
				panelCount = slider.find('.' + sliderID + '_panel').size(),
				navClicks = 0; 		// Used if autoSlideStopWhenClicked = true
				last = false; 		// Used in carousel mode
				clon = ''; 			// Used in carousel mode => 'first' / 'last'

		// Special vars depend on Slider-Type
		if (settings.slideDirection == "horizontal"){
			var panelContainerWidth = (settings.carousel) ? panelWidth*( panelCount+1 ) : panelWidth*panelCount
			slider.css('height', 'auto');
			slider.find('.' + sliderID + '_panel').css('height', 'auto');
		} else {
			var panelHeight = slider.find('.' + sliderID + '_panel').height();
			var panelContainerWidth = panelWidth;
			var panelContaineroffset = new Array();
			var daHeight = 0;
			slider.find('.' + sliderID + '_panel').each(function(index) {
				panelContaineroffset[ index ] =  daHeight;
				daHeight = daHeight + $(this).height();
			});
			var panelContainerHeight = (settings.carousel) ? (daHeight + panelHeight) : daHeight;
			if (settings.autoHeight != true) {
				daHeight = 0;
				slider.find('.' + sliderID + '_panel').each(function(index) {
					panelContaineroffset[ index ] =  daHeight;
					daHeight = daHeight + biggestPanel;
					panelsHeights[ index ] = biggestPanel;
					$(this).height( biggestPanel );
				});
			}
		};

		// Surround the collection of panel divs with a container div (wide enough for all panels to be lined up end-to-end)
		$('.' + sliderID + '_panel', slider).wrapAll('<div class="' + sliderID + '_panel_container panel-container"></div>');
		// Specify the width of the container div (wide enough for all panels to be lined up end-to-end)
		if (settings.slideDirection != "horizontal") {
			$('.' + sliderID + '_panel_container', slider).css({ height: panelContainerHeight });
		} else {
			$('.' + sliderID + '_panel_container', slider).css({ width: panelContainerWidth });
		};
		
		
		// observe lightbox init to pause autoSlide
		if (settings.observeLightBoxOpen === true) {
			$('#' + settings.lightBoxOpenSelector).attrchange(function(attrName) {
			var currentDisplay = $('#' + settings.lightBoxOpenSelector).css('display');
			if ( currentDisplay === 'block') {
					mouseEvent = true;
				} else {
					mouseEvent = false;
				}
			});
		}
		
		// check if pauseOnMouseEnter is true, set mouseEvent Boolean
		if (settings.pauseOnMouseEnter === true) {
			$('.' + sliderID + '_panel_container', slider).mouseenter(function(){
				mouseEvent = true;
				//console.log("mouseenter detected");
			}).mouseleave(function(){
				//console.log("mouseleave detected");
				mouseEvent = false;
			});		
		};
		
		// Initial Panel Load
		if (settings.crossLinking && location.hash && parseInt(location.hash.slice(1)) <= panelCount) {
			var currentPanel = parseInt(location.hash.slice(1));
		} else if (settings.firstPanelToLoad != 1 && settings.firstPanelToLoad <= panelCount) { 
			var currentPanel = settings.firstPanelToLoad;
		} else { 
			var currentPanel = 1;
		};
		moveToPanel(currentPanel);

		// Left-Nav = click
		$("#magic-nav-left-" + sliderID + " a").click(function(){
			navClicks++;
			var navList = $(this).parents('div.magic-slider-wrapper').find('.magic-nav ul');
			if (currentPanel == 1 && !settings.carousel) {
				alterPanelHeight(panelCount - 1);
				currentPanel = panelCount;
			} else if (currentPanel == 1 && settings.carousel) {
				last = true;
				clon = 'last';
				alterPanelHeight(panelCount - 1);
				currentPanel = panelCount;
			} else {
				currentPanel -= 1;
				alterPanelHeight(currentPanel - 1);
			};
			moveToPanel(currentPanel);
			if (settings.crossLinking) { location.hash = currentPanel }; // Change the URL hash (cross-linking)
			return false;
		});

		// Right-Nav = click
		$('#magic-nav-right-' + sliderID + ' a').click(function(){
			navClicks++;
			var navList = $(this).parents('div.magic-slider-wrapper').find('.magic-nav ul');
			if (currentPanel == panelCount && !settings.carousel) {
				currentPanel = 1;
				alterPanelHeight(0);
			} else if (currentPanel == panelCount && settings.carousel) {
				last = true;
				clon = 'first';
				currentPanel = 1;
				alterPanelHeight(0);
			} else {
				alterPanelHeight(currentPanel);
				currentPanel += 1;
			};
			moveToPanel(currentPanel);
			if (settings.crossLinking) { location.hash = currentPanel }; // Change the URL hash (cross-linking)
			return false;
		});

		// If we need a dynamic menu
		if (settings.dynamicTabs) {
			var dynamicTabs = '<div class="magic-nav" id="magic-nav-' + sliderID + '"><ul></ul></div><div class="clearfix"></div>';
			switch (settings.dynamicTabsPosition) {
				case "bottom":
					slider.parent().append(dynamicTabs);
					break;
				default:
					slider.parent().prepend(dynamicTabs);
					break;
			};
			ul = $('#magic-nav-' + sliderID + ' ul');
			var dynamicListWidth = 0;
			// Create the nav items
			$('.' + sliderID + '_panel', slider).each(function(n) {
				if ( $(this).find(settings.panelTitleSelector).length > 0 && settings.dynamicTabsContent == "title" ) {
					ul.append('<li class="tab' + (n+1) + '"><a href="#' + (n+1) + '">' + $(this).find(settings.panelTitleSelector).text() + '</a></li>');
				} else {
					ul.append('<li class="tab' + (n+1) + '"><a href="#' + (n+1) + '">' + (n+1) + '</a></li>');
				};
				dynamicListWidth = dynamicListWidth + ul.find( 'li.tab' + (n+1) ).width() + 2;
			});
			navContainerWidth = slider.width() + slider.siblings('.magic-nav-left').width() + slider.siblings('.magic-nav-right').width();
			ul.parent().css({ width: navContainerWidth });
			switch (settings.dynamicTabsAlign) {
				case "center":
					ul.css({ width: dynamicListWidth });
					break;
				case "right":
					ul.css({ float: 'right' });
					break;
			};
		};

		// If we need a tabbed nav
		$('#magic-nav-' + sliderID + ' a').each(function(z) {
			// What happens when a nav link is clicked
			$(this).bind("click", function() {
				navClicks++;
				alterPanelHeight(z);
				moveToPanel(z + 1)
				currentPanel = z + 1;
				if (!settings.crossLinking) { return false }; // Don't change the URL hash unless cross-linking is specified
			});
		});

		// External triggers (anywhere on the page)
		$(settings.externalTriggerSelector).each(function() {
			// Make sure this only affects the targeted slider
			if ( sliderID == $(this).attr("rel") ) {
				$(this).bind("click", function() {
					navClicks++;
					targetPanel = parseInt($(this).attr("href").slice(1));
					if ( settings.highlightExternalTrigger == true ) {
						$('a[rel="' + sliderID + '"]').removeClass("current");
						$('a[rel="' + sliderID + '"][href="#' + targetPanel +'"]').addClass("current");
						// $(this).addClass("current");
					};
					offset = - (panelWidth*(targetPanel - 1));
					alterPanelHeight(targetPanel - 1);
					currentPanel = targetPanel;
					// Switch the current tab:
					slider.siblings('.magic-nav').find('a').removeClass('current').parents('ul').find('li:eq(' + (targetPanel - 1) + ') a').addClass('current');
					// Slide
					moveToPanel(currentPanel);
					if (!settings.crossLinking) { return false }; // Don't change the URL hash unless cross-linking is specified
				});
			};
		});

		// Specify which tab is initially set to "current". Depends on if the loaded URL had a hash or not (cross-linking).
		if (settings.crossLinking && location.hash && parseInt(location.hash.slice(1)) <= panelCount) {
			$("#magic-nav-" + sliderID + " a:eq(" + (location.hash.slice(1) - 1) + ")").addClass("current");
			// If there's no cross-linking, check to see if we're supposed to load a panel other than Panel 1 initially...
		} else if (settings.firstPanelToLoad != 1 && settings.firstPanelToLoad <= panelCount) {
			$("#magic-nav-" + sliderID + " a:eq(" + (settings.firstPanelToLoad - 1) + ")").addClass("current");
			// Otherwise we must be loading Panel 1, so make the first tab the current one.
		} else {
			$("#magic-nav-" + sliderID + " a:eq(0)").addClass("current");
		};

		// Set the height of the first panel
		if (settings.autoHeight) {
			panelHeight = $('.' + sliderID + '_panel:eq(' + (currentPanel - 1) + ')', slider).height();
			if (settings.slideDirection == "horizontal"){
				slider.css({ height: panelHeight });
			} else {
				slider.css({ height: panelsHeights[ currentPanel - 1 ] });
			};
		} else {
			slider.css({ height: biggestPanel });
		};

		// Trigger autoSlide
		if (settings.autoSlide) {
			slider.ready(function() {
				setTimeout(autoSlide,settings.autoSlideInterval);
			});
		};

		function alterPanelHeight(x) {
			if (settings.autoHeight) {
				panelHeight = $('.' + sliderID + '_panel:eq(' + x + ')', slider).height()
				slider.animate({ height: panelHeight }, settings.autoHeightEaseDuration, settings.autoHeightEaseFunction);
			};
		};

		function autoSlide() {	
			if (!mouseEvent) {
				if (navClicks == 0 || !settings.autoSlideStopWhenClicked) {
					if (currentPanel == panelCount) {
						if(!settings.autoCycle)
						return false;
						currentPanel = 1;
					} else {
						currentPanel += 1;
					};
					alterPanelHeight(currentPanel - 1);
					moveToPanel(currentPanel);
					setTimeout(autoSlide,settings.autoSlideInterval);
				};
			} else {
				setTimeout(autoSlide,settings.autoSlideInterval);
			};
		};

		function moveToPanel(targetPanelIndex) {
			var navList = $('#magic-nav-' + sliderID + ' ul');
			var currentLink = navList.find('li:eq(' + (targetPanelIndex - 1) + ') a');
			navList.find('a').removeClass('current');
			currentLink.addClass('current');
			if ( last == true ) {
				doTheDouble( clon )
				last = false;
				clon = '';
			} else {
				doThePanelMove(targetPanelIndex);
			};
			if ( settings.changeSliderHeadline == true ){
				$(settings.sliderHeadlineSelector).html( panelHeadlines[ targetPanelIndex - 1 ] );
			};
			if ( settings.highlightExternalTrigger == true ) {
				$('a[rel="' + sliderID + '"]').removeClass("current");
				$('a[rel="' + sliderID + '"][href="#' + targetPanelIndex +'"]').addClass("current"); // $(this).addClass("current");
			};
			slider.find('div.' + sliderID + '_panel_container div.' + sliderID + '_panel').removeClass('current');
			slider.find('div.' + sliderID + '_panel_container div.' + sliderID + '_panel:eq('+ (targetPanelIndex - 1) + ')').addClass('current');
		};

		function doThePanelMove(targetPanelIndex) {
			if (settings.slideDirection == "horizontal"){
				$('.' + sliderID + '_panel_container', slider).animate(
					{ marginLeft: -1 * panelWidth*(targetPanelIndex -1) }, 
					settings.slideEaseDuration, 
					settings.slideEaseFunction
				);
			} else {
				$('.' + sliderID + '_panel_container', slider).animate(
					{ marginTop: -1 * panelContaineroffset[ targetPanelIndex -1 ] }, 
					settings.slideEaseDuration, 
					settings.slideEaseFunction
				);
			}
		};

		function doTheDouble( clon ) {
			if ( clon == 'last' ) {
				slider.find('.' + sliderID + '_panel:last-child').clone().addClass('duplicate').prependTo( slider.children('.' + sliderID + '_panel_container') );
				if (settings.slideDirection == "horizontal") {
					$('.' + sliderID + '_panel_container', slider).css("marginLeft", -panelWidth );
				} else {
					$('.' + sliderID + '_panel_container', slider).css("marginTop", -panelsHeights[ panelCount -1 ] );
				};
			} else {
				slider.find('.' + sliderID + '_panel:first-child').clone().addClass('duplicate').appendTo( slider.children('.' + sliderID + '_panel_container') );
			};
			if (settings.slideDirection == "horizontal"){
				$('.' + sliderID + '_panel_container', slider).animate(
					{ marginLeft: clon == 'last' ? 0 : -( panelWidth * panelCount ) }, 
					settings.slideEaseDuration, 
					settings.slideEaseFunction,
					function() {
						last = false;
						if (clon == 'last') {
							$(this).css( "marginLeft", -(panelWidth*(panelCount-1)) ).find('.' + sliderID + '_panel.duplicate').remove();
						} else {
							$(this).css( "marginLeft", 0 ).find('.' + sliderID + '_panel.duplicate').remove();
						}
					}
				);
			} else {
				$('.' + sliderID + '_panel_container', slider).animate(
					{ marginTop: clon == 'last' ? 0 : -1 * (panelContaineroffset[ panelCount -1 ] + panelsHeights[ panelCount -1 ]) }, 
					settings.slideEaseDuration, 
					settings.slideEaseFunction,
					function() {
						last = false;
						if (clon == 'last') {
							$(this).css( "marginTop", -(panelContaineroffset[ panelCount -1 ]) ).find('.' + sliderID + '_panel.duplicate').remove();
						} else {
							$(this).css( "marginTop", 0 ).find('.' + sliderID + '_panel.duplicate').remove();
						}
					}
				);
			};
		};

		// little Helper to find the biggest Pannel
		function Array_max( array ){
			return Math.max.apply( Math, array );
		};

	});
};
