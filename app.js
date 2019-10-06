const markers = [];
const filters = {spanish:false, filipino:false, italian: false}
let custom_marker;
let directionsService;
let directionsRenderer;

function checkFilters() {
  let spanish = document.getElementById('spanish');
  let filipino = document.getElementById('filipino');
  let italian = document.getElementById('italian');
  filters.spanish = spanish.checked;
  filters.filipino = filipino.checked;
  filters.italian = italian.checked;
  updateMap();
}

function removeCustomMarkers() {
  custom_marker.setMap(null);
  custom_marker = null;
}

function countMarkers(circle) {
  let mCount = 0;
  for (let i = 0; i < markers.length; i++){
    if(circle.getBounds().contains(markers[i].getPosition()))
      mCount++
  }
  $("#mCount").text(mCount);
} 

function updateMap() {
  let reset = false;
  if(!filters.spanish && !filters.filipino && !filters.italian) {
    reset = true;
  }

  for (let i = 0; i < markers.length; i++) {
    let marker = markers[i];
    let keep = true;

    if (!reset){
      switch (marker.properties.category) {
        case 'Spanish' :
          if (filters.spanish)
            keep = true;
          else 
            keep = false;
          break;
        case 'Filipino' :
          if (filters.filipino)
            keep = true;
          else 
            keep = false;
          break;
        case 'Italian':
          if (filters.italian)
            keep = true;
          else 
            keep = false;
          break;
      }
    }
    marker.setVisible(keep);
  }
}

function sanitizeHTML(strings) {
  const entities = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };
  let result = strings[0];
  for (let i = 1; i < arguments.length; i++) {
    result += String(arguments[i]).replace(/[&<>'"]/g, char => {
      return entities[char];
    });
    result += strings[i];
  }
  return result;
}

function placeMarker(location, map) {
  if (custom_marker) {
    custom_marker.setVisible(false);
  }

  custom_marker = new google.maps.Marker({
      position: location, 
      map: map
  });
}

function getDirections (lat, lng) {
  if (custom_marker) {
    const latlng = new google.maps.LatLng(
      parseFloat(lat),
      parseFloat(lng),
    );

    directionsService.route({
      origin: latlng,
      destination: custom_marker.position,
      travelMode: 'DRIVING'
    }, (res,status) => {
      if (status === 'OK')
        directionsRenderer.setDirections(res);
      else
        alert("Error " + status);
    });
  }else {
    navigator.geolocation.getCurrentPosition((position) => {
      const origin = new google.maps.LatLng(
        parseFloat(position.coords.latitude),
        parseFloat(position.coords.longitude),
      );

      const dest = new google.maps.LatLng(
        parseFloat(lat),
        parseFloat(lng),
      );

      directionsService.route({
        origin: origin,
        destination: dest,
        travelMode: 'DRIVING'
      }, (res,status) => {
        if (status === 'OK')
          directionsRenderer.setDirections(res);
        else
          alert("Error " + status);
      });
    });
  }
}

function initMap() {
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  const infoWindow = new google.maps.InfoWindow();
  const map = new google.maps.Map(document.getElementsByClassName("map")[0], {
    zoom: 15,
    center: { lat: 10.3157, lng: 123.8854 },
  });

  directionsRenderer.setMap(map);
  infoWindow.setOptions({ pixelOffset: new google.maps.Size(0, -30) });

  const drawingManager = new google.maps.drawing.DrawingManager({
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: ['circle']
    },
    circleOptions: {
      fillColor: '#70DBDB',
      fillOpacity: 0.5,
      strokeWeight: 5,
      strokeColor: '#70DBDB',
      clickable: false,
      editable: true,
      zIndex: 1
    }
  });
  drawingManager.setMap(map);

  $.getJSON("stores.json", res => {
    const data = res['features'];

    $.each(data, (key, val) => {
      const point = new google.maps.LatLng(
        parseFloat(val['geometry']['coordinates'][0]),
        parseFloat(val['geometry']['coordinates'][1]),
      );

      const title = val['properties']['name']
      const marker = new google.maps.Marker({
        position: point,
        title: title,
        map: map,
        properties: val['properties']
       });

      marker.addListener('click', () => {
          const category = val.properties.category;
          const img = val.properties.img;
          const name = val.properties.name;
          const description = val.properties.description;
          const specialty = val.properties.specialty;
          const hours = val.properties.hours;
          const phone = val.properties.phone;
          const lat = val['geometry']['coordinates'][0];
          const lng = val['geometry']['coordinates'][1];
          const content = sanitizeHTML`
            <img style="float:left; width:200px; margin-top:30px" src="assets/${img}.jpg">
            <div style="margin-left:220px; margin-bottom:20px;">
              <h1>${name}</h1>
              <p>${description}</p>
              <p>
                <b>Category: </b> ${category}<br/>
                <b>Specialty: </b> ${specialty}</br>
                <b>Open:</b> ${hours}<br/>
                <b>Phone:</b> ${phone}
              </p>
              <button onClick="getDirections(${lat}, ${lng})">Get directions to here</button>
              </div>
          `;

          infoWindow.setContent(content);
          infoWindow.setPosition(point);
          infoWindow.open(map);
      });

      markers.push(marker);
    });
  });

  google.maps.event.addListener(map, 'click', (evt) => {
    placeMarker(evt.latLng, map);
  });

  google.maps.event.addListener(drawingManager, 'circlecomplete', function(circle) {
    countMarkers(circle);
  });
}
