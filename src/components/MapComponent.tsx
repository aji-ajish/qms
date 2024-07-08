import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import { fromLonLat, toLonLat } from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { Cluster } from 'ol/source';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Icon, Fill, Stroke, Text } from 'ol/style';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { DataFrame, GrafanaTheme2 } from '@grafana/data';
import { boundingExtent } from 'ol/extent';
import Overlay from 'ol/Overlay';
import Popup from './Popup';
import { css } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';


const btnStyle = (theme: GrafanaTheme2) => css({
  background: theme.colors.background.secondary,
  color: theme.colors.text.secondary,
  border: '2px solid ' + theme.colors.background.secondary,
  padding: '7px 8px 1px',
  borderRadius: '3px',
  cursor: 'pointer'
});

const getStyles = (theme: GrafanaTheme2) => {
  return {
    actions: css({
      position: 'absolute',
      top: '16px',
      right: '16px',
      zIndex: 10,
    }),
    zoomOut: btnStyle(theme),
    btnFullscreen: btnStyle(theme),
    idstyle: css({
      marginBottom: '4px',
      fontWeight: 'bold',
      color: theme.colors.text.maxContrast,
      background: theme.colors.background.secondary,
      padding: '4px 8px',
      borderRadius: '4px',
    }),
    statusContainer: css({
      display: 'flex',
      alignItems: 'center',
      marginTop: '4px',
    }),
    dataStyle: css({
      marginBottom: '4px',
      color: theme.colors.text.maxContrast,
      fontSize: '14px',
    }),
    statusDot: css({
      marginRight: '8px',
      width: '13px',
      height: '13px',
      borderRadius: '50%',
    }),
    statusText: css({
      margin: 0,
      color: 'red',
      fontSize: '14px',
    }),
    statusSuccess: css({
      margin: 0,
      color: 'rgb(27, 211, 13)', // Color for online status
      fontSize: '14px',
    }),
  }
};


interface MapComponentProps {
  points: Array<{ lat: number; lng: number; deviceid: string }>;
  onLocationClick: (deviceid: string) => void;
  selectedPoint: { lat: number; lng: number; deviceid: string } | null;
  XYZurl?: string;
  type?: string;
  mapFit?: string | boolean;
  dataKey?: string;
  colorPairsList: any;
  data: DataFrame[];
  zoomInd?: number;
  zoomBoolean?: boolean;
  defaultColor: string;
  onMapFitToData: (option: boolean) => void;
  pinText: string | undefined;
  unit?: any;
}

