import React, { useEffect, useState } from 'react';
import { SimpleOptions } from 'types';
import { css } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import { PanelDataErrorView } from '@grafana/runtime';
import MapComponent from './MapComponent';
import MenuPane from './MenuPane';
import { DataFrame, FieldType, PanelProps } from '@grafana/data';

interface Props extends PanelProps<SimpleOptions> { }

const getStyles = () => {
  return {
    wrapper: css`
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      height: 100%;
      @media (max-width: 1200px) {
      flex-direction:column;
      }
    `,
    aside: css`
      flex-basis: 30%;
      height: 100%;
      width:100%;
      overflow-y: auto;
      padding-right: 10px;
      @media (max-width:1200px) {
      width:100%;
      flex-basis:100%;
      }
    `,
    section: css`
      flex-basis: 70%;
      height: 100%;
      width:100%;
      @media (max-width: 1200px) {
      width:100%;
      flex-basis:100%;
      margin-top:25px;
      position: relative;
      }
    `,
    wrapperMobile: css`
      display: flex;
      height:100%
      flex-basis: 100%;
      flex-direction: column;
    `,
    sectionMobile: css`
      flex-basis: 50%;
      height:100%;
      width:100%;
      margin-top:25px;
      position: relative;
      }     
    `,
    asideMobile: css`
      flex-basis: 50%;
      height:100%;
      width:100%;
      overflow-y: auto;
      }     
    `,
  };
};

export const SimplePanel: React.FC<Props> = ({ options, data, width, height, fieldConfig, id }) => {
  const styles = useStyles2(getStyles);
  const [points, setPoints] = useState<Array<{ lat: number; lng: number; deviceid: string }>>([]);
  const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number; deviceid: string } | null>(null);
  const [mapFit, setMapFit] = useState(false);
  const [expandCardDetail, setExpandCardDetail] = useState('');
  const { header, dataKey, unit, XYZurl, type, colorPairs, zoomInd, zoomBoolean, dataUnits, defColor, pinText } = options;

  useEffect(() => {
    setPoints(extractPoints(data.series));
  }, [data.series]);

  if (data.series.length === 0) {
    return <PanelDataErrorView fieldConfig={fieldConfig} panelId={id} data={data} needsStringField />;
  }

  const extractPoints = (data: DataFrame[]) => {
    const extractedPoints: Array<{ lat: number; lng: number; deviceid: string }> = [];
    data.forEach((frame) => {
      const latField = frame.fields.find((f) => f.name === 'lat');
      const lngField = frame.fields.find((f) => f.name === 'lng');
      const deviceidField = frame.fields.find((f) => f.name === 'deviceid');
      if (
        latField &&
        lngField &&
        deviceidField &&
        latField.type === FieldType.number &&
        lngField.type === FieldType.number &&
        deviceidField.type === FieldType.string
      ) {
        const latValues = Array.from(latField.values);
        const lngValues = Array.from(lngField.values);
        const deviceidValues = Array.from(deviceidField.values);
        latValues.forEach((lat, i) => {
          extractedPoints.push({ lat, lng: lngValues[i], deviceid: deviceidValues[i] });
        });
      }
    });
    return extractedPoints;
  };

  const handleLocationClick = (deviceid: any) => {
    setExpandCardDetail(deviceid);
  };

  const handleMenuClick = (lat: number, lng: number, deviceid: string) => {
    setSelectedPoint({ lat, lng, deviceid });
  };

  const mapFitToData = (option: boolean) => {
    setMapFit(option);
    setTimeout(() => {
      setMapFit(false);
    }, 500);
  };

  return (
    <div className={(width > 1200) ? styles.wrapper : styles.wrapperMobile} style={{ height }}>
      <aside className={(width > 1200) ? styles.aside : styles.asideMobile}>
        <MenuPane
          data={data.series}
          onMenuClick={handleMenuClick}
          onMapFitToData={mapFitToData}
          selectedDeviceId={selectedPoint?.deviceid}
          dataKey={dataKey}
          unit={unit}
          expandCardDetail={expandCardDetail}
          setExpandCardDetail={setExpandCardDetail}
          colorPairsList={colorPairs}
          headerText={header}
          dataUnits={dataUnits || {}}
          defaultColor={defColor}
        />
      </aside>
      <section className={(width > 1200) ? styles.section : styles.sectionMobile}>
        <MapComponent
          points={points}
          onLocationClick={handleLocationClick}
          selectedPoint={selectedPoint}
          XYZurl={XYZurl}
          type={type}
          mapFit={mapFit}
          dataKey={dataKey}
          colorPairsList={colorPairs}
          data={data.series}
          zoomBoolean={zoomBoolean}
          zoomInd={zoomInd}
          defaultColor={defColor}
          onMapFitToData={mapFitToData}
          pinText={pinText}
          unit={unit}
        />
      </section>
    </div>
  );
};
