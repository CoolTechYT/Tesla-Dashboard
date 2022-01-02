import axios from "axios";
import { useEffect, useState } from "react";

import { Grid, Cell } from 'baseui/layout-grid';

import Nav from "./components/Nav";
import DataCard from "./components/DataCard";
import Outer from "./components/Outer";
import Inner from "./components/Inner";

const items = [
  'access_token',
  'token_type',
  'expires_in',
  'refresh_token',
  'created_at',
  'id'
];

const obj = {};
const dataUrl = 'http://localhost:7777';
items.forEach(item => obj[[item]] = sessionStorage.getItem(item));

export default function App() {
  const [storedData, setStoredData] = useState(obj);
  const [vehicleState, setVehicleState] = useState({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!storedData.access_token) authenticateUser();
    else if (!storedData.id) storeVehicleId(storedData.access_token);
    else retrieveVehicleState(storedData.access_token);
  }, []);

  const authenticateUser = () => {
    axios.get(dataUrl).then(response => {
      setStoredData(response.data);
      items.forEach(item =>
        (item !== 'id') && sessionStorage.setItem([item], response.data[item])
      )
    }).catch(e => console.log(e));
  };

  const storeVehicleId = (accessToken) => {
    axios.get(`${dataUrl}/vehicle/brutus/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }).then(response => {
      sessionStorage.setItem('id', response.data);
      const storedDataClone = { ...storedData };
      storedDataClone.id = response.data;
      setStoredData(storedDataClone);
      retrieveVehicleState(accessToken);
    }).catch(e => console.log(e));
  };

  const retrieveVehicleState = (accessToken) => {
    axios.get(`${dataUrl}/vehicle/${storedData.id}/state/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }).then(res => {
      setVehicleState(res.data);
      setLoading(false);
    }).catch(e => console.log(e));
  };

  const data = {
    battery_level: vehicleState?.charge_state?.battery_level,
    battery_range: vehicleState?.charge_state?.battery_range,
    charging_state: vehicleState?.charge_state?.charging_state,
    charge_limit_soc: vehicleState?.charge_state?.charge_limit_soc,
    inside_temp: vehicleState?.climate_state?.inside_temp,
    is_climate_on: vehicleState?.climate_state?.is_climate_on,
    outside_temp: vehicleState?.climate_state?.outside_temp,
    fan_status: vehicleState?.climate_state?.fan_status
  };

  const metrics = [
    [
      'battery_level',
      'battery_range',
      'charging_state',
      'charge_limit_soc'
    ],
    [
      'inside_temp',
      'is_climate_on',
      'outside_temp',
      'fan_status'
    ]
  ];

  return !loading && (
    <>
      <Nav />
      {metrics.map((stats, index) =>
        <Outer key={index}>
          <Grid>
            {stats.map((metric) =>
              <Cell span={[1, 2, 3]}>
                <Inner>
                  <DataCard
                    key={metric}
                    label={metric}
                    metric={data[metric]}
                  />
                </Inner>
              </Cell>
            )}
          </Grid>
        </Outer>
      )}
    </>
  )
}