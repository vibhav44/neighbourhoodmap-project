//global variables
var myUserMap; //it will be used for map
var usrInfoBox; //it will store the InfoWindow
var mapPinArray = []; //it will store the markers

//default coordinates for Bangalore which is our default location
var currLatitude = 12.9716;
var currLongitude = 77.5946;

//this function updates location of user according to city entered
function setResetMap() {
    var geocoder = new google.maps.Geocoder();
    var userCity = ViewModel.userCityName();
    geocoder.geocode({ 'address': userCity }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            currLatitude = results[0].geometry.location.lat();
            currLongitude = results[0].geometry.location.lng();
            initMap();
        } else {
            ViewModel.error('Geocode not working');
            ViewModel.apiError();
        }
    });
}

//this function loads the map and request for data as per user's demand
function initMap() {
    myUserMap = new google.maps.Map(document.getElementById('vibhavMap'), {
        center: {
            lat: currLatitude,
            lng: currLongitude
        },
        fullscreenControl: true,
    });
    usrInfoBox = new google.maps.InfoWindow();
    foursquareDataFetch(ViewModel.locationCategory(), ViewModel.placeQuantity());
}

//this function fetches data from the foursquare api
function foursquareDataFetch(query, placeQuantity) {
    mapPinArray = [];
    $.ajax({
        url: 'https://api.foursquare.com/v2/venues/search',
        dataType: 'json',
        data: 'client_id=HSZER2RNSPFUBXY1GI1YZW1453VNY25HUT3K1HBCQ4TTEGBI&client_secret=XYTD5PFMD2P21OROTP0ZYW45BVTQZEYRQ2BO1GD2TWX10FDD&v=20130815%20&ll=+' + currLatitude + ',' + currLongitude + '&radius=12500&limit=' + placeQuantity + '&query=' + query,
        async: true
    }).done(function(response) {
        var fsqDataArray = response.response.venues;
        var updateRangeView = new google.maps.LatLngBounds();
        console.log(fsqDataArray);
        for (var no = 0; no < fsqDataArray.length; no++) {
            var latLng = new google.maps.LatLng(parseFloat(fsqDataArray[no].location.lat), parseFloat(fsqDataArray[no].location.lng));

            var tempPhone, tempState, tempZip;

            if (fsqDataArray[no].contact.phone === null || !fsqDataArray[no].contact.phone) {
                tempPhone = 'not available';
            } else {
                tempPhone = fsqDataArray[no].contact.phone;
            }

            if (fsqDataArray[no].location.postalCode === null || !fsqDataArray[no].location.postalCode) {
                tempZip = 'not available';
            } else {
                tempZip = fsqDataArray[no].location.postalCode;
            }

            if (fsqDataArray[no].location.country === null || !fsqDataArray[no].location.country) {
                tempState = 'not available';
            } else {
                tempState = fsqDataArray[no].location.country;
            }

            var marker = new google.maps.Marker({
                position: latLng,
                title: fsqDataArray[no].name,
                animation: google.maps.Animation.DROP,
                map: myUserMap,
                phoneNo: tempPhone,
                state: tempState,
                zipCode: tempZip,
                icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
            });
            updateRangeView.extend(marker.position);

           marker.addListener('click', function() {
                  var markerPhone, markerState, markerZip;
                  this.phoneNo ? markerPhone = this.phoneNo : markerPhone = 'not available';
                  this.state ?  markerState = this.state : markerState = 'not available';
                  this.zipCode ? markerZip = this.zipCode : markerZip = 'not available';
                  alert(this.title + "\n" + "Contact no : " + markerPhone + "\nCountry : " + markerState + "\nZip code : " + markerZip);
            });

            mapPinArray.push(marker);
        }

        google.maps.event.addDomListener(window, 'resize', function() {
            myUserMap.fitBounds(updateRangeView); // `bounds` is a `LatLngBounds` object
        });
        myUserMap.fitBounds(updateRangeView);
        ViewModel.refreshDisplayList();

    }).fail(function(response, status, error) {
        ViewModel.error('Cant fetch result from api');
        ViewModel.apiError();
    });
}

//this function displays the data fetched in InfoWindow with respective marker/pin
function displayMarkerInfo(marker, usrInfoBox) {
    for (var i = 0; i < mapPinArray.length; i++) {
        changeIconMarker(mapPinArray[i]);
    }
    usrInfoBox.marker = marker;
    usrInfoBox.marker.setAnimation(google.maps.Animation.BOUNCE);

    setTimeout(function() {
        marker.setAnimation(null);
    }, 1500);

    marker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');
    //alert(this.title);
    usrInfoBox.setContent("<h1>" + marker.title + "</h1>" + "<b>Contact no : </b>" + marker.phoneNo + "<br><b>Country : </b>" + marker.state + "<br><b>Zip code : </b>" + marker.zipCode);

    usrInfoBox.open(myUserMap, marker);
    usrInfoBox.addListener('closeclick', function() {
        marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
    });
}

//this function is called when map is not loaded due to some issue
function mapError() {
    var ans = confirm("map api problem\nDo you want to reload the webpage ?");
    if (ans) {
        window.location.reload();
    }
}

//this function activates InfoWindow of location clicked in list displayed
function pinTrigger(PinName) {
    for (var n = 0; n < mapPinArray.length; n++) {
        if (mapPinArray[n].title == PinName) {
            displayMarkerInfo(mapPinArray[n], usrInfoBox);
        } else {
            changeIconMarker(mapPinArray[n]);
        }
    }
}

//this function changes icon of called marker
function changeIconMarker(myMarker) {
    myMarker.setIcon("http://maps.google.com/mapfiles/ms/icons/red-dot.png");
}

//ViewModel is defined here
var ViewModel = {
    userCityName: ko.observable('Bangalore'),
    locationCategory: ko.observable('Mall'),
    placeQuantity: ko.observable('5'),
    displayListArray: ko.observableArray(),
    inputKeyword: ko.observable(''),
    error: ko.observable(''),

    //this function updates the displayed list as per marker's list
    refreshDisplayList: function() {
        ViewModel.displayListArray.removeAll();
        for (var i = 0; i < mapPinArray.length; i++) {
            ViewModel.displayListArray.push(mapPinArray[i].title);
        }
    },

    //this function updates the marker and the text list as per keyword given by user
    updateSearchList: function(searchWord) {
        ViewModel.displayListArray.removeAll();
        for (var num = 0; num < mapPinArray.length; num++) {
            if (mapPinArray[num].title.toLowerCase().indexOf(searchWord.toLowerCase()) > -1) {
                mapPinArray[num].setVisible(true);
                ViewModel.displayListArray.push(mapPinArray[num].title);
            } else {
                mapPinArray[num].setVisible(false);
            }
        }
    },

    apiError: function() {
        var reply = confirm(ViewModel.error() + "\nPlease reload the webpage");
        if (reply) {
            window.location.reload();
        }
    }

};
ko.applyBindings(ViewModel);
ViewModel.inputKeyword.subscribe(ViewModel.updateSearchList);
