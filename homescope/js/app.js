(function () {
  'use strict';

  // --- Config ---
  var TAMPA_CENTER = [-82.6367, 27.7676]; // Center between Tampa and St. Pete
  var DEFAULT_ZOOM = 10;
  var MIN_LAYER_ZOOM = 10;

  // API endpoints
  var API = {
    nominatim: 'https://nominatim.openstreetmap.org/search',
    fema: 'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query',
    elevation: 'https://epqs.nationalmap.gov/v1/json',
    flEvac: 'https://services1.arcgis.com/F7pCAceKNJSgob3a/arcgis/rest/services/Evacuation_Zones/FeatureServer/0/query',
    femaTiles: 'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/export',
    fccArea: 'https://geo.fcc.gov/api/census/area',
    censusAcs: 'https://api.census.gov/data/2022/acs/acs5',
    hudBuildings: 'https://services.arcgis.com/VTyQ9soqVukalItT/ArcGIS/rest/services/Public_Housing_Buildings/FeatureServer/0/query',
    hudMultifamily: 'https://services.arcgis.com/VTyQ9soqVukalItT/ArcGIS/rest/services/MULTIFAMILY_PROPERTIES_ASSISTED/FeatureServer/0/query',
    hudLihtc: 'https://services.arcgis.com/VTyQ9soqVukalItT/ArcGIS/rest/services/LIHTC/FeatureServer/0/query',
    overpass: 'https://overpass-api.de/api/interpreter'
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

  // Evac zone colors
  var EVAC_COLORS = {
    'A': '#ff4444',
    'B': '#ff8844',
    'C': '#ffcc44',
    'D': '#88cc44',
    'E': '#44aa44'
  };

  // --- State ---
  var map;
  var marker;
  var currentCoords = null;
  var layerPanelOpen = true;

  // Layer state: active flag, loading flag, cached bbox key
  var layers = {
    flood: { active: false, loading: false },
    evac: { active: false, loading: false, cachedBbox: null },
    hud: { active: false, loading: false, cachedBbox: null },
    marinas: { active: false, loading: false, cachedBbox: null },
    parks: { active: false, loading: false, cachedBbox: null },
    schools: { active: false, loading: false, cachedBbox: null }
  };

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
  var legendItems = document.getElementById('legend-items');
  var layerPanelToggle = document.getElementById('layer-panel-toggle');
  var layerPanelBody = document.getElementById('layer-panel-body');
  var layerPanelChevron = document.getElementById('layer-panel-chevron');

  // --- Init map ---
  function initMap() {
    map = new maplibregl.Map({
      container: 'map',
      style: {
        version: 8,
        sources: {
          'carto-dark': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          }
        },
        layers: [{
          id: 'carto-dark-layer',
          type: 'raster',
          source: 'carto-dark'
        }]
      },
      center: TAMPA_CENTER,
      zoom: DEFAULT_ZOOM,
      maxBounds: [[-88.0, 24.5], [-79.5, 31.5]] // All of Florida
    });

    map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

    map.on('load', function () {
      addFemaFloodLayer();
      // Flood defaults to OFF - hide the layer on load
      map.setLayoutProperty('fema-flood-layer', 'visibility', 'none');
      initLayerSources();
      updateLegend();
    });

    // Debounced moveend handler for viewport-based layers
    var moveEndTimer = null;
    map.on('moveend', function () {
      clearTimeout(moveEndTimer);
      moveEndTimer = setTimeout(function () {
        refreshViewportLayers();
      }, 500);
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

  // --- Initialize GeoJSON sources and layers for dynamic data ---
  function initLayerSources() {
    var emptyGeoJSON = { type: 'FeatureCollection', features: [] };

    // Evac zones (polygons)
    map.addSource('evac-zones', { type: 'geojson', data: emptyGeoJSON });
    map.addLayer({
      id: 'evac-zones-fill',
      type: 'fill',
      source: 'evac-zones',
      paint: {
        'fill-color': [
          'match', ['get', 'EVAC_ZONE'],
          'A', '#ff4444',
          'B', '#ff8844',
          'C', '#ffcc44',
          'D', '#88cc44',
          'E', '#44aa44',
          '#888888'
        ],
        'fill-opacity': 0.3
      },
      layout: { visibility: 'none' }
    });
    map.addLayer({
      id: 'evac-zones-outline',
      type: 'line',
      source: 'evac-zones',
      paint: {
        'line-color': [
          'match', ['get', 'EVAC_ZONE'],
          'A', '#ff4444',
          'B', '#ff8844',
          'C', '#ffcc44',
          'D', '#88cc44',
          'E', '#44aa44',
          '#888888'
        ],
        'line-width': 1,
        'line-opacity': 0.6
      },
      layout: { visibility: 'none' }
    });

    // HUD housing (points)
    map.addSource('hud-points', { type: 'geojson', data: emptyGeoJSON });
    map.addLayer({
      id: 'hud-points-layer',
      type: 'circle',
      source: 'hud-points',
      paint: {
        'circle-radius': 6,
        'circle-color': '#ffa94d',
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#fff',
        'circle-opacity': 0.85
      },
      layout: { visibility: 'none' }
    });

    // Marinas (points)
    map.addSource('marina-points', { type: 'geojson', data: emptyGeoJSON });
    map.addLayer({
      id: 'marina-points-layer',
      type: 'circle',
      source: 'marina-points',
      paint: {
        'circle-radius': 6,
        'circle-color': '#339af0',
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#fff',
        'circle-opacity': 0.85
      },
      layout: { visibility: 'none' }
    });

    // Parks (points)
    map.addSource('park-points', { type: 'geojson', data: emptyGeoJSON });
    map.addLayer({
      id: 'park-points-layer',
      type: 'circle',
      source: 'park-points',
      paint: {
        'circle-radius': 6,
        'circle-color': '#51cf66',
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#fff',
        'circle-opacity': 0.85
      },
      layout: { visibility: 'none' }
    });

    // Schools (points)
    map.addSource('school-points', { type: 'geojson', data: emptyGeoJSON });
    map.addLayer({
      id: 'school-points-layer',
      type: 'circle',
      source: 'school-points',
      paint: {
        'circle-radius': 6,
        'circle-color': '#ffd43b',
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#fff',
        'circle-opacity': 0.85
      },
      layout: { visibility: 'none' }
    });
  }

  // --- Get current map bbox as string key for caching ---
  function getBboxKey() {
    var bounds = map.getBounds();
    // Round to 3 decimal places to create cache buckets
    return [
      bounds.getWest().toFixed(3),
      bounds.getSouth().toFixed(3),
      bounds.getEast().toFixed(3),
      bounds.getNorth().toFixed(3)
    ].join(',');
  }

  function getBboxString() {
    var bounds = map.getBounds();
    return bounds.getWest() + ',' + bounds.getSouth() + ',' + bounds.getEast() + ',' + bounds.getNorth();
  }

  // --- Refresh all active viewport-based layers ---
  function refreshViewportLayers() {
    if (map.getZoom() < MIN_LAYER_ZOOM) {
      return;
    }
    var bboxKey = getBboxKey();

    if (layers.evac.active && layers.evac.cachedBbox !== bboxKey) {
      fetchEvacZones(bboxKey);
    }
    if (layers.hud.active && layers.hud.cachedBbox !== bboxKey) {
      fetchHudPoints(bboxKey);
    }
    if (layers.marinas.active && layers.marinas.cachedBbox !== bboxKey) {
      fetchMarinas(bboxKey);
    }
    if (layers.parks.active && layers.parks.cachedBbox !== bboxKey) {
      fetchParks(bboxKey);
    }
    if (layers.schools.active && layers.schools.cachedBbox !== bboxKey) {
      fetchSchools(bboxKey);
    }
  }

  // --- Set loading indicator for a layer ---
  function setLayerLoading(layerName, isLoading) {
    layers[layerName].loading = isLoading;
    var el = document.getElementById('loading-' + layerName);
    if (el) {
      el.textContent = isLoading ? '(loading...)' : '';
    }
  }

  // --- Fetch evacuation zones as GeoJSON ---
  function fetchEvacZones(bboxKey) {
    if (layers.evac.loading) { return; }
    setLayerLoading('evac', true);

    var bounds = map.getBounds();
    var bbox = bounds.getWest() + ',' + bounds.getSouth() + ',' + bounds.getEast() + ',' + bounds.getNorth();
    var url = API.flEvac +
      '?where=1=1&outFields=EVAC_ZONE' +
      '&geometryType=esriGeometryEnvelope' +
      '&geometry=' + encodeURIComponent(bbox) +
      '&inSR=4326&outSR=4326&returnGeometry=true&f=geojson';

    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!layers.evac.active) { return; }
        if (data && data.type === 'FeatureCollection') {
          map.getSource('evac-zones').setData(data);
          layers.evac.cachedBbox = bboxKey;
        }
      })
      .catch(function (err) { console.error('Evac zones fetch error:', err); })
      .finally(function () { setLayerLoading('evac', false); });
  }

  // --- Fetch HUD housing points ---
  function fetchHudPoints(bboxKey) {
    if (layers.hud.loading) { return; }
    setLayerLoading('hud', true);

    var bounds = map.getBounds();
    var bbox = bounds.getWest() + ',' + bounds.getSouth() + ',' + bounds.getEast() + ',' + bounds.getNorth();
    var baseParams =
      '?where=1=1' +
      '&geometry=' + encodeURIComponent(bbox) +
      '&geometryType=esriGeometryEnvelope' +
      '&inSR=4326&outSR=4326' +
      '&spatialRel=esriSpatialRelIntersects' +
      '&returnGeometry=true&f=geojson';

    Promise.all([
      fetch(API.hudBuildings + baseParams + '&outFields=PROJECT_NAME,TOTAL_UNITS')
        .then(function (r) { return r.json(); })
        .catch(function () { return { type: 'FeatureCollection', features: [] }; }),
      fetch(API.hudMultifamily + baseParams + '&outFields=PROPERTY_NAME_TEXT,TOTAL_UNIT_COUNT')
        .then(function (r) { return r.json(); })
        .catch(function () { return { type: 'FeatureCollection', features: [] }; })
    ]).then(function (results) {
      if (!layers.hud.active) { return; }
      var combined = {
        type: 'FeatureCollection',
        features: (results[0].features || []).concat(results[1].features || [])
      };
      map.getSource('hud-points').setData(combined);
      layers.hud.cachedBbox = bboxKey;
    })
    .catch(function (err) { console.error('HUD fetch error:', err); })
    .finally(function () { setLayerLoading('hud', false); });
  }

  // --- Fetch marinas from Overpass ---
  function fetchMarinas(bboxKey) {
    if (layers.marinas.loading) { return; }
    setLayerLoading('marinas', true);

    var bounds = map.getBounds();
    var bbox = bounds.getSouth() + ',' + bounds.getWest() + ',' + bounds.getNorth() + ',' + bounds.getEast();
    var query = '[out:json];node["leisure"="marina"](' + bbox + ');out body;';

    fetch(API.overpass, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(query)
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!layers.marinas.active) { return; }
        var geojson = overpassToGeoJSON(data);
        map.getSource('marina-points').setData(geojson);
        layers.marinas.cachedBbox = bboxKey;
      })
      .catch(function (err) { console.error('Marinas fetch error:', err); })
      .finally(function () { setLayerLoading('marinas', false); });
  }

  // --- Fetch parks from Overpass ---
  function fetchParks(bboxKey) {
    if (layers.parks.loading) { return; }
    setLayerLoading('parks', true);

    var bounds = map.getBounds();
    var bbox = bounds.getSouth() + ',' + bounds.getWest() + ',' + bounds.getNorth() + ',' + bounds.getEast();
    var query = '[out:json];(node["leisure"="park"](' + bbox + ');node["leisure"="nature_reserve"](' + bbox + '););out body;';

    fetch(API.overpass, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(query)
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!layers.parks.active) { return; }
        var geojson = overpassToGeoJSON(data);
        map.getSource('park-points').setData(geojson);
        layers.parks.cachedBbox = bboxKey;
      })
      .catch(function (err) { console.error('Parks fetch error:', err); })
      .finally(function () { setLayerLoading('parks', false); });
  }

  // --- Fetch schools from Overpass ---
  function fetchSchools(bboxKey) {
    if (layers.schools.loading) { return; }
    setLayerLoading('schools', true);

    var bounds = map.getBounds();
    var bbox = bounds.getSouth() + ',' + bounds.getWest() + ',' + bounds.getNorth() + ',' + bounds.getEast();
    var query = '[out:json];node["amenity"="school"](' + bbox + ');out body;';

    fetch(API.overpass, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(query)
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!layers.schools.active) { return; }
        var geojson = overpassToGeoJSON(data);
        map.getSource('school-points').setData(geojson);
        layers.schools.cachedBbox = bboxKey;
      })
      .catch(function (err) { console.error('Schools fetch error:', err); })
      .finally(function () { setLayerLoading('schools', false); });
  }

  // --- Convert Overpass response to GeoJSON ---
  function overpassToGeoJSON(data) {
    var features = [];
    if (data && data.elements) {
      data.elements.forEach(function (el) {
        if (el.lat !== undefined && el.lon !== undefined) {
          features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [el.lon, el.lat] },
            properties: el.tags || {}
          });
        }
      });
    }
    return { type: 'FeatureCollection', features: features };
  }

  // --- Layer panel toggle ---
  layerPanelToggle.addEventListener('click', function () {
    layerPanelOpen = !layerPanelOpen;
    if (layerPanelOpen) {
      layerPanelBody.classList.add('open');
      layerPanelChevron.style.transform = 'rotate(180deg)';
    } else {
      layerPanelBody.classList.remove('open');
      layerPanelChevron.style.transform = '';
    }
  });

  // --- Layer checkbox toggles ---
  var LAYER_MAP_IDS = {
    flood: ['fema-flood-layer'],
    evac: ['evac-zones-fill', 'evac-zones-outline'],
    hud: ['hud-points-layer'],
    marinas: ['marina-points-layer'],
    parks: ['park-points-layer'],
    schools: ['school-points-layer']
  };

  document.querySelectorAll('.layer-item').forEach(function (item) {
    var checkbox = item.querySelector('input[type="checkbox"]');
    var layerName = item.dataset.layer;

    checkbox.addEventListener('change', function () {
      layers[layerName].active = checkbox.checked;

      // Toggle map layer visibility
      var mapIds = LAYER_MAP_IDS[layerName] || [];
      mapIds.forEach(function (id) {
        if (map.getLayer(id)) {
          map.setLayoutProperty(id, 'visibility', checkbox.checked ? 'visible' : 'none');
        }
      });

      if (checkbox.checked) {
        // If turning on a viewport layer, fetch data immediately
        if (layerName !== 'flood' && map.getZoom() >= MIN_LAYER_ZOOM) {
          var bboxKey = getBboxKey();
          if (layers[layerName].cachedBbox !== bboxKey) {
            triggerLayerFetch(layerName, bboxKey);
          }
        }
      } else {
        // Clear data when turning off
        clearLayerData(layerName);
      }

      updateLegend();
    });
  });

  function triggerLayerFetch(layerName, bboxKey) {
    switch (layerName) {
      case 'evac': fetchEvacZones(bboxKey); break;
      case 'hud': fetchHudPoints(bboxKey); break;
      case 'marinas': fetchMarinas(bboxKey); break;
      case 'parks': fetchParks(bboxKey); break;
      case 'schools': fetchSchools(bboxKey); break;
    }
  }

  function clearLayerData(layerName) {
    var emptyGeoJSON = { type: 'FeatureCollection', features: [] };
    var sourceMap = {
      evac: 'evac-zones',
      hud: 'hud-points',
      marinas: 'marina-points',
      parks: 'park-points',
      schools: 'school-points'
    };
    var srcName = sourceMap[layerName];
    if (srcName && map.getSource(srcName)) {
      map.getSource(srcName).setData(emptyGeoJSON);
    }
    layers[layerName].cachedBbox = null;
    setLayerLoading(layerName, false);
  }

  // --- Legend ---
  function updateLegend() {
    var anyActive = false;
    for (var key in layers) {
      if (layers[key].active) {
        anyActive = true;
        break;
      }
    }

    if (!anyActive) {
      legend.classList.add('hidden');
      return;
    }

    legend.classList.remove('hidden');
    var html = '';

    if (layers.flood.active) {
      html += '<div class="legend-section-title">Flood Zones (FEMA)</div>';
      html += '<div class="legend-item"><div class="legend-swatch" style="background: rgba(0, 50, 200, 0.5)"></div>V/VE - Coastal High Risk</div>';
      html += '<div class="legend-item"><div class="legend-swatch" style="background: rgba(0, 120, 200, 0.5)"></div>A/AE - High Risk</div>';
      html += '<div class="legend-item"><div class="legend-swatch" style="background: rgba(255, 165, 0, 0.4)"></div>Moderate Risk</div>';
      html += '<div class="legend-item"><div class="legend-swatch" style="background: rgba(200, 200, 200, 0.2)"></div>X - Minimal Risk</div>';
    }

    if (layers.evac.active) {
      html += '<div class="legend-section-title">Evacuation Zones</div>';
      html += '<div class="legend-item"><div class="legend-swatch" style="background: #ff4444; opacity: 0.6;"></div>Zone A - Cat 1+</div>';
      html += '<div class="legend-item"><div class="legend-swatch" style="background: #ff8844; opacity: 0.6;"></div>Zone B - Cat 2+</div>';
      html += '<div class="legend-item"><div class="legend-swatch" style="background: #ffcc44; opacity: 0.6;"></div>Zone C - Cat 3+</div>';
      html += '<div class="legend-item"><div class="legend-swatch" style="background: #88cc44; opacity: 0.6;"></div>Zone D - Cat 4+</div>';
      html += '<div class="legend-item"><div class="legend-swatch" style="background: #44aa44; opacity: 0.6;"></div>Zone E - Cat 5</div>';
    }

    if (layers.hud.active) {
      html += '<div class="legend-section-title">HUD / Section 8</div>';
      html += '<div class="legend-item"><div class="legend-swatch circle" style="background: #ffa94d;"></div>Public / Assisted Housing</div>';
    }

    if (layers.marinas.active) {
      html += '<div class="legend-section-title">Marinas</div>';
      html += '<div class="legend-item"><div class="legend-swatch circle" style="background: #339af0;"></div>Marina</div>';
    }

    if (layers.parks.active) {
      html += '<div class="legend-section-title">Parks & Nature</div>';
      html += '<div class="legend-item"><div class="legend-swatch circle" style="background: #51cf66;"></div>Park / Nature Reserve</div>';
    }

    if (layers.schools.active) {
      html += '<div class="legend-section-title">Schools</div>';
      html += '<div class="legend-item"><div class="legend-swatch circle" style="background: #ffd43b;"></div>School</div>';
    }

    legendItems.innerHTML = html;
  }

  // --- Search / Geocode ---
  var typeaheadTimer = null;

  searchBtn.addEventListener('click', doSearch);
  addressInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      clearTimeout(typeaheadTimer);
      doSearch();
    }
  });

  // Typeahead: query as user types (debounced 400ms, min 3 chars)
  addressInput.addEventListener('input', function () {
    clearTimeout(typeaheadTimer);
    var val = addressInput.value.trim();
    if (val.length < 3) {
      searchResults.classList.add('hidden');
      return;
    }
    typeaheadTimer = setTimeout(function () {
      typeaheadSearch(val);
    }, 400);
  });

  function typeaheadSearch(query) {
    // For street addresses (starts with number), add Tampa context and use Nominatim
    // For general queries, try Photon first then Nominatim fallback
    var looksLikeAddress = /^\d/.test(query.trim());

    if (looksLikeAddress) {
      // Nominatim is better for structured US street addresses
      typeaheadNominatim(query);
    } else {
      // Photon for general place/street name searches (no bbox - just bias)
      var url = 'https://photon.komoot.io/api/' +
        '?q=' + encodeURIComponent(query) +
        '&lat=27.77&lon=-82.64&limit=6&lang=en';

      fetch(url)
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (!data.features || data.features.length === 0) {
            typeaheadNominatim(query);
            return;
          }

          // Filter to Florida results only
          var flResults = data.features.filter(function (f) {
            var p = f.properties;
            return p.state === 'Florida' || p.state === 'FL';
          });

          if (flResults.length === 0) {
            typeaheadNominatim(query);
            return;
          }

          var matches = flResults.map(function (f) {
            var p = f.properties;
            var parts = [];
            if (p.housenumber) { parts.push(p.housenumber); }
            if (p.street) { parts.push(p.street); }
            var addrLine = parts.join(' ') || p.name || '';
            var cityLine = [p.city || p.county, p.state].filter(Boolean).join(', ');
            return {
              displayName: [addrLine, cityLine].filter(Boolean).join(', '),
              addrLine: addrLine,
              cityLine: cityLine,
              lat: f.geometry.coordinates[1],
              lng: f.geometry.coordinates[0]
            };
          });

          showAddressResults(matches);
        })
        .catch(function () {
          typeaheadNominatim(query);
        });
    }
  }

  function typeaheadNominatim(query) {
    // For addresses, try both with and without Tampa context
    var searchQuery = query;
    if (/^\d/.test(query.trim()) && !/tampa|st\.?\s*pete|clearwater|florida|fl\b/i.test(query)) {
      searchQuery = query + ', FL';
    }

    // Run two searches in parallel: one with context, one without (bounded to viewbox)
    var url1 = API.nominatim +
      '?q=' + encodeURIComponent(searchQuery) +
      '&format=json&addressdetails=1&limit=5' +
      '&countrycodes=us';

    var url2 = API.nominatim +
      '?q=' + encodeURIComponent(query) +
      '&format=json&addressdetails=1&limit=5' +
      '&countrycodes=us' +
      '&viewbox=-88.0,31.5,-79.5,24.5&bounded=1';

    Promise.all([
      fetch(url1, { headers: { 'Accept': 'application/json' } }).then(function (r) { return r.json(); }).catch(function () { return []; }),
      fetch(url2, { headers: { 'Accept': 'application/json' } }).then(function (r) { return r.json(); }).catch(function () { return []; })
    ]).then(function (results) {
      // Merge and deduplicate results, preferring bounded results
      var seen = {};
      var allResults = [];
      (results[1] || []).concat(results[0] || []).forEach(function (r) {
        var key = r.lat + ',' + r.lon;
        if (!seen[key]) {
          seen[key] = true;
          allResults.push(r);
        }
      });

      if (allResults.length === 0) {
        searchResults.innerHTML = '<div class="search-no-results">No results found</div>';
        searchResults.classList.remove('hidden');
        return;
      }

      var matches = allResults.slice(0, 6).map(function (r) {
        var addr = r.address || {};
        var addrLine = '';
        if (addr.house_number && addr.road) {
          addrLine = addr.house_number + ' ' + addr.road;
        } else if (addr.road) {
          addrLine = addr.road;
        } else {
          addrLine = r.display_name.split(', ').slice(0, 2).join(', ');
        }
        var cityParts = [addr.city || addr.town || addr.village, addr.state].filter(Boolean);
        var cityLine = cityParts.join(', ');

        return {
          displayName: r.display_name,
          addrLine: addrLine,
          cityLine: cityLine,
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon)
        };
      });

      showAddressResults(matches);
    });
  }

  function doSearch() {
    var addr = addressInput.value.trim();
    if (!addr) { return; }
    searchResults.classList.add('hidden');
    geocodeAddress(addr);
  }

  function geocodeAddress(address) {
    var query = address;
    // Append "Tampa Bay FL" if user didn't include a city/state
    if (!/florida|fl\b/i.test(query)) {
      query += ', FL';
    }

    var url = API.nominatim +
      '?q=' + encodeURIComponent(query) +
      '&format=json&addressdetails=1&limit=5' +
      '&countrycodes=us' +
      '&viewbox=-88.0,31.5,-79.5,24.5&bounded=1';

    showLoading();

    fetch(url, { headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (results) {
        if (!results || results.length === 0) {
          hideLoading();
          panelAddress.textContent = 'No results found. Try a different search.';
          panel.classList.remove('hidden');
          return;
        }

        var matches = results.map(function (r) {
          return {
            displayName: r.display_name,
            lat: parseFloat(r.lat),
            lng: parseFloat(r.lon)
          };
        });

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
      var addr = m.addrLine || m.displayName.split(', ').slice(0, 2).join(', ');
      var city = m.cityLine || m.displayName.split(', ').slice(2, 4).join(', ');
      div.innerHTML =
        '<div class="match-addr">' + escapeHtml(addr) + '</div>' +
        '<div class="match-city">' + escapeHtml(city) + '</div>';
      div.addEventListener('click', function () {
        searchResults.classList.add('hidden');
        addressInput.value = m.displayName;
        selectAddress(m);
      });
      searchResults.appendChild(div);
    });
    searchResults.classList.remove('hidden');
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function selectAddress(match) {
    var lng = match.lng;
    var lat = match.lat;
    var addr = match.displayName;

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
      queryEvacZone(lat, lng),
      queryCensusData(lat, lng),
      querySexOffenders(lat, lng),
      queryPublicHousing(lat, lng)
    ]).then(function (results) {
      var flood = results[0];
      var elevation = results[1];
      var evac = results[2];
      var census = results[3];
      var offenders = results[4];
      var housing = results[5];

      renderResults(flood, elevation, evac, census, offenders, housing);
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

  // --- Census ACS data (income, poverty, education, renter rate) ---
  function queryCensusData(lat, lng) {
    var fccUrl = API.fccArea +
      '?lat=' + lat + '&lon=' + lng + '&format=json';

    return fetch(fccUrl)
      .then(function (r) { return r.json(); })
      .then(function (fcc) {
        if (!fcc.results || fcc.results.length === 0) { return null; }
        var block = fcc.results[0];
        var state = block.state_fips;
        var county = block.county_fips.substring(state.length);
        var tract = block.block_fips.substring(5, 11);

        var fields = 'B19013_001E,B17001_002E,B17001_001E,B25003_001E,B25003_003E,' +
          'B15003_001E,B15003_022E,B15003_023E,B15003_024E,B15003_025E,' +
          'B01003_001E,B25064_001E';

        var acsUrl = API.censusAcs +
          '?get=' + fields +
          '&for=tract:' + tract +
          '&in=state:' + state + '+county:' + county;

        return fetch(acsUrl)
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (!data || data.length < 2) { return null; }
            var headers = data[0];
            var values = data[1];
            var obj = {};
            headers.forEach(function (h, i) { obj[h] = values[i]; });

            var medianIncome = parseInt(obj['B19013_001E']) || null;
            var povPop = parseInt(obj['B17001_002E']) || 0;
            var povTotal = parseInt(obj['B17001_001E']) || 1;
            var povertyRate = Math.round((povPop / povTotal) * 100);
            var totalUnits = parseInt(obj['B25003_001E']) || 1;
            var renterUnits = parseInt(obj['B25003_003E']) || 0;
            var renterRate = Math.round((renterUnits / totalUnits) * 100);
            var eduTotal = parseInt(obj['B15003_001E']) || 1;
            var bachelors = (parseInt(obj['B15003_022E']) || 0) +
              (parseInt(obj['B15003_023E']) || 0) +
              (parseInt(obj['B15003_024E']) || 0) +
              (parseInt(obj['B15003_025E']) || 0);
            var collegeRate = Math.round((bachelors / eduTotal) * 100);
            var totalPop = parseInt(obj['B01003_001E']) || null;
            var medianRent = parseInt(obj['B25064_001E']) || null;

            return {
              medianIncome: medianIncome,
              povertyRate: povertyRate,
              renterRate: renterRate,
              collegeRate: collegeRate,
              totalPop: totalPop,
              medianRent: medianRent
            };
          });
      })
      .catch(function (err) { console.error('Census error:', err); return null; });
  }

  // --- Sex offender query ---
  function querySexOffenders(lat, lng) {
    return Promise.resolve(null);
  }

  // --- HUD Subsidized housing (bounding box ~2 miles) ---
  function queryPublicHousing(lat, lng) {
    var delta = 0.03;
    var bbox = (lng - delta) + ',' + (lat - delta) + ',' + (lng + delta) + ',' + (lat + delta);
    var baseParams = '?where=1%3D1' +
      '&geometry=' + encodeURIComponent(bbox) +
      '&geometryType=esriGeometryEnvelope' +
      '&inSR=4326' +
      '&spatialRel=esriSpatialRelIntersects' +
      '&returnGeometry=false' +
      '&f=json';

    return Promise.all([
      fetch(API.hudBuildings + baseParams + '&outFields=PROJECT_NAME,TOTAL_UNITS')
        .then(function (r) { return r.json(); })
        .catch(function () { return { features: [] }; }),
      fetch(API.hudMultifamily + baseParams + '&outFields=PROPERTY_NAME_TEXT,TOTAL_UNIT_COUNT,ADDRESS_LINE1_TEXT')
        .then(function (r) { return r.json(); })
        .catch(function () { return { features: [] }; })
    ]).then(function (results) {
      var buildings = (results[0].features || []);
      var multifamily = (results[1].features || []);

      var allProperties = [];
      var totalUnits = 0;

      buildings.forEach(function (f) {
        var a = f.attributes;
        allProperties.push({ name: a.PROJECT_NAME, units: a.TOTAL_UNITS || 0, type: 'Public Housing' });
        totalUnits += (a.TOTAL_UNITS || 0);
      });

      multifamily.forEach(function (f) {
        var a = f.attributes;
        allProperties.push({ name: a.PROPERTY_NAME_TEXT, units: a.TOTAL_UNIT_COUNT || 0, type: 'HUD Assisted' });
        totalUnits += (a.TOTAL_UNIT_COUNT || 0);
      });

      return { count: allProperties.length, totalUnits: totalUnits, properties: allProperties };
    })
    .catch(function () { return null; });
  }

  // --- Render results ---
  function renderResults(flood, elevation, evac, census, offenders, housing) {
    panelSummary.classList.remove('hidden');
    panelDetails.classList.remove('hidden');

    renderCensusSummary(census);
    renderFloodSummary(flood);
    renderElevationSummary(elevation);
    renderEvacSummary(evac);
    renderInsuranceSummary(flood);
    renderNeighborhoodDetails(census);
    renderOffenderDetails(offenders);
    renderHousingDetails(housing);
    renderFloodDetails(flood);
    renderElevationDetails(elevation);
    renderHurricaneDetails(evac);
  }

  function renderFloodSummary(flood) {
    var valEl = document.getElementById('val-flood');

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

    var zone = evac.EVAC_ZONE || evac.Zone || evac.ZONE || evac.EvacZone || evac.evaczone || null;

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

  function renderInsuranceSummary(flood) {
    var valEl = document.getElementById('val-insurance');

    if (!flood || !flood.FLD_ZONE) {
      valEl.textContent = 'N/A';
      valEl.className = 'summary-value';
      return;
    }

    var info = FLOOD_RISK[flood.FLD_ZONE] || {};
    if (info.insurance) {
      valEl.textContent = info.insurance.split('/')[0];
      valEl.className = 'summary-value risk-' + (info.level || 'medium');
    } else {
      valEl.textContent = 'N/A';
    }
  }

  function renderCensusSummary(census) {
    var incomeEl = document.getElementById('val-income');
    var povertyEl = document.getElementById('val-poverty');

    if (!census) {
      incomeEl.textContent = 'N/A';
      povertyEl.textContent = 'N/A';
      return;
    }

    if (census.medianIncome) {
      incomeEl.textContent = '$' + census.medianIncome.toLocaleString();
      if (census.medianIncome < 35000) {
        incomeEl.className = 'summary-value risk-high';
      } else if (census.medianIncome < 55000) {
        incomeEl.className = 'summary-value risk-medium';
      } else {
        incomeEl.className = 'summary-value risk-low';
      }
    } else {
      incomeEl.textContent = 'N/A';
    }

    povertyEl.textContent = census.povertyRate + '%';
    if (census.povertyRate > 25) {
      povertyEl.className = 'summary-value risk-high';
    } else if (census.povertyRate > 15) {
      povertyEl.className = 'summary-value risk-medium';
    } else {
      povertyEl.className = 'summary-value risk-low';
    }
  }

  function renderNeighborhoodDetails(census) {
    var container = document.getElementById('neighborhood-details');

    if (!census) {
      container.innerHTML = '<div class="detail-item full-width"><div class="d-label">Status</div><div class="d-value">Census data unavailable</div></div>';
      return;
    }

    var incomeClass = '';
    if (census.medianIncome < 35000) { incomeClass = 'risk-high'; }
    else if (census.medianIncome < 55000) { incomeClass = 'risk-medium'; }
    else { incomeClass = 'risk-low'; }

    var povClass = '';
    if (census.povertyRate > 25) { povClass = 'risk-high'; }
    else if (census.povertyRate > 15) { povClass = 'risk-medium'; }
    else { povClass = 'risk-low'; }

    var renterClass = '';
    if (census.renterRate > 70) { renterClass = 'risk-high'; }
    else if (census.renterRate > 50) { renterClass = 'risk-medium'; }
    else { renterClass = 'risk-low'; }

    var html =
      '<div class="detail-item"><div class="d-label">Median Income</div><div class="d-value ' + incomeClass + '">$' + (census.medianIncome ? census.medianIncome.toLocaleString() : 'N/A') + '</div></div>' +
      '<div class="detail-item"><div class="d-label">Poverty Rate</div><div class="d-value ' + povClass + '">' + census.povertyRate + '%</div></div>' +
      '<div class="detail-item"><div class="d-label">Renter Occupied</div><div class="d-value ' + renterClass + '">' + census.renterRate + '%</div></div>' +
      '<div class="detail-item"><div class="d-label">College Educated</div><div class="d-value">' + census.collegeRate + '%</div></div>' +
      '<div class="detail-item"><div class="d-label">Tract Population</div><div class="d-value">' + (census.totalPop ? census.totalPop.toLocaleString() : 'N/A') + '</div></div>' +
      '<div class="detail-item"><div class="d-label">Median Rent</div><div class="d-value">$' + (census.medianRent ? census.medianRent.toLocaleString() : 'N/A') + '/mo</div></div>';

    container.innerHTML = html;
  }

  function renderOffenderDetails(offenders) {
    var container = document.getElementById('offender-details');

    container.innerHTML =
      '<div class="detail-item full-width"><div class="d-label">Registry Search</div>' +
      '<div class="d-value" style="font-size: 0.85rem;">No free API available. Check the ' +
      '<a href="https://offender.fdle.state.fl.us/offender/sops/offenderSearch.jsf" target="_blank" rel="noopener" style="color: var(--accent); text-decoration: underline;">Florida FDLE Registry</a> ' +
      'or <a href="https://www.nsopw.gov/" target="_blank" rel="noopener" style="color: var(--accent); text-decoration: underline;">NSOPW</a> directly.</div></div>';
  }

  function renderHousingDetails(housing) {
    var container = document.getElementById('housing-details');

    if (!housing) {
      container.innerHTML = '<div class="detail-item full-width"><div class="d-label">Status</div><div class="d-value">HUD housing data unavailable</div></div>';
      return;
    }

    var countClass = '';
    if (housing.totalUnits > 500) { countClass = 'risk-high'; }
    else if (housing.totalUnits > 100) { countClass = 'risk-medium'; }
    else { countClass = 'risk-low'; }

    var html =
      '<div class="detail-item"><div class="d-label">Properties (~2 mi)</div><div class="d-value ' + countClass + '">' + housing.count + '</div></div>' +
      '<div class="detail-item"><div class="d-label">Total Units</div><div class="d-value ' + countClass + '">' + housing.totalUnits.toLocaleString() + '</div></div>';

    if (housing.properties && housing.properties.length > 0) {
      html += '<div class="detail-item full-width"><div class="d-label">Nearby Properties</div><div class="d-value" style="font-size: 0.78rem; line-height: 1.6;">';
      housing.properties.slice(0, 8).forEach(function (p) {
        html += escapeHtml((p.name || 'Unknown') + ' (' + p.units + ' units, ' + p.type + ')') + '<br>';
      });
      html += '</div></div>';
    }

    container.innerHTML = html;
  }

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
