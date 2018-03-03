// locations
var locations = [{
		name: 'Deccan Spice',
		location: {
			lat: 40.73531240000001,
			lng: -74.06378849999999
		},
	},
	{
		name: 'Biryani Pot',
		location: {
			lat: 40.735841,
			lng: -74.06602399999997
		},
	},
	{
		name: 'Chowpathy',
		location: {
			lat: 40.5737489,
			lng: -74.32484970000002
		},
	},
	{
		name: 'Tandoor Palace',
		location: {
			lat: 40.70909839999999,
			lng: -74.00584379999998
		},
	},
	{
		name: 'Chinatown',
		location: {
			lat: 40.7157509,
			lng: -73.99703069999998
		},
	},
	{
		name: 'Patel Brothers',
		location: {
			lat: 40.7480976,
			lng: -73.89154759999997
		},
	}
];

// this function creates the locations
function Location(data) {
	var self = this;
	self.name = ko.observable(data.name);
	self.location = ko.observable(data.location);
}

// Maps API
var map;

var markers = [];

function googleError() {
	var map = document.getElementById('map');
	map.innerHTML = 'Google maps did not load';
}

function initMap() {

	map = new google.maps.Map(document.getElementById('map'), {
		center: {
			lat: 40.7127753,
			lng: -74.0059728
		},
		zoom: 10,
	});

	var largeInfowindow = new google.maps.InfoWindow();

	// this section creates an array of markers from the locations array on initialize
	var createMarkers = function() {
		// get the position and title from the locations array
		var position = locations[i].location;
		var title = locations[i].name;
		// create a marker per location
		var marker = new google.maps.Marker({
			map: map,
			position: position,
			title: title,
			animation: google.maps.Animation.DROP,
		});
		// Push the marker to array of markers
		markers.push(marker);
		// create onclick event to open infowindow at each marker
		marker.addListener('click', function() {
			populateInfoWindow(this, largeInfowindow);

		});
	};

	for (var i = 0; i < locations.length; i++) {
		createMarkers(locations[i]);
	}

	// This function populates the infowindow when the marker is clicked. We'll only allow
	// one infowindow which will open at the marker that is clicked, and populate based
	// on that markers position.
	function populateInfoWindow(marker, infowindow) {
		// Check to make sure the infowindow is not already opened on this marker.
		if (infowindow.marker != marker) {

			infowindow.marker = marker;

			// FourSquare Ajax
			// URL for foursquare
			var fourSquareURL = 'https://api.foursquare.com/v2/venues/search?ll=' + marker.position.lat() + ',' + marker.position.lng() + '&query=' + marker.title + '&client_id=SS2TRLPAC41IELJPZUGXUYANVRWY3ULRKYF3YKWH4MCR4D0Q&client_secret=04WUI02PCQ4ATGUUGPFSPC5MBQ4BZC230SM0PWJZUDYPXP0K&v=20170628';

			var fourSquareRequestTimeOut = setTimeout(function() {
				infowindow.setContent('<div>' + marker.title + '</div>' + '<div>Failed to get a response from FourSquare</div>');
				toggleBounce(marker);
				infowindow.open(map, marker);
			}, 4000);

			$.ajax({
				url: fourSquareURL,
				dataType: 'jsonp',
				success: function(response) {
					var firstResult = response.response.venues[0] || "";

					var phoneNumber = firstResult.contact.formattedPhone;
					if (phoneNumber === undefined) {
						phoneNumber = "Not available on FourSquare";
					}

					var url = firstResult.url;
					if (url === undefined) {
						url = "Not available on FourSquare";
					}

					infowindow.setContent('<div>' + marker.title + '</div>' + '<div>Contact details from FourSquare:</div>' + '<div>Phone: ' + phoneNumber + '</div>' + '<div>Website: ' + '<a href="' + url + '">' + url + '</a>' + '</div>');

					toggleBounce(marker);
					infowindow.open(map, marker);

					clearTimeout(fourSquareRequestTimeOut);
				}
			});

			// Makes sure the marker property is cleared if the infowindow is closed.
			infowindow.addListener('closeclick', function() {
				infowindow.marker = null;
				marker.setAnimation(null);
			});
		}
	}

	// This function makes the markers bounce once only
	function toggleBounce(marker) {
		if (marker.getAnimation() !== null) {
			marker.setAnimation(null);
		} else {
			marker.setAnimation(google.maps.Animation.BOUNCE);
			// timeout on bounce so marker bounces only once on click
			setTimeout(function() {
				marker.setAnimation(null);
			}, 700);
		}
	}
}

// View Model
var ViewModel = function() {

	var self = this;

	// creates an array for storing locations
	self.locationList = ko.observableArray([]);
	self.query = ko.observable('');

	// pushes each location into locationList array
	locations.forEach(function(item) {
		self.locationList.push(new Location(item));
	});

	// sets the current location onclick
	self.currentLocation = ko.observable(self.locationList()[0]);

	self.setLocation = function(clickedLocation) {
		self.currentLocation(clickedLocation);
		console.log(clickedLocation.name());
		for (var i = 0; i < markers.length; i++) {
			if (clickedLocation.name() == markers[i].title) {
				google.maps.event.trigger(markers[i], 'click');
			}
		}
		self.closeSideNavi();
	};


	// Filters which locations and markers are displayed from input box
	self.searchResults = ko.computed(function() {
		var filter = self.query().toLowerCase();

		// Filter markers
		for (var i = 0; i < self.locationList().length; i++) {
			if (self.locationList()[i].name().toLowerCase().indexOf(filter) > -1) {
				for (var j = 0; j < markers.length; j++) {
					if (self.locationList()[i].name() == markers[j].title) {
						markers[j].setVisible(true);
					}
				}
			} else {
				for (var k = 0; k < markers.length; k++) {
					if (self.locationList()[i].name() == markers[k].title) {
						markers[k].setVisible(false);
					}
				}
			}
		}

		// Filter list
		if (!filter) {
			return self.locationList();
		} else {
			return ko.utils.arrayFilter(self.locationList(), function(item) {
				return item.name().toLowerCase().indexOf(filter) > -1;
			});
		}
	});

	// Open and close the sidebar navigation lists
	self.openNav = ko.observable(false);
	self.closeNav = ko.observable(true);

	self.openSideNavi = function() {
		self.openNav(true);
		self.closeNav(false);
	};

	self.closeSideNavi = function() {
		self.openNav(false);
		self.closeNav(true);
	};
};

ko.applyBindings(new ViewModel());
