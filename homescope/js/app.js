(function () {
  'use strict';

  // --- Config ---
  var TAMPA_CENTER = [-82.4572, 27.9506];
  var DEFAULT_ZOOM = 11;

  // API endpoints
  var API = {
    census: 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress',
    fema: 'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query',
    elevation: 'https://epqs.nationalmap.gov/v1/json',
    flEvac: 'https://services1.arcgis.com/F7pCAceKNJSgob3a/arcgis/rest/services/Evacuation_Zones/FeatureServer/0/query',
    femaTiles: 'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/export'
  };

  // Flood zone risk classification
  var FLOOD_RISK = {
    'V': { level: 'high', label: 'High Risk (Coastal)', insurance: '$2,500 - $10,000+/yr' },
    'VE': { level: 'high', label: 'High Risk (Coastal w/ BFE)', insurance: '$2,500 - $10,000+/yr' },
    'A': { level: 'high', label: 'High Risk', insurance: '$1,500 - $6,000/yr' },
    'AE': { level: 'high', label: 'High Risk (w/ BFE)', insurance: '$1,200 - $5,000/yr' },
    'AH': { level: 'high', label: 'High Risk (Shallow Flood)', insurance: '$1,200 - $5,000/yr' },
    'AO': { level: 'high', label: 'High Risk (Sheet Flow)', insurance: '$1,200 - $5,000/yr' },
    'AR': { level: 'medium', label: 'Moderate (Levee)', insurance: '$800 - $3,000/yr' },
    'A99': { level: 'medium', label: 'Moderate (Levee Progress)', insurance: '$800 - $3,000/yr' },
    'B': { level: 'low', label: 'Moderate to Low', insurance: '$400 - $1,200/yr' },
    'C': { level: 'low', label: 'Low Risk', insurance: 'Optional, ~$400 - $800/yr' },
    'X': { level: 'low', label: 'Minimal Risk', insurance: 'Optional, ~$400 - $800/yr' },
    'D': { level: 'medium', label: 'Undetermined', insurance: 'Varies' }
  };

  // Evacuation zone descriptions
  var EVAC_INFO = {
    'A': { label: 'Zone A', desc: 'Evacuate for Category 1+', level: 'high' },
    'B': { label: 'Zone B', desc: 'Evacuate for Category 2+', level: 'high' },
    'C': { label: 'Zone C', desc: 'Evacuate for Category 3+', level: 'medium' },
    'D': { label: 'Zone D', desc: 'Evacuate for Category 4+', level: 'medium' },
    'E': { label: 'Zone E', desc: 'Evacuate for Category 5', level: 'low' },
    'N': { label: 'Non-Evac', desc: 'Not in evacuation zone', level: 'low' }
  };

  // --- State ---
  var map;
  var marker;
  var currentCoords = null;
  var activeLayers = { flood: true, evac: false, surge: false };

  // --- DOM refs ---
  var addressInput = document.getElementById('address-input');
  var searchBtn = document.getElementById('search-btn');
  var searchResults = document.getElementById('search-results');
  var panel = document.getElementById('panel');
  var panelClose = document.getElementById('panel-close');
  var panelAddress = document.getElementById('panel-address');
  var panelSummary = document.getElementById('panel-summary');
  var panelDetails = document.getElementById('panel-details');
  var panelLoading = document.getElementById('panel-loading');
  var legend = document.getElementById('legend');
  var legendTitle = document.getElementById('legend-title');
  var legendItems = document.getElementById('legend-items');

  // --- Init map ---
  function initMap() {
    map = new maplibregl.Map({
      container: 'map',
      style: 'https://tiles.openfreemap.org/styles/dark',
      center: TAMPA_CENTER,
      zoom: DEFAULT_ZOOM,
      maxBounds: [[-83.5, 27.0], [-81.5, 28.8]]
    });

    map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

    // Add FEMA flood zone tiles as image overlay
    map.on('load', function () {
      addFemaFloodLayer();
      updateLegend();
    });

    // Click to query
    map.on('click', function (e) {
      var lng = e.lngLat.lng;
      var lat = e.lngLat.lat;
      queryLocation(lat, lng, null);
    });
  }

  // --- FEMA flood zone tile layer ---
  function addFemaFloodLayer() {
    map.addSource('fema-flood', {
      type: 'raster',
      tiles: [
        'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png32&transparent=true&layers=show:28&f=image'
      ],
      tileSize: 256
    });

    map.addLayer({
      id: 'fema-flood-layer',
      type: 'raster',
      source: 'fema-flood',
      paint: { 'raster-opacity': 0.5 }
    });
  }

  // --- Layer toggles ---
  document.querySelectorAll('.layer-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var layer = btn.dataset.layer;
      activeLayers[layer] = !activeLayers[layer];
      btn.classList.toggle('active');

      if (layer === 'flood') {
        if (map.getLayer('fema-flood-layer')) {
          map.setLayoutProperty('fema-flood-layer', 'visibility',
            activeLayers.flood ? 'visible' : 'none');
        }
      }

      updateLegend();
    });
  });

  // --- Legend ---
  function updateLegend() {
    if (!activeLayers.flood && !activeLayers.evac && !activeLayers.surge) {
      legend.classList.add('hidden');
      return;
    }

    legend.classList.remove('hidden');

    if (activeLayers.flood) {
      legendTitle.textContent = 'FEMA Flood Zones';
      legendItems.innerHTML =
        '<div class="legend-item"><div class="legend-swatch" style="background: rgba(0, 50, 200, 0.5)"></div>V/VE - Coastal High Risk</div>' +
        '<div class="legend-item"><div class="legend-swatch" style="background: rgba(0, 120, 200, 0.5)"></div>A/AE - High Risk</div>' +
        '<div class="legend-item"><div class="legend-swatch" style="background: rgba(255, 165, 0, 0.4)"></div>Moderate Risk</div>' +
        '<div class="legend-item"><div class="legend-swatch" style="background: rgba(200, 200, 200, 0.2)"></div>X - Minimal Risk</div>';
    } else if (activeLayers.evac) {
      legendTitle.textContent = 'Evacuation Zones';
      legendItems.innerHTML =
        '<div class="legend-item"><div class="legend-swatch" style="background: #ff4444"></div>Zone A - Cat 1+</div>' +
        '<div class="legend-item"><div class="legend-swatch" style="background: #ff8844"></div>Zone B - Cat 2+</div>' +
        '<div class="legend-item"><div class="legend-swatch" style="background: #ffcc44"></div>Zone C - Cat 3+</div>' +
        '<div class="legend-item"><div class="legend-swatch" style="background: #88cc44"></div>Zone D - Cat 4+</div>' +
        '<div class="legend-item"><div class="legend-swatch" style="background: #44aa44"></div>Zone E - Cat 5</div>';
    }
  }

  // --- Search / Geocode ---
  searchBtn.addEventListener('click', doSearch);
  addressInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      doSearch();
    }
  });

  function doSearch() {
    var addr = addressInput.value.trim();
    if (!addr) { return; }
    searchResults.classList.add('hidden');
    geocodeAddress(addr);
  }

  function geocodeAddress(address) {
    var url = API.census +
      '?address=' + encodeURIComponent(address) +
      '&benchmark=Public_AR_Current&format=json';

    showLoading();

    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var matches = data.result && data.result.addressMatches;
        if (!matches || matches.length === 0) {
          hideLoading();
          panelAddress.textContent = 'Address not found. Try a different search.';
          panel.classList.remove('hidden');
          return;
        }

        if (matches.length === 1) {
          selectAddress(matches[0]);
        } else {
          showAddressResults(matches);
          hideLoading();
        }
      })
      .catch(function (err) {
        console.error('Geocode error:', err);
        hideLoading();
        panelAddress.textContent = 'Error looking up address. Please try again.';
        panel.classList.remove('hidden');
      });
  }

  function showAddressResults(matches) {
    searchResults.innerHTML = '';
    matches.forEach(function (m) {
      var div = document.createElement('div');
      div.className = 'search-result-item';
      div.innerHTML =
        '<div class="match-addr">' + m.matchedAddress + '</div>';
      div.addEventListener('click', function () {
        searchResults.classList.add('hidden');
        addressInput.value = m.matchedAddress;
        selectAddress(m);
      });
      searchResults.appendChild(div);
    });
    searchResults.classList.remove('hidden');
  }

  function selectAddress(match) {
    var lng = match.coordinates.x;
    var lat = match.coordinates.y;
    var addr = match.matchedAddress;

    addressInput.value = addr;
    searchResults.classList.add('hidden');

    queryLocation(lat, lng, addr);
  }

  // --- Query location for all data ---
  function queryLocation(lat, lng, address) {
    currentCoords = [lng, lat];

    // Move map
    map.flyTo({ center: [lng, lat], zoom: 15, duration: 1200 });

    // Place marker
    if (marker) { marker.remove(); }
    var el = document.createElement('div');
    el.className = 'map-marker';
    marker = new maplibregl.Marker({ element: el })
      .setLngLat([lng, lat])
      .addTo(map);

    // Show panel
    panelAddress.textContent = address || (lat.toFixed(5) + ', ' + lng.toFixed(5));
    panel.classList.remove('hidden');
    showLoading();

    // Query all data sources in parallel
    Promise.all([
      queryFloodZone(lat, lng),
      queryElevation(lat, lng),
      queryEvacZone(lat, lng)
    ]).then(function (results) {
      var flood = results[0];
      var elevation = results[1];
      var evac = results[2];

      renderResults(flood, elevation, evac);
      hideLoading();
    }).catch(function (err) {
      console.error('Query error:', err);
      hideLoading();
      panelAddress.textContent += ' (some data unavailable)';
    });
  }

  // --- FEMA Flood Zone query ---
  function queryFloodZone(lat, lng) {
    var url = API.fema +
      '?where=1%3D1' +
      '&geometry=' + lng + '%2C' + lat +
      '&geometryType=esriGeometryPoint' +
      '&spatialRel=esriSpatialRelIntersects' +
      '&outFields=FLD_ZONE%2CZONE_SUBTY%2CSFHA_TF%2CSTATIC_BFE' +
      '&returnGeometry=false' +
      '&f=json';

    return fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.features && data.features.length > 0) {
          return data.features[0].attributes;
        }
        return null;
      })
      .catch(function () { return null; });
  }

  // --- USGS Elevation query ---
  function queryElevation(lat, lng) {
    var url = API.elevation +
      '?x=' + lng + '&y=' + lat +
      '&wkid=4326&units=Feet&includeDate=false';

    return fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.value !== undefined) {
          return { feet: data.value, meters: data.value * 0.3048 };
        }
        return null;
      })
      .catch(function () { return null; });
  }

  // --- FL Evacuation Zone query ---
  function queryEvacZone(lat, lng) {
    var url = API.flEvac +
      '?where=1%3D1' +
      '&geometry=' + lng + '%2C' + lat +
      '&geometryType=esriGeometryPoint' +
      '&inSR=4326' +
      '&spatialRel=esriSpatialRelIntersects' +
      '&outFields=*' +
      '&returnGeometry=false' +
      '&f=json';

    return fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.features && data.features.length > 0) {
          return data.features[0].attributes;
        }
        return null;
      })
      .catch(function () { return null; });
  }

  // --- Render results ---
  function renderResults(flood, elevation, evac) {
    panelSummary.classList.remove('hidden');
    panelDetails.classList.remove('hidden');

    renderFloodSummary(flood);
    renderElevationSummary(elevation);
    renderEvacSummary(evac);
    renderFloodDetails(flood);
    renderElevationDetails(elevation);
    renderHurricaneDetails(evac);
  }

  function renderFloodSummary(flood) {
    var valEl = document.getElementById('val-flood');
    var cardEl = document.getElementById('card-flood');

    if (!flood || !flood.FLD_ZONE) {
      valEl.textContent = 'N/A';
      valEl.className = 'summary-value';
      return;
    }

    var zone = flood.FLD_ZONE;
    var info = FLOOD_RISK[zone] || { level: 'medium', label: 'Unknown' };

    valEl.textContent = zone;
    valEl.className = 'summary-value risk-' + info.level;
  }

  function renderElevationSummary(elevation) {
    var valEl = document.getElementById('val-elevation');

    if (!elevation) {
      valEl.textContent = 'N/A';
      return;
    }

    var ft = Math.round(elevation.feet);
    valEl.textContent = ft + ' ft';

    if (ft < 6) {
      valEl.className = 'summary-value risk-high';
    } else if (ft < 15) {
      valEl.className = 'summary-value risk-medium';
    } else {
      valEl.className = 'summary-value risk-low';
    }
  }

  function renderEvacSummary(evac) {
    var valEl = document.getElementById('val-evac');

    if (!evac) {
      valEl.textContent = 'N/A';
      valEl.className = 'summary-value';
      return;
    }

    // Try common field names for evac zone
    var zone = evac.EVAC_ZONE || evac.Zone || evac.ZONE || evac.EvacZone || evac.evaczone || null;

    // If we can't find it, show first string attribute
    if (!zone) {
      for (var key in evac) {
        if (evac.hasOwnProperty(key) && typeof evac[key] === 'string' && evac[key].length <= 2) {
          zone = evac[key];
          break;
        }
      }
    }

    if (!zone) {
      valEl.textContent = 'N/A';
      valEl.className = 'summary-value';
      return;
    }

    var info = EVAC_INFO[zone.toUpperCase()] || { label: 'Zone ' + zone, level: 'medium' };
    valEl.textContent = info.label;
    valEl.className = 'summary-value risk-' + info.level;
  }

  function renderFloodDetails(flood) {
    var container = document.getElementById('flood-details');

    if (!flood || !flood.FLD_ZONE) {
      container.innerHTML = '<div class="detail-item full-width"><div class="d-label">Status</div><div class="d-value">No FEMA flood data available for this location</div></div>';
      return;
    }

    var zone = flood.FLD_ZONE;
    var info = FLOOD_RISK[zone] || { level: 'medium', label: 'Unknown', insurance: 'Unknown' };
    var sfha = flood.SFHA_TF === 'T' ? 'Yes - flood insurance required with mortgage' : 'No';

    var html =
      '<div class="detail-item"><div class="d-label">Zone</div><div class="d-value risk-' + info.level + '">' + zone + '</div></div>' +
      '<div class="detail-item"><div class="d-label">Risk Level</div><div class="d-value">' + info.label + '</div></div>' +
      '<div class="detail-item"><div class="d-label">Est. Insurance</div><div class="d-value">' + info.insurance + '</div></div>' +
      '<div class="detail-item"><div class="d-label">SFHA</div><div class="d-value">' + sfha + '</div></div>';

    if (flood.ZONE_SUBTY) {
      html += '<div class="detail-item full-width"><div class="d-label">Zone Subtype</div><div class="d-value">' + flood.ZONE_SUBTY + '</div></div>';
    }

    if (flood.STATIC_BFE && flood.STATIC_BFE > 0) {
      html += '<div class="detail-item"><div class="d-label">Base Flood Elevation</div><div class="d-value">' + flood.STATIC_BFE + ' ft</div></div>';
    }

    container.innerHTML = html;
  }

  function renderElevationDetails(elevation) {
    var container = document.getElementById('elevation-details');

    if (!elevation) {
      container.innerHTML = '<div class="detail-item full-width"><div class="d-label">Status</div><div class="d-value">Elevation data unavailable</div></div>';
      return;
    }

    var ft = elevation.feet;
    var m = elevation.meters;
    var riskNote = '';

    if (ft < 3) {
      riskNote = 'Very low elevation. Highly vulnerable to storm surge and sea level rise.';
    } else if (ft < 6) {
      riskNote = 'Low elevation. Vulnerable to moderate storm surge (Cat 2+).';
    } else if (ft < 15) {
      riskNote = 'Moderate elevation. Some storm surge risk in major hurricanes.';
    } else {
      riskNote = 'Above typical storm surge levels for most hurricane scenarios.';
    }

    container.innerHTML =
      '<div class="detail-item"><div class="d-label">Feet NAVD88</div><div class="d-value">' + ft.toFixed(1) + ' ft</div></div>' +
      '<div class="detail-item"><div class="d-label">Meters</div><div class="d-value">' + m.toFixed(1) + ' m</div></div>' +
      '<div class="detail-item full-width"><div class="d-label">Assessment</div><div class="d-value">' + riskNote + '</div></div>';
  }

  function renderHurricaneDetails(evac) {
    var container = document.getElementById('hurricane-details');

    if (!evac) {
      container.innerHTML = '<div class="detail-item full-width"><div class="d-label">Status</div><div class="d-value">Evacuation zone data unavailable for this location</div></div>';
      return;
    }

    var zone = evac.EVAC_ZONE || evac.Zone || evac.ZONE || evac.EvacZone || evac.evaczone || null;

    if (!zone) {
      // Show raw attributes for debugging
      var attrs = [];
      for (var key in evac) {
        if (evac.hasOwnProperty(key)) {
          attrs.push(key + ': ' + evac[key]);
        }
      }
      container.innerHTML = '<div class="detail-item full-width"><div class="d-label">Raw Data</div><div class="d-value" style="font-size: 0.75rem; word-break: break-all;">' + attrs.join(', ') + '</div></div>';
      return;
    }

    var info = EVAC_INFO[zone.toUpperCase()] || { label: 'Zone ' + zone, desc: 'Unknown', level: 'medium' };

    var surgeEstimates = {
      'A': '3-6 ft storm surge possible (Category 1)',
      'B': '6-10 ft storm surge possible (Category 2)',
      'C': '10-15 ft storm surge possible (Category 3)',
      'D': '15-20 ft storm surge possible (Category 4)',
      'E': '20+ ft storm surge possible (Category 5)',
      'N': 'Outside primary storm surge zones'
    };

    var surgeText = surgeEstimates[zone.toUpperCase()] || 'Surge estimate unavailable';

    container.innerHTML =
      '<div class="detail-item"><div class="d-label">Evac Zone</div><div class="d-value risk-' + info.level + '">' + info.label + '</div></div>' +
      '<div class="detail-item"><div class="d-label">Evacuate When</div><div class="d-value">' + info.desc + '</div></div>' +
      '<div class="detail-item full-width"><div class="d-label">Storm Surge Estimate</div><div class="d-value">' + surgeText + '</div></div>';
  }

  // --- Insurance estimate ---
  function renderInsuranceSummary(flood) {
    var valEl = document.getElementById('val-insurance');

    if (!flood || !flood.FLD_ZONE) {
      valEl.textContent = 'N/A';
      valEl.className = 'summary-value';
      return;
    }

    var info = FLOOD_RISK[flood.FLD_ZONE] || {};
    if (info.insurance) {
      valEl.textContent = info.insurance.split('/')[0]; // Just the price range
      valEl.className = 'summary-value risk-' + (info.level || 'medium');
    } else {
      valEl.textContent = 'N/A';
    }
  }

  // --- Render results (updated) ---
  var _origRender = renderResults;
  renderResults = function (flood, elevation, evac) {
    _origRender(flood, elevation, evac);
    renderInsuranceSummary(flood);
  };

  // --- UI helpers ---
  function showLoading() {
    panelLoading.classList.remove('hidden');
    panelSummary.classList.add('hidden');
    panelDetails.classList.add('hidden');
  }

  function hideLoading() {
    panelLoading.classList.add('hidden');
  }

  panelClose.addEventListener('click', function () {
    panel.classList.add('hidden');
  });

  // Close search results on click outside
  document.addEventListener('click', function (e) {
    if (!searchResults.contains(e.target) && e.target !== addressInput) {
      searchResults.classList.add('hidden');
    }
  });

  // --- Boot ---
  initMap();

})();