const MapComponent: React.FC<MapComponentProps> = ({
  points,
  onLocationClick,
  selectedPoint,
  XYZurl,
  type,
  mapFit,
  dataKey,
  colorPairsList,
  data,
  zoomBoolean,
  zoomInd,
  defaultColor,
  onMapFitToData,
  pinText,
  unit
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const markerSource = useRef(new VectorSource());
  const clusterSource = useRef(new Cluster({ distance: 40, source: markerSource.current }));
  const clusterLayer = useRef(new VectorLayer({ source: clusterSource.current }));
  const [popupCoordinate, setPopupCoordinate] = useState<[number, number] | null>(null);
  const [popupContent, setPopupContent] = useState<React.ReactNode | null>(null);
  const styles = useStyles2(getStyles);
  const zoomIndRef = useRef(zoomInd);
  const zoomBooleanRef = useRef(zoomBoolean);

  const colorArray = useMemo(
    () => colorPairsList.colorPairs?.length ? colorPairsList.colorPairs : [{ color: defaultColor || 'gray', value: '0' }],
    [colorPairsList.colorPairs, defaultColor]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      colorArray.sort((a: any, b: any) => a.value - b.value);
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [colorArray]);

  const getColor = useCallback(
    (unit: number): string => {
      if (colorArray.length === 0) {
        return defaultColor || 'gray';
      }
      for (let i = 0; i < colorArray.length - 1; i++) {
        if (unit >= colorArray[i].value && unit < colorArray[i + 1].value) {
          return colorArray[i].color;
        }
      }
      if (unit >= colorArray[colorArray.length - 1].value) {
        return colorArray[colorArray.length - 1].color;
      }
      return defaultColor;
    },
    [colorArray, defaultColor]
  );

  const getDataForDevice = useCallback(
    (deviceid: string, data: DataFrame[], dataKey: string | undefined): any | null => {
      for (const frame of data) {
        const deviceidField = frame.fields.find((f) => f.name === 'deviceid');
        const dataField = frame.fields.find((f) => f.name === 'data');

        if (deviceidField && dataField) {
          const deviceIndex = deviceidField.values.findIndex((value) => value === deviceid);

          if (deviceIndex !== -1) {
            const dataValue = dataField.values[deviceIndex];
            try {
              const parsedData = JSON.parse(dataValue);
              return dataKey ? parsedData[dataKey] : parsedData;
            } catch (error) {
              console.error(`Error parsing data for deviceid '${deviceid}':`, error);
              return null;
            }
          }
        }
      }

      return null;
    },
    []
  );

  const getStatus = useCallback(
    (data: DataFrame[], deviceId: string): string | null => {
      for (const frame of data) {
        const deviceIdField = frame.fields.find((f) => f.name === 'deviceid');
        const statusField = frame.fields.find((f) => f.name === 'device_status');

        if (deviceIdField && statusField) {
          const deviceIndex = deviceIdField.values.findIndex((value) => value === deviceId);

          if (deviceIndex !== -1) {
            return statusField.values[deviceIndex];
          }
        }
      }

      return null;
    },
    []
  );

  const alertCount = useCallback((data: DataFrame[]): number[] => {
    const alertCounts: number[] = [];
    for (const frame of data) {
      const alerts_info = frame.fields.find((f) => f.name === 'alerts_info');

      if (alerts_info) {
        const parsedValues = alerts_info.values.map((value) => JSON.parse(value));
        const counts = parsedValues.map((value) => (value ? value.length : 0)); // Handle null or undefined values
        alertCounts.push(...counts);
      }
    }
    return alertCounts;
  }, []);

  const roundOff = useCallback((num: number | string): string => {
    if (typeof num === 'string') {
      return num; // Return as is if it's a string
    }
    // Check if there are decimals
    if (Number.isInteger(num)) {
      return num.toString(); // Return as integer if no decimals
    } else {
      return num.toFixed(1); // Round to two decimals if there are decimals
    }
  }, []);

  useEffect(() => {
    if (!mapInstance.current && mapRef.current) {
      mapInstance.current = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({
            source:
              type === 'default'
                ? new XYZ({ url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' })
                : new XYZ({ url: XYZurl! }),
          }),
          clusterLayer.current,
        ],
        view: new View({
          zoom: 9,
          center: fromLonLat([51.15, 25.30]),
        }),
        controls: [],
      });

      mapInstance.current.on('click', (evt) => {
        const feature = mapInstance.current!.forEachFeatureAtPixel(evt.pixel, (f) => f);
        if (feature) {
          const geometry = feature.getGeometry();
          if (geometry instanceof Point) {
            const coordinates = toLonLat(geometry.getCoordinates());
            const [lng, lat] = coordinates;
            const features = feature.get('features');
            const deviceid = features && features.length > 0 ? features[0].get('deviceid') : feature.get('deviceid');
            const coordinate = fromLonLat([lng, lat]);
            if (mapInstance.current) {
              if (zoomBooleanRef.current) {
                mapInstance.current.getView().animate({ center: coordinate, zoom: zoomIndRef.current });
              } else {
                mapInstance.current.getView().animate({ center: coordinate, zoom: 12 });
              }
            }
            onLocationClick(deviceid);
          }
        }
      });

      mapInstance.current.on('pointermove', (evt) => {
        const hit = mapInstance.current!.forEachFeatureAtPixel(evt.pixel, (feature) => true);
        if (hit) {
          mapInstance.current!.getTargetElement().style.cursor = 'pointer';
        } else {
          mapInstance.current!.getTargetElement().style.cursor = '';
        }
      });

      const overlay = new Overlay({
        element: document.getElementById('popup')!,
        autoPan: {
          animation: {
            duration: 250,
          },
        },
      });
      mapInstance.current.addOverlay(overlay);
    } else if (mapInstance.current) {
      // Update the XYZ URL or default map based on type
      const tileLayer = mapInstance.current.getLayers().item(0) as TileLayer<XYZ>;
      tileLayer.setSource(
        type === 'default'
          ? new XYZ({ url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' })
          : new XYZ({ url: XYZurl || '' })
      );
    }
  }, [type, XYZurl, points, data, dataKey, onLocationClick, styles, unit]);

  useEffect(() => {
    zoomIndRef.current = zoomInd;
  }, [zoomInd]);

  useEffect(() => {
    zoomBooleanRef.current = zoomBoolean;
  }, [zoomBoolean]);

  useEffect(() => {
    const handlePointerMove = (evt: any) => {
      const feature = mapInstance.current!.forEachFeatureAtPixel(evt.pixel, (f) => f);
      if (feature) {
        const geometry = feature.getGeometry();
        if (geometry instanceof Point) {
          const features = feature.get('features');
          const deviceid = features && features.length > 0 ? features[0].get('deviceid') : feature.get('deviceid');
          const dataValue = getDataForDevice(deviceid, data, dataKey);
          const status = getStatus(data, deviceid);
          const statusDot = status === 'online' ? 'rgb(27, 211, 13)' : 'rgb(247, 4, 33)';
  
          const svgDot = (
            <svg
              width="13px"
              height="13px"
              viewBox="0 3 16 16"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
            >
              <path fill={statusDot} d="M8 3a5 5 0 100 10A5 5 0 008 3z" />
            </svg>
          );
  
          setPopupCoordinate(evt.pixel as [number, number]);
          setPopupContent(
            <>
              <p className={styles.idstyle}>{deviceid}</p>
              <p className={styles.dataStyle}>
                {dataKey}: {dataValue} {unit}
              </p>
              <div className={styles.statusContainer}>
                <div className={styles.statusDot}>{svgDot}</div>
                <p className={status === 'online' ? styles.statusSuccess : styles.statusText}>
                  {status}
                </p>
              </div>
            </>
          );
        }
      } else {
        setPopupCoordinate(null);
        setPopupContent(null);
      }
    };
  
    if (mapInstance.current) {
      mapInstance.current.on('pointermove', handlePointerMove);
    }
  
    return () => {
      if (mapInstance.current) {
        mapInstance.current.un('pointermove', handlePointerMove);
      }
    };
  }, [data, dataKey, getStatus, getDataForDevice, styles, unit]);

  useEffect(() => {
    const alertCounts = alertCount(data);
    if (mapInstance.current) {
      const features = points.map(({ lat, lng, deviceid }, index) => {
        const dataValue = getDataForDevice(deviceid, data, dataKey);
        const alertTotalCount = alertCounts[index]; // Get alertTotalCount for each feature
        const color = getColor(dataValue);
        const status = getStatus(data, deviceid);
        return new Feature({
          geometry: new Point(fromLonLat([lng, lat])),
          deviceid,
          color,
          dataValue,
          alertTotalCount, // Add alertTotalCount to the Feature object
          status
        });
      });

      markerSource.current.clear();
      markerSource.current.addFeatures(features);
      clusterSource.current.setSource(markerSource.current);

      clusterLayer.current.setStyle((feature) => {
        const size = feature.get('features').length;
        let style;

        if (size > 1) {
          style = new Style({
            image: new Icon({
              src:
                'data:image/svg+xml;utf8,' +
                encodeURIComponent(`
                <svg fill="#111d9c" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
                width="450px" height="450px" viewBox="0 0 395.71 395.71" xml:space="preserve">
                  <g>
                    <path d="M197.849,0C122.131,0,60.531,61.609,60.531,137.329c0,72.887,124.591,243.177,129.896,250.388l4.951,6.738
                      c0.579,0.792,1.501,1.255,2.471,1.255c0.985,0,1.901-0.463,2.486-1.255l4.948-6.738c5.308-7.211,129.896-177.501,129.896-250.388
                      C335.179,61.609,273.569,0,197.849,0z M197.849,88.138c27.13,0,49.191,22.062,49.191,49.191c0,27.115-22.062,49.191-49.191,49.191
                      c-27.114,0-49.191-22.076-49.191-49.191C148.658,110.2,170.734,88.138,197.849,88.138z"/>
                  </g>
                </svg>`),
              scale: 0.1,
            }),
            text: new Text({
              text: size.toString(),
              font: 'bold 14px sans-serif',
              fill: new Fill({ color: '#fff' }),
              stroke: new Stroke({ color: '#000', width: 2 }),
              offsetY: 0,
            }),
          });
        } else {
          const deviceid = feature.get('features')[0].get('deviceid');
          const dataValue = feature.get('features')[0].get('dataValue');
          const alertTotalCount = feature.get('features')[0].get('alertTotalCount'); // Get alertTotalCount from the feature
          const displayAlertCount = alertTotalCount > 99 ? '99+' : alertTotalCount.toString();


          const pinColor = getStatus(data, deviceid) === 'online' ? getColor(dataValue) : defaultColor;
          if (dataValue >= 100) {
            const alertText =
              alertTotalCount > 0
                ? `<circle cx="350" cy="27" r="69" fill="red"/>
            <text x="349" y="35" font-family="Arial" font-size="80" font-weight="bold" fill="white" text-anchor="middle" alignment-baseline="middle">${displayAlertCount}</text>`
                : '';

            style = new Style({
              image: new Icon({
                src:
                  'data:image/svg+xml;utf8,' +
                  encodeURIComponent(`
                  <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                    viewBox="0 0 425 341" width="720" height="720" style="enable-background:new 0 0 425 341;" xml:space="preserve">
                  <style type="text/css">
                    .st0{filter:url(#filter-2);}
                    .st1{fill-rule:evenodd;clip-rule:evenodd;}
                    .st2{fill-rule:evenodd;clip-rule:evenodd;fill:#FFFFFF;stroke:${pinColor};stroke-width:20;}
                    .st3{filter:url(#filter-4);}
                    .st4{fill-rule:evenodd;clip-rule:evenodd;fill:${pinColor};stroke:#FFFFFF;stroke-width:13.4831;}
                    .st5{fill:${pinText};}
                    .st6{font-family:'Arial, sans-serif';}
                    .st7{font-size:100px;}
                  </style>
                  <filter filterUnits="objectBoundingBox" height="145.1%" id="filter-4" width="128.3%" x="-14.2%" y="-20.2%">
                    <feMorphology in="SourceAlpha" operator="dilate" radius="13.4831461" result="shadowSpreadOuter1"></feMorphology>
                    <feOffset dx="0" dy="0" in="shadowSpreadOuter1" result="shadowOffsetOuter1"></feOffset>
                    <feGaussianBlur in="shadowOffsetOuter1" result="shadowBlurOuter1" stdDeviation="11.5"></feGaussianBlur>
                    <feComposite in="shadowBlurOuter1" in2="SourceAlpha" operator="out" result="shadowBlurOuter1"></feComposite>
                    <feColorMatrix in="shadowBlurOuter1" type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.3 0"></feColorMatrix>
                  </filter>
                  <filter filterUnits="objectBoundingBox" height="152.9%" id="filter-2" width="132.2%" x="-16.1%" y="-22.9%">
                    <feMorphology in="SourceAlpha" operator="dilate" radius="20" result="shadowSpreadOuter1"></feMorphology>
                    <feOffset dx="0" dy="0" in="shadowSpreadOuter1" result="shadowOffsetOuter1"></feOffset>
                    <feGaussianBlur in="shadowOffsetOuter1" result="shadowBlurOuter1" stdDeviation="11.5"></feGaussianBlur>
                    <feComposite in="shadowBlurOuter1" in2="SourceAlpha" operator="out" result="shadowBlurOuter1"></feComposite>
                    <feColorMatrix in="shadowBlurOuter1" type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.3 0"></feColorMatrix>
                  </filter>
                  <g id="Featured-Icons">
                    <g id="Icons_x2F_Elections_x2F_20-Copy-80" transform="translate(43, 43)">
                      <g id="Combined-Shape">
                        <g class="st0">
                          <path id="path-1_00000144314130886554237090000009803993643134655914_" class="st1" d="M318.8,0c10.7,0,19.4,8.7,19.4,19.4v153
                            c0,10.7-8.7,19.4-19.4,19.4l-116.8,0l-29.7,46l-29.7-46l-123.6,0c-10.7,0-19.4-8.7-19.4-19.4v-153C-0.5,8.7,8.2,0,18.9,0H318.8z
                            "/>
                        </g>
                        <path class="st2" d="M318.8-10c8.1,0,15.5,3.3,20.8,8.6s8.6,12.7,8.6,20.8v153c0,8.1-3.3,15.5-8.6,20.8
                          c-5.3,5.3-12.7,8.6-20.8,8.6l-111.3,0l-35.2,54.4l-35.2-54.4l-118.1,0c-8.1,0-15.5-3.3-20.8-8.6c-5.3-5.3-8.6-12.7-8.6-20.8v-153
                          c0-8.1,3.3-15.5,8.6-20.8S10.8-10,18.9-10H318.8z"/>
                      </g>
                      <g id="Pin">
                        <g class="st3">
                          <path id="path-3_00000147183521508572621010000011865307549303055779_" class="st1" d="M318.8,0c10.7,0,19.4,8.7,19.4,19.4v153
                            c0,10.7-8.7,19.4-19.4,19.4l-117.8,0l-29.7,46l-29.7-46l-122.6,0c-10.7,0-19.4-8.7-19.4-19.4v-153C-0.5,8.7,8.2,0,18.9,0H318.8z
                            "/>
                        </g>
                        <path class="st4" d="M318.8-6.7c7.2,0,13.8,2.9,18.5,7.7s7.7,11.3,7.7,18.5v153c0,7.2-2.9,13.8-7.7,18.5s-11.3,7.7-18.5,7.7
                          l-114.1,0l-33.4,51.7l-33.4-51.7l-118.9,0c-7.2,0-13.8-2.9-18.5-7.7s-7.7-11.3-7.7-18.5v-153c0-7.2,2.9-13.8,7.7-18.5
                          s11.3-7.7,18.5-7.7H318.8z"/>
                      </g>
                      <text x="162" y="105" text-anchor="middle" dominant-baseline="middle" class="st5 st6 st7">${roundOff(dataValue)}</text>
                    </g>
                    ${alertText}
                  </g>
                </svg>`),
                scale: 0.1,
              }),
              text: new Text({
                text: '',
                fill: new Fill({ color: '#000' }),
              }),
            });

          } else {
            const alertText =
              alertTotalCount > 0
                ? `<circle cx="250" cy="-5" r="65" fill="red"/>
            <text x="250" y="9" font-family="Arial" font-size="65" font-weight="bold" fill="white" text-anchor="middle" alignment-baseline="middle">${displayAlertCount}</text>`
                : '';

            style = new Style({
              image: new Icon({
                src:
                  'data:image/svg+xml;utf8,' +
                  encodeURIComponent(`
                  <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                    viewBox="0 0 550 341" width="900" height="900" style="enable-background:new 0 0 550 341;" xml:space="preserve">
                  <style type="text/css">
                    .st0{fill-rule:evenodd;clip-rule:evenodd;}
                    .st1{fill-rule:evenodd;clip-rule:evenodd;fill:#FFFFFF;stroke:${pinColor};stroke-width:20;}
                    .st2{fill-rule:evenodd;clip-rule:evenodd;fill:${pinColor};stroke:#FFFFFF;stroke-width:13.4831;}
                    .st3{fill:${pinText};}
                    .st4{font-family:'Arial, sans';}
                    .st5{font-size:90px;}
                  </style>
                  <g id="Featured-Icons">
                    <g id="Icons_x2F_Elections_x2F_20-Copy-79" transform="translate(43, 43)">
                      <g id="Combined-Shape">
                        <g>
                          <path id="path-1" class="st0" d="M180.6,0C191.3,0,200,8.7,200,19.4v153c0,10.7-8.7,19.4-19.4,19.4l-47.1,0l-29.7,46l-29.7-46
                            l-54.6,0C8.7,191.9,0,183.2,0,172.4v-153C0,8.7,8.7,0,19.4,0H180.6z"/>
                        </g>
                        <path class="st1" d="M180.6-10c8.1,0,15.5,3.3,20.8,8.6c5.3,5.3,8.6,12.7,8.6,20.8v153c0,8.1-3.3,15.5-8.6,20.8
                          c-5.3,5.3-12.7,8.6-20.8,8.6l-41.6,0l-35.2,54.4l-35.2-54.4l-49.1,0c-8.1,0-15.5-3.3-20.8-8.6c-5.3-5.3-8.6-12.7-8.6-20.8v-153
                          C-10,11.3-6.7,4-1.4-1.4S11.3-10,19.4-10H180.6z"/>
                      </g>
                      <g id="Pin">
                        <g>
                          <path id="path-3" class="st0" d="M180.6,0C191.3,0,200,8.7,200,19.4v153c0,10.7-8.7,19.4-19.4,19.4l-47.1,0l-29.7,46l-29.7-46
                            l-54.6,0C8.7,191.9,0,183.2,0,172.4v-153C0,8.7,8.7,0,19.4,0H180.6z"/>
                        </g>
                        <path class="st2" d="M180.6-6.7c7.2,0,13.8,2.9,18.5,7.7c4.7,4.7,7.7,11.3,7.7,18.5v153c0,7.2-2.9,13.8-7.7,18.5
                          c-4.7,4.7-11.3,7.7-18.5,7.7l-43.4,0l-33.4,51.7l-33.4-51.7l-50.9,0c-7.2,0-13.8-2.9-18.5-7.7s-7.7-11.3-7.7-18.5v-153
                          c0-7.2,2.9-13.8,7.7-18.5s11.3-7.7,18.5-7.7H180.6z"/>
                      </g>
                      <text x="97" y="105" text-anchor="middle" dominant-baseline="middle" class="st3 st4 st5">${roundOff(dataValue)}</text>
                    </g>
                    ${alertText}
                  </g>
                </svg>`),
                scale: 0.1,
              }),
              text: new Text({
                text: '',
                fill: new Fill({ color: '#000' }),
              }),
            });
          }


        }

        return style;
      });
    }
  }, [points, data, dataKey, XYZurl, getColor, defaultColor, pinText, alertCount, getStatus, getDataForDevice, roundOff]);

  useEffect(() => {
    if (selectedPoint && mapInstance.current) {
      const { lat, lng } = selectedPoint;
      const coordinates = fromLonLat([lng, lat]);
      if (zoomBoolean === true) {
        mapInstance.current.getView().animate({ center: coordinates, zoom: zoomInd });
      } else {
        mapInstance.current.getView().animate({ center: coordinates, zoom: 12 });
      }

    }
  }, [selectedPoint, zoomInd, zoomBoolean]);

  useEffect(() => {
    if (mapFit && mapInstance.current && points.length > 0) {
      const extent = boundingExtent(
        points.map(({ lat, lng }) => fromLonLat([lng, lat]))
      );
      mapInstance.current.getView().fit(extent, { duration: 1250, padding: [50, 50, 50, 50] });
    }
  }, [mapFit, points]);

  function onFullscreen(map: any) {
    if (map.current.requestFullscreen) {
      map.current.requestFullscreen();
    } else if (map.current.msRequestFullscreen) {
      map.current.msRequestFullscreen();
    } else if (map.current.mozRequestFullScreen) {
      map.current.mozRequestFullScreen();
    } else if (map.current.webkitRequestFullscreen) {
      map.current.webkitRequestFullscreen();
    }
  }

  return (
    <>
      <div
        className={styles.actions}>
        <button className={styles.zoomOut}
          onClick={() => {
            onMapFitToData(true);
          }}
        ><svg width="18px" height="18px" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" >
          <title>Fit to data</title>Fit to data
            <path d="M0 0h48v48H0z" fill="none" />
            <g id="icoZoomOut">
              <polygon points="41,31.001 41,27.001 27,27.001 27,41.001 31,41.001 31,33.829 40.585,43.414 43.413,40.586 33.828,31.001 	" fill="#808080" />
              <polygon points="31,14.173 31,7.001 27,7.001 27,21.001 41,21.001 41,17.001 33.828,17.001 43.414,7.415 40.586,4.587 	" fill="#808080" />
              <polygon points="7,17.001 7,21.001 21,21.001 21,7.001 17,7.001 17,14.173 7.413,4.586 4.585,7.414 14.172,17.001 	" fill="#808080" />
              <polygon points="7.416,43.417 17,33.833 17,41.001 21,41.001 21,27.001 7,27.001 7,31.001 14.175,31.001 4.588,40.589 	" fill="#808080" />
            </g>
          </svg>
        </button>

        <button className={styles.btnFullscreen}
          onClick={() => {
            onFullscreen(mapRef);
          }}
        >
         <svg fill="#808080" width="18px" height="18px" viewBox="0 0 50 50" version="1.2" baseProfile="tiny" xmlns="http://www.w3.org/2000/svg" overflow="inherit">
         <title>Fullscreen</title>Fullscreen
         <path d="M2 15.758v-13.758h14.299l5.262 4h-8.769l9.208 9.758-5.701 5.242-9.299-8.749v8.769zm31.752-13.758h14.248v13.809l-4 5.261v-8.768l-10.003 9.208-5.364-5.456 8.626-9.054h-8.769zm14.248 31.752v14.248h-14.299l-5.262-4h8.769l-9.208-10.003 5.701-5.364 9.299 8.626v-8.769zm-31.752 14.248h-14.248v-14.299l4-5.262v8.769l10.003-9.208 5.364 5.701-8.626 9.299h8.769z"/></svg>
        </button>
      </div>

      <div ref={mapRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
        <div id="popup" style={{ position: 'absolute' }} />
        <Popup coordinate={popupCoordinate} content={popupContent} />
      </div>
    </>
  )
};

export default MapComponent;
