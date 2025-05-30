const endpoints = {
  rer: 'https://ratp-proxy.hippodrome-proxy42.workers.dev/?ref=STIF:StopPoint:Q:43135:',
  bus: [
    'https://ratp-proxy.hippodrome-proxy42.workers.dev/?ref=STIF:StopPoint:Q:463644:',
    'https://ratp-proxy.hippodrome-proxy42.workers.dev/?ref=STIF:StopPoint:Q:463641:'
  ],
  velib: [
    'https://velib-metropole-opendata.smoove.pro/opendata/Velib_Metropole/station_status.json',
    'https://velib-metropole-opendata.smoove.pro/opendata/Velib_Metropole/station_information.json'
  ]
};

async function fetchRER() {
  const res = await fetch(endpoints.rer);
  const data = await res.json();
  const items = data.Siri.ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit || [];
  const list = document.getElementById('rer-list');
  list.innerHTML = '';
  items.forEach(item => {
    const name = item.MonitoredVehicleJourney.PublishedLineName;
    const dest = item.MonitoredVehicleJourney.DestinationName;
    const time = item.MonitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime;
    const li = document.createElement('li');
    li.textContent = `${name} → ${dest} à ${new Date(time).toLocaleTimeString()}`;
    list.appendChild(li);
  });
}

async function fetchBus() {
  const list = document.getElementById('bus-list');
  list.innerHTML = '';
  for (const url of endpoints.bus) {
    const res = await fetch(url);
    const data = await res.json();
    const items = data.Siri.ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit || [];
    items.forEach(item => {
      const name = item.MonitoredVehicleJourney.PublishedLineName;
      const dest = item.MonitoredVehicleJourney.DestinationName;
      const time = item.MonitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime;
      const li = document.createElement('li');
      li.textContent = `${name} → ${dest} à ${new Date(time).toLocaleTimeString()}`;
      list.appendChild(li);
    });
  }
}

async function fetchVelib() {
  const statusRes = await fetch(endpoints.velib[0]);
  const infoRes = await fetch(endpoints.velib[1]);
  const statusData = await statusRes.json();
  const infoData = await infoRes.json();
  const targetStations = ['12128', '12163'];
  const list = document.getElementById('velib-list');
  list.innerHTML = '';
  targetStations.forEach(id => {
    const stat = statusData.data.stations.find(s => s.station_id === id);
    const info = infoData.data.stations.find(s => s.station_id === id);
    if (stat && info) {
      const li = document.createElement('li');
      li.textContent = `${info.name} : ${stat.num_bikes_available_types.find(t => t.bike_type === 'mechanical')?.count || 0} mécaniques, ${stat.num_bikes_available_types.find(t => t.bike_type === 'ebike')?.count || 0} électriques, ${stat.num_docks_available} places libres`;
      list.appendChild(li);
    }
  });
}

function refreshAll() {
  fetchRER();
  fetchBus();
  fetchVelib();
}

refreshAll();
setInterval(refreshAll, 60000);